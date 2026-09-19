import { requireUserId } from "@/lib/auth";
import { calcLineCost, calcLineSubtotal } from "@/lib/line-items";
import { supabase } from "@/lib/supabase";
import type { Job, LineItem } from "@/types/entities";

async function nextJobNumber(): Promise<string> {
  const user_id = await requireUserId();
  const { count } = await supabase.from("mp_jobs").select("*", { count: "exact", head: true }).eq("user_id", user_id);
  const num = (count ?? 0) + 1;
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

export async function createJob(input: {
  client_id?: string | null;
  quote_id?: string | null;
  title?: string;
  line_items?: LineItem[];
  status?: Job["status"];
  notes?: string;
}): Promise<Job> {
  const user_id = await requireUserId();
  const line_items = input.line_items ?? [];
  const number = await nextJobNumber();
  const { data, error } = await supabase
    .from("mp_jobs")
    .insert({
      user_id,
      client_id: input.client_id ?? null,
      quote_id: input.quote_id ?? null,
      number,
      title: input.title ?? "",
      line_items,
      subtotal_cost: calcLineCost(line_items),
      subtotal_price: calcLineSubtotal(line_items),
      status: input.status ?? "scheduled",
      notes: input.notes ?? "",
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as Job;
}

export async function updateJob(id: string, input: Partial<Job>): Promise<Job> {
  const line_items = input.line_items;
  const extras =
    line_items !== undefined
      ? { subtotal_cost: calcLineCost(line_items), subtotal_price: calcLineSubtotal(line_items) }
      : {};
  const { data, error } = await supabase
    .from("mp_jobs")
    .update({ ...input, ...extras })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as Job;
}

export async function deleteJob(id: string): Promise<void> {
  const { error } = await supabase.from("mp_jobs").delete().eq("id", id);
  if (error) throw error;
}
