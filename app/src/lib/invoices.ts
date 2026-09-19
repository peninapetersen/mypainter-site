import { requireUserId } from "@/lib/auth";
import { DEFAULT_INVOICE_CONTRACT } from "@/lib/invoice-defaults";
import { calcLineSubtotal, calcQuoteTotals, todayIsoDate } from "@/lib/line-items";
import { supabase } from "@/lib/supabase";
import { resolveGstRate } from "@/lib/tax";
import { getWorkSettings } from "@/lib/work-settings";
import type { Invoice, LineItem } from "@/types/entities";

const OPTIONAL_INVOICE_COLUMNS = [
  "quote_id",
  "request_id",
  "jobs_on_id",
  "discount",
  "client_message",
  "contract",
  "internal_notes",
  "testimonial_token",
  "sent_at",
] as const;

function isSchemaColumnError(message: string): boolean {
  return /column|schema cache|PGRST204|invalid input syntax for type date/i.test(message);
}

/** Postgres date columns reject "" — treat blank as null (create defaults to today). */
function resolveIssuedDate(value?: string | null, forCreate = false): string | null {
  const trimmed = value?.trim();
  if (trimmed) return trimmed;
  return forCreate ? todayIsoDate() : null;
}

function stripOptionalInvoiceColumns(row: Record<string, unknown>): Record<string, unknown> {
  const basic = { ...row };
  for (const key of OPTIONAL_INVOICE_COLUMNS) delete basic[key];
  return basic;
}

async function insertInvoiceRow(row: Record<string, unknown>): Promise<Invoice> {
  const { data, error } = await supabase.from("mp_invoices").insert(row).select("*").single();
  if (!error) return data as Invoice;
  if (isSchemaColumnError(error.message)) {
    const { data: data2, error: error2 } = await supabase
      .from("mp_invoices")
      .insert(stripOptionalInvoiceColumns(row))
      .select("*")
      .single();
    if (error2) throw error2;
    return data2 as Invoice;
  }
  throw error;
}

async function patchInvoiceRow(id: string, patch: Record<string, unknown>): Promise<Invoice> {
  const { data, error } = await supabase.from("mp_invoices").update(patch).eq("id", id).select("*").single();
  if (!error) return data as Invoice;
  if (isSchemaColumnError(error.message)) {
    const { data: data2, error: error2 } = await supabase
      .from("mp_invoices")
      .update(stripOptionalInvoiceColumns(patch))
      .eq("id", id)
      .select("*")
      .single();
    if (error2) throw error2;
    return data2 as Invoice;
  }
  throw error;
}

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
  jobs_on_id?: string | null;
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
  const ws = await getWorkSettings().catch(() => null);
  const gstRate = resolveGstRate(ws);
  const gstOn = input.gstRegistered ?? ws?.gst_default_on_invoices ?? false;
  const { gst, total } = calcQuoteTotals(subtotal, discount, gstOn, gstRate);
  const number = await nextInvoiceNumber();
  return insertInvoiceRow({
    user_id,
    client_id: input.client_id ?? null,
    job_id: input.job_id ?? null,
    jobs_on_id: input.jobs_on_id ?? null,
    quote_id: input.quote_id ?? null,
    request_id: input.request_id ?? null,
    number,
    subject: input.subject ?? "For Services Rendered",
    issued_date: resolveIssuedDate(input.issued_date, true),
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
  });
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
    const ws = await getWorkSettings().catch(() => null);
    const gstRate = resolveGstRate(ws);
    totals = calcQuoteTotals(subtotal, discount, input.gstRegistered ?? Number(input.gst) > 0, gstRate);
  }
  const { gstRegistered: _, issued_date, ...rest } = input;
  const patch: Record<string, unknown> = { ...rest, ...totals };
  if (issued_date !== undefined) {
    patch.issued_date = resolveIssuedDate(issued_date, false);
  }
  if (input.status === "paid" && !input.paid_at) {
    patch.paid_at = new Date().toISOString();
    patch.balance = 0;
  } else if (totals.total !== undefined && input.status !== "paid") {
    patch.balance = totals.total;
  }
  return patchInvoiceRow(id, patch);
}

export async function deleteInvoice(id: string): Promise<void> {
  const { error } = await supabase.from("mp_invoices").delete().eq("id", id);
  if (error) throw error;
}

export function newTestimonialToken(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

export async function markInvoicePaid(id: string): Promise<Invoice> {
  return updateInvoice(id, {
    status: "paid",
    balance: 0,
    paid_at: new Date().toISOString(),
  });
}

/** Mark invoice sent (customer delivery — email/print from preview). */
export async function sendInvoiceToCustomer(id: string): Promise<Invoice> {
  const inv = await getInvoice(id);
  if (!inv) throw new Error("Invoice not found");
  return patchInvoiceRow(id, {
    status: inv.status === "draft" ? "sent" : inv.status,
    sent_at: inv.sent_at ?? new Date().toISOString(),
  });
}

/** Ensure testimonial link exists; mark invoice sent. */
export async function prepareInvoiceForCustomer(id: string, origin: string): Promise<{ testimonialUrl: string; token: string }> {
  const inv = await getInvoice(id);
  if (!inv) throw new Error("Invoice not found");
  const token = inv.testimonial_token || newTestimonialToken();
  const { error } = await supabase
    .from("mp_invoices")
    .update({
      status: inv.status === "draft" ? "sent" : inv.status,
      testimonial_token: token,
      sent_at: inv.sent_at ?? new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
  const testimonialUrl = `${origin.replace(/\/$/, "")}/review.html?token=${token}`;
  return { testimonialUrl, token };
}
