import { requireUserId } from "@/lib/auth";
import { calcLineCost, calcLineSubtotal } from "@/lib/line-items";
import { supabase } from "@/lib/supabase";
import { defaultBillingFlags } from "@/lib/job-defaults";
import type { Job, JobBillingFlags, JobChecklist, JobVisit, LineItem } from "@/types/entities";

async function nextJobNum(): Promise<number> {
  const user_id = await requireUserId();
  const { count } = await supabase.from("mp_jobs").select("*", { count: "exact", head: true }).eq("user_id", user_id);
  return (count ?? 0) + 1;
}

export async function peekJobNumber(): Promise<string> {
  const num = await nextJobNum();
  return String(num);
}

async function nextJobNumber(): Promise<string> {
  const num = await nextJobNum();
  return `JOB-${String(num).padStart(3, "0")}`;
}

export async function listJobs(): Promise<Job[]> {
  const { data, error } = await supabase.from("mp_jobs").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Job[];
}

export async function getJob(id: string): Promise<Job | null> {
  const { data, error } = await supabase.from("mp_jobs").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as Job | null;
}

const OPTIONAL_JOB_COLUMNS = ["request_id", "site_address", "checklists"] as const;

async function insertJobRow(row: Record<string, unknown>): Promise<Job> {
  const { data, error } = await supabase.from("mp_jobs").insert(row).select("*").single();
  if (!error) return data as Job;
  if (/column|schema cache|PGRST204/i.test(error.message)) {
    const basic = { ...row };
    for (const key of OPTIONAL_JOB_COLUMNS) delete basic[key];
    const { data: data2, error: error2 } = await supabase.from("mp_jobs").insert(basic).select("*").single();
    if (error2) throw error2;
    return data2 as Job;
  }
  throw error;
}

export async function createJob(input: {
  client_id?: string | null;
  quote_id?: string | null;
  request_id?: string | null;
  title?: string;
  line_items?: LineItem[];
  visits?: JobVisit[];
  checklists?: JobChecklist[];
  billing_flags?: JobBillingFlags;
  status?: Job["status"];
  site_address?: string;
  notes?: string;
}): Promise<Job> {
  const user_id = await requireUserId();
  const line_items = input.line_items ?? [];
  const number = await nextJobNumber();
  return insertJobRow({
    user_id,
    client_id: input.client_id ?? null,
    quote_id: input.quote_id ?? null,
    request_id: input.request_id ?? null,
    number,
    title: input.title ?? "",
    visits: input.visits ?? [],
    checklists: input.checklists ?? [],
    billing_flags: input.billing_flags ?? defaultBillingFlags(),
    line_items,
    subtotal_cost: calcLineCost(line_items),
    subtotal_price: calcLineSubtotal(line_items),
    status: input.status ?? "scheduled",
    site_address: input.site_address ?? "",
    notes: input.notes ?? "",
  });
}

export async function updateJob(id: string, input: Partial<Job>): Promise<Job> {
  const line_items = input.line_items;
  const extras =
    line_items !== undefined
      ? { subtotal_cost: calcLineCost(line_items), subtotal_price: calcLineSubtotal(line_items) }
      : {};
  const patch = { ...input, ...extras };
  const { data, error } = await supabase.from("mp_jobs").update(patch).eq("id", id).select("*").single();
  if (!error) return data as Job;
  if (/column|schema cache|PGRST204/i.test(error.message)) {
    const basic = { ...patch } as Record<string, unknown>;
    for (const key of OPTIONAL_JOB_COLUMNS) delete basic[key];
    const { data: data2, error: error2 } = await supabase
      .from("mp_jobs")
      .update(basic)
      .eq("id", id)
      .select("*")
      .single();
    if (error2) throw error2;
    return data2 as Job;
  }
  throw error;
}

export async function deleteJob(id: string): Promise<void> {
  const { error } = await supabase.from("mp_jobs").delete().eq("id", id);
  if (error) throw error;
}
