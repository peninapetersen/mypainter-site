import { supabase } from "@/lib/supabase";
import type { ReceiptScanResult } from "@/types/entities";

export async function scanReceiptImage(file: File): Promise<{ scan: ReceiptScanResult; raw: Record<string, unknown> }> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Not signed in");

  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  const imageBase64 = btoa(binary);

  const res = await fetch("/api/expenses/scan-receipt", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ imageBase64, mimeType: file.type || "image/jpeg" }),
  });

  const json = (await res.json()) as { scan?: ReceiptScanResult; raw?: Record<string, unknown>; error?: string };
  if (!res.ok) throw new Error(json.error || "Could not read receipt");
  if (!json.scan) throw new Error("No data returned from receipt scan");
  return { scan: json.scan, raw: json.raw ?? json.scan };
}
