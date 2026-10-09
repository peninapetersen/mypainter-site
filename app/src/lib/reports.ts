import { requireUserId } from "@/lib/auth";
import { prepareImageFile } from "@/lib/app-images";
import { supabase } from "@/lib/supabase";
import { getQuote } from "@/lib/quotes";
import type { Report, ReportArea } from "@/types/entities";

export const REPORT_BUCKET = "mypainter-reports";

const REPORT_UPDATE_KEYS = [
  "client_id",
  "title",
  "report_date",
  "site_address",
  "summary",
  "areas",
  "recommendations",
  "internal_notes",
] as const satisfies readonly (keyof Report)[];

export function newArea(): ReportArea {
  return { id: crypto.randomUUID(), area: "", finding: "", recommended: "", photos: [] };
}

export async function peekReportNumber(): Promise<string> {
  const user_id = await requireUserId();
  const { data: seq } = await supabase.from("mp_report_seq").select("next_num").eq("user_id", user_id).maybeSingle();
  return `R-${seq?.next_num ?? 1}`;
}

async function nextReportNumber(): Promise<string> {
  const user_id = await requireUserId();
  const { data: seq } = await supabase.from("mp_report_seq").select("next_num").eq("user_id", user_id).maybeSingle();
  const num = seq?.next_num ?? 1;
  if (!seq) {
    await supabase.from("mp_report_seq").insert({ user_id, next_num: num + 1 });
  } else {
    await supabase.from("mp_report_seq").update({ next_num: num + 1 }).eq("user_id", user_id);
  }
  return `R-${num}`;
}

export async function listReports(): Promise<Report[]> {
  const { data, error } = await supabase.from("mp_reports").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Report[];
}

export async function getReport(id: string): Promise<Report | null> {
  const { data, error } = await supabase.from("mp_reports").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as Report | null;
}

export async function createReport(input: Partial<Report>): Promise<Report> {
  const user_id = await requireUserId();
  const number = await nextReportNumber();
  const row: Record<string, unknown> = { user_id, number };
  for (const key of REPORT_UPDATE_KEYS) {
    if (input[key] !== undefined) row[key] = input[key];
  }
  if (input.quote_id) row.quote_id = input.quote_id;
  if (input.id) row.id = input.id; // the form picks the id up front so photos can be filed under it
  const { data, error } = await supabase.from("mp_reports").insert(row).select("*").single();
  if (error) throw error;
  return data as Report;
}

export async function updateReport(id: string, input: Partial<Report>): Promise<Report> {
  const patch: Record<string, unknown> = {};
  for (const key of REPORT_UPDATE_KEYS) {
    if (input[key] !== undefined) patch[key] = input[key];
  }
  const { data, error } = await supabase.from("mp_reports").update(patch).eq("id", id).select("*").single();
  if (error) throw error;
  return data as Report;
}

export async function deleteReport(id: string): Promise<void> {
  const { error } = await supabase.from("mp_reports").delete().eq("id", id);
  if (error) throw error;
}

export function reportViewUrl(token: string, origin: string): string {
  return `${origin.replace(/\/$/, "")}/report-view.html?token=${token}`;
}

function newViewToken(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

/** Create the customer link (if needed) and mark the report sent. */
export async function sendReportToCustomer(id: string, origin: string): Promise<{ url: string; token: string }> {
  const existing = await getReport(id);
  if (!existing) throw new Error("Report not found");
  const token = existing.view_token || newViewToken();
  const { error } = await supabase
    .from("mp_reports")
    .update({ status: "sent", view_token: token, sent_at: existing.sent_at ?? new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
  return { url: reportViewUrl(token, origin), token };
}

/** Link for print / copy without marking sent. */
export async function ensureReportViewLink(id: string, origin: string): Promise<{ url: string; token: string }> {
  const existing = await getReport(id);
  if (!existing) throw new Error("Report not found");
  const token = existing.view_token || newViewToken();
  if (!existing.view_token) {
    const { error } = await supabase.from("mp_reports").update({ view_token: token }).eq("id", id);
    if (error) throw error;
  }
  return { url: reportViewUrl(token, origin), token };
}

/** Start a report from a quote: client, address and title carried over, no prices. */
export async function createReportFromQuote(quoteId: string, siteAddress = ""): Promise<Report> {
  const quote = await getQuote(quoteId);
  if (!quote) throw new Error("Quote not found");
  const areas: ReportArea[] = (quote.line_items ?? [])
    .filter((li) => !li.isText && li.name?.trim())
    .map((li) => ({ ...newArea(), area: li.name.trim(), recommended: li.description?.trim() ?? "" }));
  return createReport({
    client_id: quote.client_id,
    quote_id: quote.id,
    title: quote.title,
    report_date: new Date().toISOString().slice(0, 10),
    site_address: siteAddress,
    areas,
  });
}

export async function uploadReportPhoto(file: File, reportId: string): Promise<string> {
  const user_id = await requireUserId();
  const prepared = await prepareImageFile(file);
  const ext = (prepared.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${user_id}/${reportId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(REPORT_BUCKET).upload(path, prepared, { upsert: false, contentType: prepared.type || "image/jpeg" });
  if (error) throw error;
  return path;
}

export async function removeReportPhoto(path: string): Promise<void> {
  await supabase.storage.from(REPORT_BUCKET).remove([path]);
}

export async function reportPhotoUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(REPORT_BUCKET).createSignedUrl(path, 3600);
  if (error || !data?.signedUrl) throw error ?? new Error("Could not load photo");
  return data.signedUrl;
}
