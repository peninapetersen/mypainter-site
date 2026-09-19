import { requireUserId } from "@/lib/auth";
import { buildClientName, buildLegacyAddress } from "@/lib/client-display";
import { supabase } from "@/lib/supabase";
import type { Client, ClientContact, ClientContactInput, ClientProperty, ClientPropertyInput } from "@/types/entities";

export type ClientBundle = {
  client: Client;
  properties: ClientProperty[];
  contacts: ClientContact[];
};

const EMPTY_PROPERTY: ClientPropertyInput = {
  street_1: "",
  street_2: "",
  city: "",
  region: "",
  postal_code: "",
  country: "New Zealand",
  tax_rate: "",
  is_primary: true,
  is_billing: true,
  custom_fields: [],
  sort_order: 0,
};

export function emptyProperty(overrides?: Partial<ClientPropertyInput>): ClientPropertyInput {
  return { ...EMPTY_PROPERTY, ...overrides };
}

export async function listClients(): Promise<Client[]> {
  const { data, error } = await supabase.from("mp_clients").select("*").order("name");
  if (error) throw error;
  return (data ?? []) as Client[];
}

export async function getClientBundle(id: string): Promise<ClientBundle | null> {
  const [clientRes, propsRes, contactsRes] = await Promise.all([
    supabase.from("mp_clients").select("*").eq("id", id).maybeSingle(),
    supabase.from("mp_client_properties").select("*").eq("client_id", id).order("sort_order"),
    supabase.from("mp_client_contacts").select("*").eq("client_id", id).order("sort_order"),
  ]);
  if (clientRes.error) throw clientRes.error;
  if (!clientRes.data) return null;
  if (propsRes.error) throw propsRes.error;
  if (contactsRes.error) throw contactsRes.error;
  return {
    client: clientRes.data as Client,
    properties: (propsRes.data ?? []) as ClientProperty[],
    contacts: (contactsRes.data ?? []) as ClientContact[],
  };
}

export async function getClient(id: string): Promise<Client | null> {
  const bundle = await getClientBundle(id);
  return bundle?.client ?? null;
}

function clientPayload(input: Partial<Client>, primary?: ClientPropertyInput) {
  const name = buildClientName(input);
  const address = primary ? buildLegacyAddress(primary as ClientProperty) : input.address ?? "";
  return {
    name,
    title: input.title ?? "",
    first_name: input.first_name ?? "",
    last_name: input.last_name ?? "",
    company_name: input.company_name ?? "",
    email: input.email ?? "",
    phone: input.phone ?? "",
    address,
    lead_source: input.lead_source ?? "",
    communication_settings: input.communication_settings ?? { email: true, sms: true },
    custom_fields: input.custom_fields ?? [],
    billing_same_as_property: input.billing_same_as_property ?? true,
    tags: input.tags ?? [],
    status: input.status ?? "lead",
    notes: input.notes ?? "",
  };
}

async function saveProperties(clientId: string, properties: ClientPropertyInput[]) {
  const user_id = await requireUserId();
  await supabase.from("mp_client_properties").delete().eq("client_id", clientId);
  if (properties.length === 0) return;
  const rows = properties.map((p, i) => ({
    user_id,
    client_id: clientId,
    ...p,
    sort_order: i,
  }));
  const { error } = await supabase.from("mp_client_properties").insert(rows);
  if (error) throw error;
}

async function saveContacts(clientId: string, contacts: ClientContactInput[]) {
  const user_id = await requireUserId();
  await supabase.from("mp_client_contacts").delete().eq("client_id", clientId);
  if (contacts.length === 0) return;
  const rows = contacts.map((c, i) => ({
    user_id,
    client_id: clientId,
    property_id: c.property_id ?? null,
    title: c.title ?? "",
    first_name: c.first_name ?? "",
    last_name: c.last_name ?? "",
    phone: c.phone ?? "",
    email: c.email ?? "",
    notes: c.notes ?? "",
    sort_order: i,
  }));
  const { error } = await supabase.from("mp_client_contacts").insert(rows);
  if (error) throw error;
}

export async function saveClientBundle(input: {
  client: Partial<Client>;
  properties: ClientPropertyInput[];
  contacts: ClientContactInput[];
  existingId?: string;
}): Promise<Client> {
  const primary = input.properties.find((p) => p.is_primary) ?? input.properties[0];
  const payload = clientPayload(input.client, primary);

  if (input.existingId) {
    const { data, error } = await supabase
      .from("mp_clients")
      .update({ ...payload, last_activity_at: new Date().toISOString() })
      .eq("id", input.existingId)
      .select("*")
      .single();
    if (error) throw error;
    await saveProperties(input.existingId, input.properties);
    await saveContacts(input.existingId, input.contacts);
    return data as Client;
  }

  const user_id = await requireUserId();
  const { data, error } = await supabase
    .from("mp_clients")
    .insert({ user_id, ...payload })
    .select("*")
    .single();
  if (error) throw error;
  const client = data as Client;
  await saveProperties(client.id, input.properties);
  await saveContacts(client.id, input.contacts);
  return client;
}

export async function createClient(input: Partial<Client>): Promise<Client> {
  return saveClientBundle({
    client: input,
    properties: input.address ? [emptyProperty({ street_1: input.address, is_primary: true, is_billing: true })] : [emptyProperty()],
    contacts: [],
  });
}

export async function updateClient(id: string, input: Partial<Client>): Promise<Client> {
  return saveClientBundle({ client: input, properties: [emptyProperty()], contacts: [], existingId: id });
}

export async function deleteClient(id: string): Promise<void> {
  const { error } = await supabase.from("mp_clients").delete().eq("id", id);
  if (error) throw error;
}
