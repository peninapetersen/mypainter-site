import { requireUserId } from "@/lib/auth";
import { calcLineSubtotal, calcQuoteTotals, todayIsoDate } from "@/lib/line-items";
import { supabase } from "@/lib/supabase";
import type { Invoice, LineItem } from "@/types/entities";

async function nextInvoiceNumber(): Promise<string> {
  const user_id = await requireUserId();
  const { count } = await supabase.from("mp_invoices").select("*", { count: "exact", head: true }).eq("user_id", user_id);
  const num = (count ?? 0) + 1;
  return `INV-${String(num).padStart(3, "0")}`;
}

export async function listInvoices(): Promise<Invoice[]> {
  const { data, error } = await supabase.from("mp_invoices").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Invoice[];
}

export async function getInvoice(id: string): Promise<Invoice | null> {
  const { data, error } = await supabase.from("mp_invoices").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as Invoice | null;
}

export async function createInvoice(input: {
  client_id?: string | null;
  job_id?: string | null;
  subject?: string;
  line_items?: LineItem[];
  gstRegistered?: boolean;
  payment_terms?: string;
  status?: Invoice["status"];
}): Promise<Invoice> {
  const user_id = await requireUserId();
  const line_items = input.line_items ?? [];
  const subtotal = calcLineSubtotal(line_items);
  const { gst, total } = calcQuoteTotals(subtotal, 0, input.gstRegistered ?? false);
  const number = await nextInvoiceNumber();
  const { data, error } = await supabase
    .from("mp_invoices")
    .insert({
      user_id,
      client_id: input.client_id ?? null,
      job_id: input.job_id ?? null,
      number,
      subject: input.subject ?? "For Services Rendered",
      issued_date: todayIsoDate(),
      payment_terms: input.payment_terms ?? "Due on receipt",
      line_items,
      subtotal,
      gst,
      total,
      balance: total,
      status: input.status ?? "draft",
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as Invoice;
}

export async function updateInvoice(
  id: string,
  input: Partial<Invoice> & { gstRegistered?: boolean },
): Promise<Invoice> {
  const line_items = input.line_items;
  let totals = {};
  if (line_items) {
    const subtotal = calcLineSubtotal(line_items);
    totals = calcQuoteTotals(subtotal, 0, input.gstRegistered ?? input.gst > 0);
  }
  const { gstRegistered: _, ...rest } = input;
  const patch = { ...rest, ...totals };
  if (input.status === "paid" && !input.paid_at) {
    patch.paid_at = new Date().toISOString();
    patch.balance = 0;
  }
  const { data, error } = await supabase.from("mp_invoices").update(patch).eq("id", id).select("*").single();
  if (error) throw error;
  return data as Invoice;
}

export async function deleteInvoice(id: string): Promise<void> {
  const { error } = await supabase.from("mp_invoices").delete().eq("id", id);
  if (error) throw error;
}
