import { requireUserId } from "@/lib/auth";
import { buildClientName, buildLegacyAddress } from "@/lib/client-display";
import { isMissingTableError } from "@/lib/supabase-errors";
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

export async function listClients(opts?: { client_type?: Client["client_type"] }): Promise<Client[]> {
  let q = supabase.from("mp_clients").select("*").order("name");
  if (opts?.client_type) q = q.eq("client_type", opts.client_type);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Client[];
}

export async function listCompanies(): Promise<Client[]> {
  return listClients({ client_type: "company" });
}

export async function listCustomers(): Promise<Client[]> {
  return listClients({ client_type: "person" });
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
    client_type: input.client_type ?? "person",
    photo_path: input.photo_path ?? "",
    website: input.website ?? "",
    company_client_id: input.company_client_id ?? null,
    notes: input.notes ?? "",
  };
}

async function saveProperties(clientId: string, properties: ClientPropertyInput[]): Promise<boolean> {
  const user_id = await requireUserId();
  const del = await supabase.from("mp_client_properties").delete().eq("client_id", clientId);
  if (del.error) {
    if (isMissingTableError(del.error)) return false;
    throw del.error;
  }
  if (properties.length === 0) return true;
  const rows = properties.map((p, i) => ({
    user_id,
    client_id: clientId,
    ...p,
    sort_order: i,
  }));
  const { error } = await supabase.from("mp_client_properties").insert(rows);
  if (error) {
    if (isMissingTableError(error)) return false;
    throw error;
  }
  return true;
}

async function saveContacts(clientId: string, contacts: ClientContactInput[]): Promise<boolean> {
  const user_id = await requireUserId();
  const del = await supabase.from("mp_client_contacts").delete().eq("client_id", clientId);
  if (del.error) {
    if (isMissingTableError(del.error)) return false;
    throw del.error;
  }
  if (contacts.length === 0) return true;
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
  if (error) {
    if (isMissingTableError(error)) return false;
    throw error;
  }
  return true;
}

export function validateClientFields(client: Partial<Client>): string | null {
  const hasName =
    !!client.company_name?.trim() || !!client.first_name?.trim() || !!client.last_name?.trim();
  if (!hasName) return "Enter a first name, last name, or company name before saving.";
  return null;
}

export type SaveClientResult = { client: Client; propertiesSkipped: boolean };

export async function saveClientBundle(input: {
  client: Partial<Client>;
  properties: ClientPropertyInput[];
  contacts: ClientContactInput[];
  existingId?: string;
}): Promise<SaveClientResult> {
  const validation = validateClientFields(input.client);
  if (validation) throw new Error(validation);

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
    const propsOk = await saveProperties(input.existingId, input.properties);
    await saveContacts(input.existingId, input.contacts);
    return { client: data as Client, propertiesSkipped: !propsOk };
  }

  const user_id = await requireUserId();
  const { data, error } = await supabase
    .from("mp_clients")
    .insert({ user_id, ...payload })
    .select("*")
    .single();
  if (error) throw error;
  const client = data as Client;
  try {
    const propsOk = await saveProperties(client.id, input.properties);
    await saveContacts(client.id, input.contacts);
    return { client, propertiesSkipped: !propsOk };
  } catch (e) {
    await supabase.from("mp_clients").delete().eq("id", client.id);
    throw e;
  }
}

export async function createClient(input: Partial<Client>): Promise<Client> {
  const { client } = await saveClientBundle({
    client: input,
    properties: input.address ? [emptyProperty({ street_1: input.address, is_primary: true, is_billing: true })] : [emptyProperty()],
    contacts: [],
  });
  return client;
}

export async function updateClient(id: string, input: Partial<Client>): Promise<Client> {
  const { client } = await saveClientBundle({ client: input, properties: [emptyProperty()], contacts: [], existingId: id });
  return client;
}

/** Light update — does not touch properties or contacts (for list inline edit). */
export async function patchClient(id: string, patch: Partial<Client>): Promise<Client> {
  const existing = await getClient(id);
  if (!existing) throw new Error("Client not found");
  const merged = { ...existing, ...patch };
  const validation = validateClientFields(merged);
  if (validation) throw new Error(validation);

  const payload = clientPayload(merged);
  const { data, error } = await supabase
    .from("mp_clients")
    .update({ ...payload, last_activity_at: new Date().toISOString() })
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
