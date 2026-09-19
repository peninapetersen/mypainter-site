import { requireUserId } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import type { GalleryImage } from "@/types/entities";

export const GALLERY_BUCKET = "mypainter-gallery";
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export type { GalleryImage };

function storageErrorMessage(err: { message?: string }): string {
  const msg = err.message ?? "Upload failed";
  if (msg.includes("Bucket not found") || msg.includes("not found")) {
    return "Image storage not set up — run migration 008 in Supabase SQL Editor.";
  }
  if (msg.includes("payload too large") || msg.includes("413")) {
    return "Image too large — try under 10 MB.";
  }
  return msg;
}

export async function prepareImageFile(file: File, maxDim = 1920): Promise<File> {
  if (file.size <= 2_000_000 && file.type.startsWith("image/")) return file;
  if (!file.type.startsWith("image/")) return file;

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
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
        0.88,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
}

/** Square crop from canvas source coordinates. */
export async function cropSquareToFile(
  image: HTMLImageElement,
  sx: number,
  sy: number,
  size: number,
  fileName = "headshot.jpg",
): Promise<File> {
  const canvas = document.createElement("canvas");
  const out = 512;
  canvas.width = out;
  canvas.height = out;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not crop image");
  ctx.drawImage(image, sx, sy, size, size, 0, 0, out, out);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Crop failed"));
          return;
        }
        resolve(new File([blob], fileName, { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.9,
    );
  });
}

export async function uploadGalleryImage(
  file: File,
  folder: string,
  folderId: string,
): Promise<string> {
  if (file.size > MAX_IMAGE_BYTES) throw new Error("Image too large — maximum 10 MB.");
  const user_id = await requireUserId();
  const prepared = await prepareImageFile(file);
  const ext = prepared.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${folder}/${user_id}/${folderId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await getSupabase()
    .storage.from(GALLERY_BUCKET)
    .upload(path, prepared, { upsert: false, contentType: prepared.type || "image/jpeg" });
  if (error) throw new Error(storageErrorMessage(error));
  return path;
}

export async function getGalleryImageUrl(path: string): Promise<string> {
  if (!path) return "";
  const { data, error } = await getSupabase().storage.from(GALLERY_BUCKET).createSignedUrl(path, 3600);
  if (error || !data?.signedUrl) throw error ?? new Error("Could not load image");
  return data.signedUrl;
}

/** Fetch favicon / og:image from a website URL and store in gallery. */
export async function fetchLogoFromWebsite(website: string): Promise<{ path: string; previewUrl: string }> {
  const { data } = await getSupabase().auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Not signed in");

  const res = await fetch("/api/suppliers/fetch-logo", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ website }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || "Could not fetch logo");
  return body as { path: string; previewUrl: string };
}

/** @deprecated use fetchLogoFromWebsite */
export const fetchSupplierLogoFromWebsite = fetchLogoFromWebsite;
