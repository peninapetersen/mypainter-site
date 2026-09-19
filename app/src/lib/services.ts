import { supabase } from "@/lib/supabase";
import type { MpService } from "@/types/services";

export async function listServices(): Promise<MpService[]> {
  const { data, error } = await supabase
    .from("mp_services")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as MpService[];
}

export async function getService(id: string): Promise<MpService | null> {
  const { data, error } = await supabase.from("mp_services").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as MpService | null;
}
