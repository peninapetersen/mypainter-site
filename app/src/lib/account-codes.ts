import { requireUserId } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import type { AccountCode, AccountCodeType, AccountGstType } from "@/types/entities";

/** Default NZ painter chart — simple Xero-style codes for tax time. */
export const PAINTER_ACCOUNT_CODE_SEEDS: Omit<AccountCode, "id" | "user_id" | "created_at" | "updated_at">[] = [
  { code: "2000", name: "Painting services", account_type: "income", gst_type: "gst_on_income", description: "Residential & commercial painting income", is_active: true, sort_order: 10 },
  { code: "2010", name: "Colour consulting", account_type: "income", gst_type: "gst_on_income", description: "Consulting / colour advice", is_active: true, sort_order: 20 },
  { code: "2100", name: "Other income", account_type: "income", gst_type: "gst_on_income", description: "Miscellaneous income", is_active: true, sort_order: 30 },
  { code: "3100", name: "Materials — paint & consumables", account_type: "expense", gst_type: "gst_on_expenses", description: "Paint, turps, rollers, tape", is_active: true, sort_order: 100 },
  { code: "3101", name: "Materials — prep & sundries", account_type: "expense", gst_type: "gst_on_expenses", description: "Filler, sandpaper, drop sheets", is_active: true, sort_order: 110 },
  { code: "3102", name: "Materials — small tools", account_type: "expense", gst_type: "gst_on_expenses", description: "Brushes, sleeves under asset threshold", is_active: true, sort_order: 120 },
  { code: "4200", name: "Motor vehicle — fuel", account_type: "expense", gst_type: "gst_on_expenses", description: "Fuel for job travel", is_active: true, sort_order: 200 },
  { code: "4201", name: "Motor vehicle — parking & tolls", account_type: "expense", gst_type: "gst_on_expenses", description: "Parking, tolls, rego (check with accountant)", is_active: true, sort_order: 210 },
  { code: "4202", name: "Motor vehicle — running costs", account_type: "expense", gst_type: "gst_on_expenses", description: "Servicing, tyres, WOF", is_active: true, sort_order: 220 },
  { code: "4300", name: "Tools & equipment", account_type: "expense", gst_type: "gst_on_expenses", description: "Tools, ladders, spray gear", is_active: true, sort_order: 300 },
  { code: "5100", name: "Subcontractors", account_type: "expense", gst_type: "gst_on_expenses", description: "Subbie labour — plaster, scaffold, etc.", is_active: true, sort_order: 400 },
  { code: "6100", name: "Insurance", account_type: "expense", gst_type: "gst_on_expenses", description: "Public liability, vehicle, income protection", is_active: true, sort_order: 500 },
  { code: "6200", name: "Phone & internet", account_type: "expense", gst_type: "gst_on_expenses", description: "Mobile, broadband", is_active: true, sort_order: 510 },
  { code: "6300", name: "Accounting & software", account_type: "expense", gst_type: "gst_on_expenses", description: "Accountant, Xero, subscriptions", is_active: true, sort_order: 520 },
  { code: "6400", name: "Advertising", account_type: "expense", gst_type: "gst_on_expenses", description: "Google, flyers, signage", is_active: true, sort_order: 530 },
  { code: "7100", name: "Vehicle (asset)", account_type: "asset", gst_type: "gst_on_expenses", description: "Capital vehicle — ask accountant", is_active: true, sort_order: 600 },
  { code: "7200", name: "Tools (asset)", account_type: "asset", gst_type: "gst_on_expenses", description: "Capital tools over threshold", is_active: true, sort_order: 610 },
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

export async function listAccountCodes(): Promise<AccountCode[]> {
  const user_id = await requireUserId();
  const { data, error } = await supabase
    .from("mp_account_codes")
    .select("*")
    .order("sort_order")
    .order("code");
  if (error) throw error;
  const rows = (data ?? []) as AccountCode[];
  if (rows.length === 0) {
    return seedAccountCodes(user_id);
  }
  return rows;
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
  account_type?: AccountCodeType;
  gst_type?: AccountGstType;
  description?: string;
}): Promise<AccountCode> {
  const user_id = await requireUserId();
  const { data, error } = await supabase
    .from("mp_account_codes")
    .insert({
      user_id,
      code: input.code.trim(),
      name: input.name.trim(),
      account_type: input.account_type ?? "expense",
      gst_type: input.gst_type ?? "gst_on_expenses",
      description: input.description ?? "",
      is_active: true,
      sort_order: 900,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as AccountCode;
}

export function accountCodeLabel(code: AccountCode): string {
  return `${code.code} — ${code.name}`;
}
