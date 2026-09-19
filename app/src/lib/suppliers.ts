import { requireUserId } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import type { Supplier } from "@/types/entities";

const OPTIONAL_SUPPLIER_COLUMNS = [
  "mobile",
  "fax",
  "physical_street_1",
  "physical_street_2",
  "physical_city",
  "physical_region",
  "physical_postal_code",
  "physical_country",
  "postal_street_1",
  "postal_street_2",
  "postal_city",
  "postal_region",
  "postal_postal_code",
  "postal_country",
  "default_due_days",
  "tax_mode",
  "default_account_code",
  "gst_number",
  "website",
  "logo_path",
] as const;

function isSchemaColumnError(message: string): boolean {
  return /column|schema cache|PGRST204/i.test(message);
}

export function emptySupplierFields(): Omit<
  Supplier,
  "id" | "user_id" | "created_at" | "updated_at"
> {
  return {
    name: "",
    company_name: "",
    email: "",
    phone: "",
    mobile: "",
    fax: "",
    address: "",
    physical_street_1: "",
    physical_street_2: "",
    physical_city: "",
    physical_region: "",
    physical_postal_code: "",
    physical_country: "New Zealand",
    postal_street_1: "",
    postal_street_2: "",
    postal_city: "",
    postal_region: "",
    postal_postal_code: "",
    postal_country: "New Zealand",
    default_due_days: 30,
    tax_mode: "exclusive",
    default_account_code: "3100",
    gst_number: "",
    account_code: "",
    website: "",
    logo_path: "",
    notes: "",
  };
}

export function formatPhysicalAddress(
  s: Pick<
    Supplier,
    | "physical_street_1"
    | "physical_street_2"
    | "physical_city"
    | "physical_region"
    | "physical_postal_code"
    | "physical_country"
  >,
): string {
  return [
    s.physical_street_1,
    s.physical_street_2,
    s.physical_city,
    s.physical_region,
    s.physical_postal_code,
    s.physical_country,
  ]
    .filter(Boolean)
    .join(", ");
}

export function formatPostalAddress(
  s: Pick<
    Supplier,
    "postal_street_1" | "postal_street_2" | "postal_city" | "postal_region" | "postal_postal_code" | "postal_country"
  >,
): string {
  return [s.postal_street_1, s.postal_street_2, s.postal_city, s.postal_region, s.postal_postal_code, s.postal_country]
    .filter(Boolean)
    .join(", ");
}

function prepareSupplierRow(input: Partial<Supplier>): Record<string, unknown> {
  const base = { ...emptySupplierFields(), ...input };
  const physical = formatPhysicalAddress(base);
  return {
    ...base,
    address: physical || base.address || "",
  };
}

export async function listSuppliers(): Promise<Supplier[]> {
  const { data, error } = await supabase.from("mp_suppliers").select("*").order("company_name").order("name");
  if (error) throw error;
  return (data ?? []) as Supplier[];
}

export async function getSupplier(id: string): Promise<Supplier | null> {
  const { data, error } = await supabase.from("mp_suppliers").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as Supplier | null;
}

export async function createSupplier(input: Partial<Supplier>): Promise<Supplier> {
  const user_id = await requireUserId();
  const row = prepareSupplierRow(input);
  const { data, error } = await supabase
    .from("mp_suppliers")
    .insert({ user_id, ...row })
    .select("*")
    .single();
  if (error && isSchemaColumnError(error.message)) {
    const basic = { ...row };
    for (const key of OPTIONAL_SUPPLIER_COLUMNS) delete basic[key];
    const { data: data2, error: error2 } = await supabase
      .from("mp_suppliers")
      .insert({ user_id, ...basic })
      .select("*")
      .single();
    if (error2) throw error2;
    return data2 as Supplier;
  }
  if (error) throw error;
  return data as Supplier;
}

export async function updateSupplier(id: string, input: Partial<Supplier>): Promise<Supplier> {
  const { user_id: _, created_at: __, updated_at: ___, id: __id, ...patchIn } = input as Supplier;
  const patch = prepareSupplierRow(patchIn);
  const { data, error } = await supabase.from("mp_suppliers").update(patch).eq("id", id).select("*").single();
  if (error && isSchemaColumnError(error.message)) {
    const basic = { ...patch };
    for (const key of OPTIONAL_SUPPLIER_COLUMNS) delete basic[key];
    const { data: data2, error: error2 } = await supabase
      .from("mp_suppliers")
      .update(basic)
      .eq("id", id)
      .select("*")
      .single();
    if (error2) throw error2;
    return data2 as Supplier;
  }
  if (error) throw error;
  return data as Supplier;
}

/** Light update for supplier list inline edit. */
export async function patchSupplier(id: string, patch: Partial<Supplier>): Promise<Supplier> {
  const existing = await getSupplier(id);
  if (!existing) throw new Error("Supplier not found");
  return updateSupplier(id, { ...existing, ...patch });
}

export async function deleteSupplier(id: string): Promise<void> {
  const { error } = await supabase.from("mp_suppliers").delete().eq("id", id);
  if (error) throw error;
}

export function supplierDisplayName(s: Pick<Supplier, "company_name" | "name">): string {
  return s.company_name?.trim() || s.name?.trim() || "Supplier";
}
