import { requireUserId } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import type { Client } from "@/types/entities";

export async function listClients(): Promise<Client[]> {
  const { data, error } = await supabase.from("mp_clients").select("*").order("name");
  if (error) throw error;
  return (data ?? []) as Client[];
}

export async function getClient(id: string): Promise<Client | null> {
  const { data, error } = await supabase.from("mp_clients").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as Client | null;
}

export async function createClient(input: Partial<Client>): Promise<Client> {
  const user_id = await requireUserId();
  const { data, error } = await supabase
    .from("mp_clients")
    .insert({
      user_id,
      name: input.name ?? "",
      email: input.email ?? "",
      phone: input.phone ?? "",
      address: input.address ?? "",
      tags: input.tags ?? [],
      status: input.status ?? "lead",
      notes: input.notes ?? "",
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as Client;
}

export async function updateClient(id: string, input: Partial<Client>): Promise<Client> {
  const { data, error } = await supabase
    .from("mp_clients")
    .update({
      name: input.name,
      email: input.email,
      phone: input.phone,
      address: input.address,
      tags: input.tags,
      status: input.status,
      notes: input.notes,
      last_activity_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as Client;
}

export async function deleteClient(id: string): Promise<void> {
  const { error } = await supabase.from("mp_clients").delete().eq("id", id);
  if (error) throw error;
}
