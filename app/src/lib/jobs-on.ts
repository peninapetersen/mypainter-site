import { requireUserId } from "@/lib/auth";
import { calcLineSubtotal } from "@/lib/line-items";
import { supabase } from "@/lib/supabase";
import type { JobOn, LineItem, Quote } from "@/types/entities";

async function nextJobsOnNum(): Promise<number> {
  const user_id = await requireUserId();
  const { count } = await supabase.from("mp_jobs_on").select("*", { count: "exact", head: true }).eq("user_id", user_id);
  return (count ?? 0) + 1;
}

export async function peekJobsOnNumber(): Promise<string> {
  const num = await nextJobsOnNum();
  return `ON-${String(num).padStart(3, "0")}`;
}

export async function listJobsOn(): Promise<JobOn[]> {
  const { data, error } = await supabase.from("mp_jobs_on").select("*").order("approved_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as JobOn[];
}

export async function getJobsOn(id: string): Promise<JobOn | null> {
  const { data, error } = await supabase.from("mp_jobs_on").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as JobOn | null;
}

export async function getJobsOnByQuote(quoteId: string): Promise<JobOn | null> {
  const { data, error } = await supabase.from("mp_jobs_on").select("*").eq("quote_id", quoteId).maybeSingle();
  if (error) throw error;
  return data as JobOn | null;
}

const OPTIONAL_JOBS_ON_COLUMNS = ["lead_id", "quote_id", "request_id", "site_address", "line_items", "notes"] as const;

async function insertJobsOnRow(row: Record<string, unknown>): Promise<JobOn> {
  const { data, error } = await supabase.from("mp_jobs_on").insert(row).select("*").single();
  if (!error) return data as JobOn;
  if (/column|schema cache|PGRST204/i.test(error.message)) {
    const basic = { ...row };
    for (const key of OPTIONAL_JOBS_ON_COLUMNS) delete basic[key];
    const { data: data2, error: error2 } = await supabase.from("mp_jobs_on").insert(basic).select("*").single();
    if (error2) throw error2;
    return data2 as JobOn;
  }
  throw error;
}

/** Create Jobs On when customer approves a quote (also used from admin if needed). */
export async function createJobsOnFromQuote(input: {
  quote: Quote;
  lead_id?: string | null;
  site_address?: string;
  notes?: string;
}): Promise<JobOn> {
  const user_id = await requireUserId();
  const { quote } = input;
  const existing = await getJobsOnByQuote(quote.id);
  if (existing) return existing;

  const num = await nextJobsOnNum();
  const line_items = (quote.line_items ?? []).filter((li: LineItem) => !li.isText);

  return insertJobsOnRow({
    user_id,
    lead_id: input.lead_id ?? null,
    quote_id: quote.id,
    request_id: quote.request_id,
    client_id: quote.client_id,
    number: `ON-${String(num).padStart(3, "0")}`,
    title: quote.title || `Job ${quote.number}`,
    site_address: input.site_address ?? "",
    line_items,
    notes: input.notes ?? "",
    status: "active",
    approved_at: new Date().toISOString(),
  });
}

export async function updateJobsOn(id: string, input: Partial<JobOn>): Promise<JobOn> {
  const { data, error } = await supabase.from("mp_jobs_on").update(input).eq("id", id).select("*").single();
  if (error) throw error;
  return data as JobOn;
}

export async function deleteJobsOn(id: string): Promise<void> {
  const { error } = await supabase.from("mp_jobs_on").delete().eq("id", id);
  if (error) throw error;
}

export function jobsOnDealValue(j: JobOn): number {
  return calcLineSubtotal(j.line_items ?? []);
}
