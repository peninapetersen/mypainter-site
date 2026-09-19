import { requireUserId } from "@/lib/auth";
import { EXPENSE_CATEGORY_CODES } from "@/lib/expense-materials";
import { todayIsoDate } from "@/lib/line-items";
import { supabase } from "@/lib/supabase";
import type { Expense, ExpenseCategory, ReceiptScanResult } from "@/types/entities";

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: "COGS_Materials", label: "Materials (COGS)" },
  { value: "Motor_Vehicle", label: "Motor vehicle" },
  { value: "Tools_Equipment", label: "Tools & equipment" },
  { value: "Subcontractors", label: "Subcontractors" },
  { value: "Admin_Insurance", label: "Admin & insurance" },
];

export const REIMBURSE_OPTIONS = ["Not reimbursable", "Richo Petersen"] as const;

const OPTIONAL_EXPENSE_COLUMNS = [
  "quote_id",
  "jobs_on_id",
  "invoice_id",
  "item_name",
  "merchant",
  "gst_amount",
  "accounting_code",
  "reimburse_to",
  "ai_extracted",
] as const;

function isSchemaColumnError(message: string): boolean {
  return /column|schema cache|PGRST204|invalid input syntax for type date/i.test(message);
}

function resolveExpenseDate(value?: string | null, forCreate = false): string | null {
  const trimmed = value?.trim();
  if (trimmed) return trimmed;
  return forCreate ? todayIsoDate() : null;
}

function stripOptionalExpenseColumns(row: Record<string, unknown>): Record<string, unknown> {
  const basic = { ...row };
  for (const key of OPTIONAL_EXPENSE_COLUMNS) delete basic[key];
  return basic;
}

async function insertExpenseRow(row: Record<string, unknown>): Promise<Expense> {
  const { data, error } = await supabase.from("mp_expenses").insert(row).select("*").single();
  if (!error) return data as Expense;
  if (isSchemaColumnError(error.message)) {
    const { data: data2, error: error2 } = await supabase
      .from("mp_expenses")
      .insert(stripOptionalExpenseColumns(row))
      .select("*")
      .single();
    if (error2) throw error2;
    return data2 as Expense;
  }
  throw error;
}

async function patchExpenseRow(id: string, patch: Record<string, unknown>): Promise<Expense> {
  const { data, error } = await supabase.from("mp_expenses").update(patch).eq("id", id).select("*").single();
  if (!error) return data as Expense;
  if (isSchemaColumnError(error.message)) {
    const { data: data2, error: error2 } = await supabase
      .from("mp_expenses")
      .update(stripOptionalExpenseColumns(patch))
      .eq("id", id)
      .select("*")
      .single();
    if (error2) throw error2;
    return data2 as Expense;
  }
  throw error;
}

export async function listExpenses(): Promise<Expense[]> {
  const { data, error } = await supabase.from("mp_expenses").select("*").order("expense_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Expense[];
}

export async function getExpense(id: string): Promise<Expense | null> {
  const { data, error } = await supabase.from("mp_expenses").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as Expense | null;
}

export async function createExpense(input: {
  job_id?: string | null;
  quote_id?: string | null;
  jobs_on_id?: string | null;
  invoice_id?: string | null;
  item_name?: string;
  description?: string;
  merchant?: string;
  amount?: number;
  gst_amount?: number;
  gst_inclusive?: boolean;
  category?: ExpenseCategory;
  accounting_code?: string;
  reimburse_to?: string;
  expense_date?: string | null;
  receipt_path?: string;
  ai_extracted?: Record<string, unknown>;
}): Promise<Expense> {
  const user_id = await requireUserId();
  const category = input.category ?? "COGS_Materials";
  return insertExpenseRow({
    user_id,
    job_id: input.job_id ?? null,
    quote_id: input.quote_id ?? null,
    jobs_on_id: input.jobs_on_id ?? null,
    invoice_id: input.invoice_id ?? null,
    item_name: input.item_name ?? "",
    description: input.description ?? "",
    merchant: input.merchant ?? "",
    amount: input.amount ?? 0,
    gst_amount: input.gst_amount ?? 0,
    gst_inclusive: input.gst_inclusive ?? true,
    category,
    accounting_code: input.accounting_code?.trim() || EXPENSE_CATEGORY_CODES[category],
    reimburse_to: input.reimburse_to ?? "Not reimbursable",
    expense_date: resolveExpenseDate(input.expense_date, true),
    receipt_path: input.receipt_path ?? "",
    ai_extracted: input.ai_extracted ?? {},
  });
}

export async function updateExpense(id: string, input: Partial<Expense>): Promise<Expense> {
  const patch: Record<string, unknown> = { ...input };
  if (input.expense_date !== undefined) {
    patch.expense_date = resolveExpenseDate(input.expense_date, false);
  }
  if (input.category && !input.accounting_code?.trim()) {
    patch.accounting_code = EXPENSE_CATEGORY_CODES[input.category];
  }
  return patchExpenseRow(id, patch);
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase.from("mp_expenses").delete().eq("id", id);
  if (error) throw error;
}

export function expenseFromScan(scan: ReceiptScanResult, receipt_path: string, ai_raw: Record<string, unknown>): Omit<Expense, "id" | "user_id" | "job_id" | "created_at" | "updated_at"> {
  return {
    item_name: scan.item_name,
    description: scan.description,
    merchant: scan.merchant,
    amount: scan.amount,
    gst_amount: scan.gst_amount,
    gst_inclusive: scan.gst_inclusive,
    category: scan.category,
    accounting_code: scan.accounting_code,
    reimburse_to: scan.reimburse_to,
    expense_date: scan.expense_date,
    receipt_path,
    ai_extracted: ai_raw,
  };
}
