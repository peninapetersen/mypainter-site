import { getWorkSettings, saveWorkSettings } from "@/lib/work-settings";
import type { WorkSettings } from "@/types/entities";

export type ContactListKey = "customers" | "companies" | "suppliers" | "contractors";

export type ContactColumnDef = {
  id: string;
  label: string;
  /** Inline text edit on blur */
  editable?: boolean;
};

export type ContactListColumnsConfig = Record<ContactListKey, { visible: string[] }>;

export const CONTACT_LIST_LABELS: Record<ContactListKey, string> = {
  customers: "Customers",
  companies: "Companies",
  suppliers: "Suppliers",
  contractors: "Contractors",
};

export const CONTACT_COLUMN_CATALOG: Record<ContactListKey, ContactColumnDef[]> = {
  customers: [
    { id: "first_name", label: "First name", editable: true },
    { id: "last_name", label: "Last name", editable: true },
    { id: "company", label: "Company" },
    { id: "phone", label: "Phone", editable: true },
    { id: "email", label: "Email", editable: true },
    { id: "website", label: "Website", editable: true },
    { id: "lead_source", label: "Lead source", editable: true },
    { id: "status", label: "Status" },
  ],
  companies: [
    { id: "company_name", label: "Company name", editable: true },
    { id: "website", label: "Website", editable: true },
    { id: "phone", label: "Phone", editable: true },
    { id: "email", label: "Email", editable: true },
    { id: "status", label: "Status" },
  ],
  suppliers: [
    { id: "company_name", label: "Supplier name", editable: true },
    { id: "name", label: "Contact name", editable: true },
    { id: "phone", label: "Phone", editable: true },
    { id: "email", label: "Email", editable: true },
    { id: "website", label: "Website", editable: true },
    { id: "account_code", label: "Expense code", editable: true },
    { id: "gst_number", label: "GST number", editable: true },
  ],
  contractors: [
    { id: "company_name", label: "Company name", editable: true },
    { id: "name", label: "Contact name", editable: true },
    { id: "trade", label: "Trade", editable: true },
    { id: "phone", label: "Phone", editable: true },
    { id: "email", label: "Email", editable: true },
    { id: "hourly_rate", label: "Hourly rate", editable: true },
    { id: "day_rate", label: "Day rate", editable: true },
  ],
};

export const DEFAULT_CONTACT_LIST_COLUMNS: ContactListColumnsConfig = {
  customers: { visible: ["first_name", "last_name", "company", "phone", "email", "status"] },
  companies: { visible: ["company_name", "website", "phone", "email", "status"] },
  suppliers: { visible: ["company_name", "name", "phone", "email", "website"] },
  contractors: { visible: ["company_name", "name", "trade", "phone", "hourly_rate"] },
};

export function mergeContactListColumns(raw: unknown): ContactListColumnsConfig {
  const base = structuredClone(DEFAULT_CONTACT_LIST_COLUMNS);
  if (!raw || typeof raw !== "object") return base;
  const obj = raw as Record<string, { visible?: string[] }>;
  for (const key of Object.keys(CONTACT_LIST_LABELS) as ContactListKey[]) {
    const visible = obj[key]?.visible;
    if (Array.isArray(visible) && visible.length > 0) {
      const allowed = new Set(CONTACT_COLUMN_CATALOG[key].map((c) => c.id));
      base[key].visible = visible.filter((id) => allowed.has(id));
    }
  }
  return base;
}

export function visibleColumnsForList(
  listKey: ContactListKey,
  config: ContactListColumnsConfig,
): ContactColumnDef[] {
  const catalog = CONTACT_COLUMN_CATALOG[listKey];
  const byId = new Map(catalog.map((c) => [c.id, c]));
  return config[listKey].visible.map((id) => byId.get(id)).filter(Boolean) as ContactColumnDef[];
}

export async function loadContactListColumns(): Promise<ContactListColumnsConfig> {
  const settings = await getWorkSettings();
  return mergeContactListColumns(settings.contact_list_columns);
}

export async function saveContactListColumns(config: ContactListColumnsConfig): Promise<WorkSettings> {
  return saveWorkSettings({ contact_list_columns: config });
}
