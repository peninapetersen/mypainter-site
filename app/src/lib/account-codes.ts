import { requireUserId } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import type { AccountCode, AccountCodeSection, AccountCodeType, AccountGstType } from "@/types/entities";

type SeedRow = Omit<AccountCode, "id" | "user_id" | "created_at" | "updated_at">;

/** Default NZ painter chart — single source for tax time + workflow pickers. */
export const PAINTER_ACCOUNT_CODE_SEEDS: SeedRow[] = [
  { code: "2000", name: "Painting services", friendly_name: "Painting", account_type: "income", gst_type: "gst_on_income", description: "Residential & commercial painting income", applies_to: ["products_services", "quotes", "invoices", "tax_return"], is_active: true, sort_order: 10 },
  { code: "2010", name: "Colour consulting", friendly_name: "Consulting", account_type: "income", gst_type: "gst_on_income", description: "Consulting / colour advice", applies_to: ["products_services", "quotes", "invoices", "tax_return"], is_active: true, sort_order: 20 },
  { code: "2100", name: "Other income", friendly_name: "Handyman", account_type: "income", gst_type: "gst_on_income", description: "Miscellaneous income", applies_to: ["products_services", "quotes", "invoices", "tax_return"], is_active: true, sort_order: 30 },
  { code: "3100", name: "Materials — paint & consumables", friendly_name: "Materials", account_type: "expense", gst_type: "gst_on_expenses", description: "Paint, turps, rollers, tape", applies_to: ["expenses", "suppliers", "jobs_on_costs", "tax_return"], is_active: true, sort_order: 100 },
  { code: "3101", name: "Materials — prep & sundries", friendly_name: "Prep & sundries", account_type: "expense", gst_type: "gst_on_expenses", description: "Filler, sandpaper, drop sheets", applies_to: ["expenses", "suppliers", "jobs_on_costs", "tax_return"], is_active: true, sort_order: 110 },
  { code: "3102", name: "Materials — small tools", friendly_name: "Small tools", account_type: "expense", gst_type: "gst_on_expenses", description: "Brushes, sleeves under asset threshold", applies_to: ["expenses", "suppliers", "jobs_on_costs", "tax_return"], is_active: true, sort_order: 120 },
  { code: "4200", name: "Motor vehicle — fuel", friendly_name: "Motor vehicle", account_type: "expense", gst_type: "gst_on_expenses", description: "Fuel for job travel", applies_to: ["expenses", "tax_return"], is_active: true, sort_order: 200 },
  { code: "4201", name: "Motor vehicle — parking & tolls", friendly_name: "Motor vehicle", account_type: "expense", gst_type: "gst_on_expenses", description: "Parking, tolls, rego (check with accountant)", applies_to: ["expenses", "tax_return"], is_active: true, sort_order: 210 },
  { code: "4202", name: "Motor vehicle — running costs", friendly_name: "Motor vehicle", account_type: "expense", gst_type: "gst_on_expenses", description: "Servicing, tyres, WOF", applies_to: ["expenses", "tax_return"], is_active: true, sort_order: 220 },
  { code: "4300", name: "Tools & equipment", friendly_name: "Tools", account_type: "expense", gst_type: "gst_on_expenses", description: "Tools, ladders, spray gear", applies_to: ["expenses", "tax_return"], is_active: true, sort_order: 300 },
  { code: "5100", name: "Subcontractors", friendly_name: "Subcontractors", account_type: "expense", gst_type: "gst_on_expenses", description: "Subbie labour — plaster, scaffold, etc.", applies_to: ["expenses", "suppliers", "contractors", "jobs_on_costs", "tax_return"], is_active: true, sort_order: 400 },
  { code: "6100", name: "Insurance", friendly_name: "Insurance", account_type: "expense", gst_type: "gst_on_expenses", description: "Public liability, vehicle, income protection", applies_to: ["expenses", "tax_return"], is_active: true, sort_order: 500 },
  { code: "6200", name: "Phone & internet", friendly_name: "Phone & internet", account_type: "expense", gst_type: "gst_on_expenses", description: "Mobile, broadband", applies_to: ["expenses", "tax_return"], is_active: true, sort_order: 510 },
  { code: "6300", name: "Accounting & software", friendly_name: "Accounting", account_type: "expense", gst_type: "gst_on_expenses", description: "Accountant, Xero, subscriptions", applies_to: ["expenses", "tax_return"], is_active: true, sort_order: 520 },
  { code: "6400", name: "Advertising", friendly_name: "Advertising", account_type: "expense", gst_type: "gst_on_expenses", description: "Google, flyers, signage", applies_to: ["expenses", "tax_return"], is_active: true, sort_order: 530 },
  { code: "7100", name: "Vehicle (asset)", friendly_name: "Vehicle asset", account_type: "asset", gst_type: "gst_on_expenses", description: "Capital vehicle — ask accountant", applies_to: ["expenses", "tax_return"], is_active: true, sort_order: 600 },
  { code: "7200", name: "Tools (asset)", friendly_name: "Tools asset", account_type: "asset", gst_type: "gst_on_expenses", description: "Capital tools over threshold", applies_to: ["expenses", "tax_return"], is_active: true, sort_order: 610 },
];

export const ACCOUNT_CODE_SECTIONS: { key: AccountCodeSection; label: string }[] = [
  { key: "products_services", label: "Products & services" },
  { key: "quotes", label: "Quotes" },
  { key: "invoices", label: "Invoices" },
  { key: "expenses", label: "Expenses" },
  { key: "suppliers", label: "Suppliers" },
  { key: "jobs_on_costs", label: "Jobs On costs" },
  { key: "contractors", label: "Contractors" },
  { key: "tax_return", label: "Tax return roll-up" },
];

export const ACCOUNT_TYPE_LABELS: Record<AccountCodeType, string> = {
  income: "Income",
  expense: "Expense",
  asset: "Asset",
  other: "Other",
};

export const ACCOUNT_GST_TYPE_LABELS: Record<AccountGstType, string> = {
  gst_on_income: "GST on income (15%)",
  gst_on_expenses: "GST on expenses (15%)",
  no_gst: "No GST",
  zero_rated: "Zero-rated",
};

/** Legacy mp_services.category slugs → account code. */
export const LEGACY_CATEGORY_TO_CODE: Record<string, string> = {
  painting: "2000",
  handyman: "2100",
  insurance: "2100",
  prep: "2000",
  consulting: "2010",
};

function normalizeCode(row: AccountCode): AccountCode {
  return {
    ...row,
    friendly_name: row.friendly_name?.trim() || row.name,
    applies_to: Array.isArray(row.applies_to) ? row.applies_to : [],
  };
}

function defaultAppliesForType(account_type: AccountCodeType): AccountCodeSection[] {
  if (account_type === "income") return ["products_services", "quotes", "invoices", "tax_return"];
  return ["expenses", "tax_return"];
}

export function codeAppliesTo(code: AccountCode, section: AccountCodeSection): boolean {
  const tags = code.applies_to?.length ? code.applies_to : defaultAppliesForType(code.account_type);
  return tags.includes(section);
}

export function filterAccountCodes(
  codes: AccountCode[],
  opts?: { section?: AccountCodeSection; activeOnly?: boolean },
): AccountCode[] {
  let rows = codes.map(normalizeCode);
  if (opts?.activeOnly !== false) rows = rows.filter((c) => c.is_active);
  if (opts?.section) rows = rows.filter((c) => codeAppliesTo(c, opts.section!));
  return rows;
}

export function friendlyName(code: AccountCode): string {
  return code.friendly_name?.trim() || code.name;
}

export function accountCodeLabel(code: AccountCode): string {
  return `${code.code} — ${code.name}`;
}

export function resolveServiceAccountCode(service: { account_code?: string; category?: string }): string {
  if (service.account_code?.trim()) return service.account_code.trim();
  if (service.category && LEGACY_CATEGORY_TO_CODE[service.category]) return LEGACY_CATEGORY_TO_CODE[service.category];
  if (/^\d{4}$/.test(service.category ?? "")) return service.category!;
  return "2000";
}

export function friendlyNameForCode(codes: AccountCode[], codeStr: string): string {
  const row = codes.find((c) => c.code === codeStr);
  return row ? friendlyName(row) : codeStr;
}

export async function listAccountCodes(opts?: { section?: AccountCodeSection; activeOnly?: boolean }): Promise<AccountCode[]> {
  const user_id = await requireUserId();
  const { data, error } = await supabase
    .from("mp_account_codes")
    .select("*")
    .order("sort_order")
    .order("code");
  if (error) throw error;
  let rows = ((data ?? []) as AccountCode[]).map(normalizeCode);
  if (rows.length === 0) {
    rows = (await seedAccountCodes(user_id)).map(normalizeCode);
  }
  return filterAccountCodes(rows, opts);
}

export async function seedAccountCodes(user_id: string): Promise<AccountCode[]> {
  const rows = PAINTER_ACCOUNT_CODE_SEEDS.map((seed) => ({ user_id, ...seed }));
  const { data, error } = await supabase.from("mp_account_codes").insert(rows).select("*");
  if (error) throw error;
  return (data ?? []) as AccountCode[];
}

export async function createAccountCode(input: {
  code: string;
  name: string;
  friendly_name?: string;
  account_type?: AccountCodeType;
  gst_type?: AccountGstType;
  description?: string;
  applies_to?: AccountCodeSection[];
}): Promise<AccountCode> {
  const user_id = await requireUserId();
  const account_type = input.account_type ?? "expense";
  const row = {
    user_id,
    code: input.code.trim(),
    name: input.name.trim(),
    friendly_name: input.friendly_name?.trim() || input.name.trim(),
    account_type,
    gst_type: input.gst_type ?? (account_type === "income" ? "gst_on_income" : "gst_on_expenses"),
    description: input.description ?? "",
    applies_to: input.applies_to ?? defaultAppliesForType(account_type),
    is_active: true,
    sort_order: 900,
  };
  const { data, error } = await supabase.from("mp_account_codes").insert(row).select("*").single();
  if (error && /friendly_name|applies_to|column|schema cache|PGRST204/i.test(error.message)) {
    const { friendly_name: _f, applies_to: _a, ...basic } = row;
    const { data: data2, error: error2 } = await supabase.from("mp_account_codes").insert(basic).select("*").single();
    if (error2) throw error2;
    return normalizeCode({ ...(data2 as AccountCode), friendly_name: row.friendly_name, applies_to: row.applies_to });
  }
  if (error) throw error;
  return normalizeCode(data as AccountCode);
}

export async function updateAccountCode(
  id: string,
  patch: Partial<Pick<AccountCode, "name" | "friendly_name" | "account_type" | "gst_type" | "description" | "applies_to" | "is_active" | "sort_order">>,
): Promise<AccountCode> {
  const { data, error } = await supabase.from("mp_account_codes").update(patch).eq("id", id).select("*").single();
  if (error && /friendly_name|applies_to|column|schema cache|PGRST204/i.test(error.message)) {
    const basic = { ...patch };
    delete (basic as Record<string, unknown>).friendly_name;
    delete (basic as Record<string, unknown>).applies_to;
    const { data: data2, error: error2 } = await supabase.from("mp_account_codes").update(basic).eq("id", id).select("*").single();
    if (error2) throw error2;
    return normalizeCode(data2 as AccountCode);
  }
  if (error) throw error;
  return normalizeCode(data as AccountCode);
}

/** Unique friendly pill labels for products list (dedupe Motor vehicle x3 → one pill per code still). */
export function productCategoryPills(codes: AccountCode[]): AccountCode[] {
  return filterAccountCodes(codes, { section: "products_services" });
}
