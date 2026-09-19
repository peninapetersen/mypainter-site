import { requireUserId } from "@/lib/auth";
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
  const { data, error } = await supabase
    .from("mp_expenses")
    .insert({
      user_id,
      job_id: input.job_id ?? null,
      item_name: input.item_name ?? "",
      description: input.description ?? "",
      merchant: input.merchant ?? "",
      amount: input.amount ?? 0,
      gst_amount: input.gst_amount ?? 0,
      gst_inclusive: input.gst_inclusive ?? true,
      category: input.category ?? "COGS_Materials",
      accounting_code: input.accounting_code ?? "",
      reimburse_to: input.reimburse_to ?? "Not reimbursable",
      expense_date: input.expense_date ?? todayIsoDate(),
      receipt_path: input.receipt_path ?? "",
      ai_extracted: input.ai_extracted ?? {},
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as Expense;
}

export async function updateExpense(id: string, input: Partial<Expense>): Promise<Expense> {
  const { data, error } = await supabase.from("mp_expenses").update(input).eq("id", id).select("*").single();
  if (error) throw error;
  return data as Expense;
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
