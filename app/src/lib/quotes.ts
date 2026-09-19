import { requireUserId } from "@/lib/auth";
import { calcLineSubtotal, calcQuoteTotals, DEFAULT_QUOTE_TERMS, todayIsoDate, addDaysIsoDate } from "@/lib/line-items";
import { supabase } from "@/lib/supabase";
import type { LineItem, Quote } from "@/types/entities";

export async function nextQuoteNumber(): Promise<string> {
  const user_id = await requireUserId();
  const { data: seq } = await supabase.from("mp_quote_seq").select("next_num").eq("user_id", user_id).maybeSingle();
  const num = seq?.next_num ?? 131;
  if (!seq) {
    await supabase.from("mp_quote_seq").insert({ user_id, next_num: num + 1 });
  } else {
    await supabase.from("mp_quote_seq").update({ next_num: num + 1 }).eq("user_id", user_id);
  }
  return `MP-${num}`;
}

export async function listQuotes(): Promise<Quote[]> {
  const { data, error } = await supabase.from("mp_quotes").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Quote[];
}

export async function getQuote(id: string): Promise<Quote | null> {
  const { data, error } = await supabase.from("mp_quotes").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as Quote | null;
}

export async function createQuote(input: {
  client_id?: string | null;
  request_id?: string | null;
  title?: string;
  line_items?: LineItem[];
  discount?: number;
  gstRegistered?: boolean;
  terms?: string;
  status?: Quote["status"];
  internal_notes?: string;
}): Promise<Quote> {
  const user_id = await requireUserId();
  const line_items = input.line_items ?? [];
  const subtotal = calcLineSubtotal(line_items);
  const discount = input.discount ?? 0;
  const { gst, total } = calcQuoteTotals(subtotal, discount, input.gstRegistered ?? false);
  const number = await nextQuoteNumber();
  const { data, error } = await supabase
    .from("mp_quotes")
    .insert({
      user_id,
      client_id: input.client_id ?? null,
      request_id: input.request_id ?? null,
      number,
      title: input.title ?? "",
      quote_date: todayIsoDate(),
      valid_until: addDaysIsoDate(30),
      line_items,
      discount,
      subtotal,
      gst,
      total,
      terms: input.terms ?? DEFAULT_QUOTE_TERMS,
      status: input.status ?? "draft",
      internal_notes: input.internal_notes ?? "",
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as Quote;
}

export async function updateQuote(
  id: string,
  input: Partial<Quote> & { gstRegistered?: boolean },
): Promise<Quote> {
  const line_items = input.line_items;
  const discount = input.discount ?? 0;
  let totals = {};
  if (line_items) {
    const subtotal = calcLineSubtotal(line_items);
    totals = calcQuoteTotals(subtotal, discount, input.gstRegistered ?? input.gst > 0);
  }
  const { gstRegistered: _, ...rest } = input;
  const { data, error } = await supabase
    .from("mp_quotes")
    .update({ ...rest, ...totals })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as Quote;
}

export async function deleteQuote(id: string): Promise<void> {
  const { error } = await supabase.from("mp_quotes").delete().eq("id", id);
  if (error) throw error;
}
