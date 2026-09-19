import { requireUserId } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

const BUCKET = "mypainter-receipts";

export async function uploadReceiptImage(file: File, expenseId: string): Promise<string> {
  const user_id = await requireUserId();
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${user_id}/${expenseId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false, contentType: file.type });
  if (error) throw error;
  return path;
}

export async function getReceiptImageUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
  if (error || !data?.signedUrl) throw error ?? new Error("Could not load receipt");
  return data.signedUrl;
}

export async function fileToBase64(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export { BUCKET };
