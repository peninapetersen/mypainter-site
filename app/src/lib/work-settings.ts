import { requireUserId } from "@/lib/auth";
import { DEFAULT_INVOICE_CONTRACT } from "@/lib/invoice-defaults";
import { DEFAULT_QUOTE_TERMS } from "@/lib/line-items";
import { supabase } from "@/lib/supabase";
import { DEFAULT_CONTACT_LIST_COLUMNS, mergeContactListColumns, type ContactListColumnsConfig } from "@/lib/contact-list-columns";
import type { WorkSettings } from "@/types/entities";

export const ARRIVAL_WINDOWS = ["None", "15 min", "30 min", "1 hr", "2 hr", "3 hr", "4 hr"] as const;

export const PAYMENT_TERMS_ALL = [
  { name: "Due upon receipt", days: 0, locked: true },
  { name: "Net 7", days: 7 },
  { name: "Net 15", days: 15 },
  { name: "Net 30", days: 30 },
  { name: "Net 45", days: 45 },
  { name: "Net 60", days: 60 },
  { name: "End of the month", days: null, locked: true },
  { name: "End of next month", days: null, locked: true },
] as const;

export const VISIT_TITLE_VARIABLES = ["{{CLIENT_NAME}}", "{{JOB_TITLE}}", "{{JOB_NUMBER}}"] as const;

export function defaultWorkSettings(): Omit<WorkSettings, "user_id" | "created_at" | "updated_at"> {
  return {
    quote_reminder_enabled: false,
    quote_reminder_days: 3,
    arrival_window: "None",
    arrival_window_style: "after",
    visit_title_template: "{{CLIENT_NAME}} - {{JOB_TITLE}}",
    invoice_subject_default: "For Services Rendered",
    invoice_use_job_title: true,
    payment_terms_residential: "Due upon receipt",
    payment_terms_commercial: "Net 30",
    statement_sort_order: "newest_first",
    statement_disclaimer: "",
    invoice_reminder_reassign: false,
    invoice_reminder_assigned_to: "Richo Petersen",
    quote_default_terms: DEFAULT_QUOTE_TERMS,
    invoice_default_contract: DEFAULT_INVOICE_CONTRACT,
    document_phone: "021 083 01415",
    document_email: "mypaintermate@gmail.com",
    document_tagline: "Painting & Handyman · Whangarei & Northland",
    gst_rate: 0.15,
    gst_default_on_quotes: true,
    gst_default_on_invoices: true,
    default_tax_mode: "exclusive",
    contact_list_columns: DEFAULT_CONTACT_LIST_COLUMNS,
  };
}

export async function getWorkSettings(): Promise<WorkSettings> {
  const user_id = await requireUserId();
  const { data, error } = await supabase.from("mp_work_settings").select("*").eq("user_id", user_id).maybeSingle();
  if (error) throw error;
  if (data) {
    const defaults = defaultWorkSettings();
    const row = data as WorkSettings;
    return {
      ...defaults,
      ...row,
      contact_list_columns: mergeContactListColumns(row.contact_list_columns),
      user_id: row.user_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
  const defaults = defaultWorkSettings();
  const { data: created, error: insertErr } = await supabase
    .from("mp_work_settings")
    .insert({ user_id, ...defaults })
    .select("*")
    .single();
  if (insertErr) throw insertErr;
  return created as WorkSettings;
}

export async function saveWorkSettings(input: Partial<WorkSettings>): Promise<WorkSettings> {
  const user_id = await requireUserId();
  const { user_id: _u, created_at: _c, updated_at: _up, ...patch } = input as WorkSettings;
  const { data, error } = await supabase
    .from("mp_work_settings")
    .update(patch)
    .eq("user_id", user_id)
    .select("*")
    .single();
  if (error) throw error;
  return data as WorkSettings;
}
