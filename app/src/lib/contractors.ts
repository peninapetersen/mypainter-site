import { requireUserId } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import type { Contractor } from "@/types/entities";

export async function listContractors(): Promise<Contractor[]> {
  const { data, error } = await supabase.from("mp_contractors").select("*").order("name");
  if (error) throw error;
  return (data ?? []) as Contractor[];
}

export async function getContractor(id: string): Promise<Contractor | null> {
  const { data, error } = await supabase.from("mp_contractors").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as Contractor | null;
}

export async function createContractor(input: Partial<Contractor>): Promise<Contractor> {
  const user_id = await requireUserId();
  const { data, error } = await supabase
    .from("mp_contractors")
    .insert({
      user_id,
      name: "",
      company_name: "",
      email: "",
      phone: "",
      trade: "",
      hourly_rate: 0,
      day_rate: 0,
      website: "",
      notes: "",
      ...input,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as Contractor;
}

export async function updateContractor(id: string, input: Partial<Contractor>): Promise<Contractor> {
  const { user_id: _, created_at: __, updated_at: ___, ...patch } = input as Contractor;
  const { data, error } = await supabase.from("mp_contractors").update(patch).eq("id", id).select("*").single();
  if (error) throw error;
  return data as Contractor;
}

/** Light update for contractor list inline edit. */
export async function patchContractor(id: string, patch: Partial<Contractor>): Promise<Contractor> {
  const existing = await getContractor(id);
  if (!existing) throw new Error("Contractor not found");
  return updateContractor(id, { ...existing, ...patch });
}

export async function deleteContractor(id: string): Promise<void> {
  const { error } = await supabase.from("mp_contractors").delete().eq("id", id);
  if (error) throw error;
}

export function contractorDisplayName(c: Pick<Contractor, "company_name" | "name">): string {
  return c.company_name?.trim() || c.name?.trim() || "Contractor";
}

export function estimateContractorCost(contractor: Contractor | null, durationSeconds: number): number {
  if (!contractor || durationSeconds <= 0) return 0;
  const hours = durationSeconds / 3600;
  if (contractor.hourly_rate > 0) return hours * Number(contractor.hourly_rate);
  if (contractor.day_rate > 0) return (hours / 8) * Number(contractor.day_rate);
  return 0;
}
