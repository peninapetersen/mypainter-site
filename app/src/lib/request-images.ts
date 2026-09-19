import { requireUserId } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

const BUCKET = "mypainter-gallery";
const MAX_IMAGES = 10;

export async function uploadRequestImage(file: File, folderId: string): Promise<string> {
  const user_id = await requireUserId();
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `request-images/${user_id}/${folderId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
  if (error) throw error;
  return path;
}

export async function getRequestImageUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
  if (error || !data?.signedUrl) throw error ?? new Error("Could not load image");
  return data.signedUrl;
}

export { MAX_IMAGES };
