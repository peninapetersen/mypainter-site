import { requireUserId } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import type { MpService } from "@/types/services";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export async function listServices(activeOnly = true): Promise<MpService[]> {
  let q = supabase.from("mp_services").select("*").order("sort_order", { ascending: true });
  if (activeOnly) q = q.eq("active", true);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as MpService[];
}

export async function listAllServices(): Promise<MpService[]> {
  return listServices(false);
}

export async function getService(id: string): Promise<MpService | null> {
  const { data, error } = await supabase.from("mp_services").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as MpService | null;
}

export async function createService(input: Partial<MpService>): Promise<MpService> {
  const user_id = await requireUserId();
  const name = input.name?.trim() || "New service";
  const slug = input.slug?.trim() || slugify(name) || `service-${Date.now()}`;
  const row = {
    user_id,
    slug,
    name,
    description: input.description ?? "",
    category: input.category ?? "painting",
    measure_type: input.measure_type ?? "fixed",
    rate_per_unit: Number(input.rate_per_unit) || 0,
    min_charge: Number(input.min_charge) || 0,
    unit_label: input.unit_label ?? "job",
    field_schema: input.field_schema ?? {},
    sort_order: input.sort_order ?? 999,
    active: input.active ?? true,
    show_estimate: input.show_estimate ?? true,
    account_code: input.account_code ?? "2000",
  };
  const { data, error } = await supabase.from("mp_services").insert(row).select("*").single();
  if (error && /account_code|column|schema cache|PGRST204/i.test(error.message)) {
    const { account_code: _, ...basic } = row;
    const { data: data2, error: error2 } = await supabase.from("mp_services").insert(basic).select("*").single();
    if (error2) throw error2;
    return data2 as MpService;
  }
  if (error) throw error;
  return data as MpService;
}

export async function updateService(id: string, input: Partial<MpService>): Promise<MpService> {
  const { user_id: _, created_at: __, updated_at: ___, id: __id, ...patch } = input as MpService;
  const { data, error } = await supabase.from("mp_services").update(patch).eq("id", id).select("*").single();
  if (error && /account_code|column|schema cache|PGRST204/i.test(error.message)) {
    const basic = { ...patch };
    delete (basic as Record<string, unknown>).account_code;
    const { data: data2, error: error2 } = await supabase.from("mp_services").update(basic).eq("id", id).select("*").single();
    if (error2) throw error2;
    return data2 as MpService;
  }
  if (error) throw error;
  return data as MpService;
}

export async function deleteService(id: string): Promise<void> {
  const { error } = await supabase.from("mp_services").delete().eq("id", id);
  if (error) throw error;
}

/** Turn catalogue row into a quote/invoice line item. */
export function serviceToLineItem(service: MpService, qty = 1) {
  return {
    name: service.name,
    description: service.description,
    qty,
    unitPrice: Number(service.rate_per_unit) || Number(service.min_charge) || 0,
    unitCost: 0,
    account_code: service.account_code || "2000",
  };
}
