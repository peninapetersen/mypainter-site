import { requireUserId } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

const BUCKET = "mypainter-gallery";
const MAX_IMAGES = 10;
const MAX_BYTES = 10 * 1024 * 1024;

function storageErrorMessage(err: { message?: string }): string {
  const msg = err.message ?? "Upload failed";
  if (msg.includes("Bucket not found") || msg.includes("not found")) {
    return "Image storage not set up — run migration 008 in Supabase SQL Editor.";
  }
  if (msg.includes("payload too large") || msg.includes("413")) {
    return "Image too large — try a photo under 10 MB.";
  }
  if (msg.includes("mime") || msg.includes("Invalid")) {
    return "That file type is not supported — use JPG or PNG.";
  }
  return msg;
}

/** Resize/compress large photos before upload (mobile camera shots). */
export async function prepareRequestImage(file: File): Promise<File> {
  if (file.size <= 2_000_000) return file;
  if (!file.type.startsWith("image/")) return file;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const max = 1920;
      let { width, height } = img;
      if (width > max || height > max) {
        if (width > height) {
          height = Math.round((height * max) / width);
          width = max;
        } else {
          width = Math.round((width * max) / height);
          height = max;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          resolve(new File([blob], file.name.replace(/\.\w+$/, ".jpg") || "photo.jpg", { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.85,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
}

async function uploadDirect(file: File, folderId: string, userId: string): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `request-images/${userId}/${folderId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await getSupabase()
    .storage.from(BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type || "image/jpeg" });
  if (error) throw new Error(storageErrorMessage(error));
  return path;
}

async function uploadViaApi(file: File, folderId: string): Promise<string> {
  const { data } = await getSupabase().auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Not signed in");

  const form = new FormData();
  form.append("file", file);
  form.append("folderId", folderId);

  const res = await fetch("/api/requests/upload-image", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || "Upload failed");
  return body.path as string;
}

export async function uploadRequestImage(file: File, folderId: string): Promise<string> {
  if (file.size > MAX_BYTES) {
    throw new Error("Image too large — maximum 10 MB.");
  }
  const user_id = await requireUserId();
  const prepared = await prepareRequestImage(file);

  try {
    return await uploadDirect(prepared, folderId, user_id);
  } catch (directErr) {
    try {
      return await uploadViaApi(prepared, folderId);
    } catch {
      throw directErr instanceof Error ? directErr : new Error("Upload failed");
    }
  }
}

export async function getRequestImageUrl(path: string): Promise<string> {
  const { data, error } = await getSupabase().storage.from(BUCKET).createSignedUrl(path, 3600);
  if (error || !data?.signedUrl) throw error ?? new Error("Could not load image");
  return data.signedUrl;
}

export { MAX_IMAGES, BUCKET };
