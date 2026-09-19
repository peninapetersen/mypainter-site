import { requireUserId } from "@/lib/auth";
import { DEFAULT_INVOICE_CONTRACT } from "@/lib/invoice-defaults";
import { calcLineSubtotal, calcQuoteTotals, todayIsoDate } from "@/lib/line-items";
import { supabase } from "@/lib/supabase";
import type { Invoice, LineItem } from "@/types/entities";

async function nextInvoiceNum(): Promise<number> {
  const user_id = await requireUserId();
  const { count } = await supabase.from("mp_invoices").select("*", { count: "exact", head: true }).eq("user_id", user_id);
  return (count ?? 0) + 1;
}

export async function peekInvoiceNumber(): Promise<string> {
  const num = await nextInvoiceNum();
  return String(num);
}

async function nextInvoiceNumber(): Promise<string> {
  const num = await nextInvoiceNum();
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
  quote_id?: string | null;
  request_id?: string | null;
  subject?: string;
  issued_date?: string | null;
  payment_terms?: string;
  line_items?: LineItem[];
  discount?: number;
  gstRegistered?: boolean;
  client_message?: string;
  contract?: string;
  internal_notes?: string;
  status?: Invoice["status"];
}): Promise<Invoice> {
  const user_id = await requireUserId();
  const line_items = input.line_items ?? [];
  const discount = input.discount ?? 0;
  const subtotal = calcLineSubtotal(line_items);
  const { gst, total } = calcQuoteTotals(subtotal, discount, input.gstRegistered ?? false);
  const number = await nextInvoiceNumber();
  const { data, error } = await supabase
    .from("mp_invoices")
    .insert({
      user_id,
      client_id: input.client_id ?? null,
      job_id: input.job_id ?? null,
      quote_id: input.quote_id ?? null,
      request_id: input.request_id ?? null,
      number,
      subject: input.subject ?? "For Services Rendered",
      issued_date: input.issued_date ?? todayIsoDate(),
      payment_terms: input.payment_terms ?? "Due upon receipt",
      line_items,
      discount,
      subtotal,
      gst,
      total,
      balance: total,
      client_message: input.client_message ?? "",
      contract: input.contract ?? DEFAULT_INVOICE_CONTRACT,
      internal_notes: input.internal_notes ?? "",
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
  const discount = input.discount ?? 0;
  let totals: Record<string, number> = {};
  if (line_items) {
    const subtotal = calcLineSubtotal(line_items);
    totals = calcQuoteTotals(subtotal, discount, input.gstRegistered ?? (Number(input.gst) > 0));
  }
  const { gstRegistered: _, ...rest } = input;
  const patch: Record<string, unknown> = { ...rest, ...totals };
  if (input.status === "paid" && !input.paid_at) {
    patch.paid_at = new Date().toISOString();
    patch.balance = 0;
  } else if (totals.total !== undefined && input.status !== "paid") {
    patch.balance = totals.total;
  }
  const { data, error } = await supabase.from("mp_invoices").update(patch).eq("id", id).select("*").single();
  if (error) throw error;
  return data as Invoice;
}

export async function deleteInvoice(id: string): Promise<void> {
  const { error } = await supabase.from("mp_invoices").delete().eq("id", id);
  if (error) throw error;
}
