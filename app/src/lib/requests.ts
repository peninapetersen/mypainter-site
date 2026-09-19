import { requireUserId } from "@/lib/auth";
import { calcLineSubtotal } from "@/lib/line-items";
import { supabase } from "@/lib/supabase";
import type { LineItem, Request } from "@/types/entities";

export async function listRequests(): Promise<Request[]> {
  const { data, error } = await supabase.from("mp_requests").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Request[];
}

export async function getRequest(id: string): Promise<Request | null> {
  const { data, error } = await supabase.from("mp_requests").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as Request | null;
}

export async function createRequest(input: {
  client_id?: string | null;
  title?: string;
  requested_on?: string | null;
  service_details?: string;
  images?: { path: string; caption?: string }[];
  assessment_at?: string | null;
  line_items?: LineItem[];
  status?: Request["status"];
  internal_notes?: string;
}): Promise<Request> {
  const user_id = await requireUserId();
  const line_items = input.line_items ?? [];
  const subtotal = calcLineSubtotal(line_items);
  const { data, error } = await supabase
    .from("mp_requests")
    .insert({
      user_id,
      client_id: input.client_id ?? null,
      title: input.title ?? "",
      requested_on: input.requested_on ?? null,
      service_details: input.service_details ?? "",
      images: input.images ?? [],
      assessment_at: input.assessment_at ?? null,
      line_items,
      subtotal,
      status: input.status ?? "open",
      internal_notes: input.internal_notes ?? "",
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as Request;
}

export async function updateRequest(id: string, input: Partial<Request>): Promise<Request> {
  const line_items = input.line_items;
  const subtotal = line_items ? calcLineSubtotal(line_items) : undefined;
  const { data, error } = await supabase
    .from("mp_requests")
    .update({ ...input, ...(subtotal !== undefined ? { subtotal } : {}) })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as Request;
}

export async function deleteRequest(id: string): Promise<void> {
  const { error } = await supabase.from("mp_requests").delete().eq("id", id);
  if (error) throw error;
}
