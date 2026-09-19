export type LineItem = {
  name: string;
  description?: string;
  qty: number;
  unitPrice: number;
  unitCost?: number;
  optional?: boolean;
  /** Text-only block (Jobber "Add Text") — excluded from totals */
  isText?: boolean;
};

export type CustomField = { label: string; value: string };

export type CommunicationSettings = { email: boolean; sms: boolean };

export type Client = {
  id: string;
  user_id: string;
  name: string;
  title: string;
  first_name: string;
  last_name: string;
  company_name: string;
  email: string;
  phone: string;
  address: string;
  lead_source: string;
  communication_settings: CommunicationSettings;
  custom_fields: CustomField[];
  billing_same_as_property: boolean;
  tags: string[];
  status: "lead" | "active" | "inactive";
  last_activity_at: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type ClientProperty = {
  id: string;
  user_id: string;
  client_id: string;
  street_1: string;
  street_2: string;
  city: string;
  region: string;
  postal_code: string;
  country: string;
  tax_rate: string;
  is_primary: boolean;
  is_billing: boolean;
  custom_fields: CustomField[];
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ClientContact = {
  id: string;
  user_id: string;
  client_id: string;
  property_id: string | null;
  title: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  notes: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ClientPropertyInput = Omit<ClientProperty, "id" | "user_id" | "client_id" | "created_at" | "updated_at">;
export type ClientContactInput = Omit<ClientContact, "id" | "user_id" | "client_id" | "created_at" | "updated_at">;

export type Request = {
  id: string;
  user_id: string;
  client_id: string | null;
  title: string;
  requested_on: string | null;
  service_details: string;
  images: { path: string; caption?: string }[];
  assessment_at: string | null;
  line_items: LineItem[];
  subtotal: number;
  status: "draft" | "open" | "approved" | "closed";
  internal_notes: string;
  created_at: string;
  updated_at: string;
};

export type Quote = {
  id: string;
  user_id: string;
  client_id: string | null;
  request_id: string | null;
  number: string;
  title: string;
  quote_date: string | null;
  valid_until: string | null;
  line_items: LineItem[];
  discount: number;
  subtotal: number;
  gst: number;
  total: number;
  terms: string;
  status: "draft" | "sent" | "approved" | "declined";
  internal_notes: string;
  created_at: string;
  updated_at: string;
};

export type JobVisit = {
  title: string;
  date: string;
  scheduleLater: boolean;
  startTime: string;
  endTime: string;
  anytime: boolean;
  assignedTo: string;
  instructions: string;
  emailTeam: boolean;
};

export type JobBillingFlags = {
  remindInvoiceOnClose: boolean;
  splitPaymentSchedule: boolean;
  discount?: number;
  gstRegistered?: boolean;
};

export type Job = {
  id: string;
  user_id: string;
  client_id: string | null;
  quote_id: string | null;
  number: string;
  title: string;
  visits: JobVisit[];
  billing_flags: JobBillingFlags;
  line_items: LineItem[];
  subtotal_cost: number;
  subtotal_price: number;
  status: "scheduled" | "active" | "completed";
  notes: string;
  attachments: unknown[];
  created_at: string;
  updated_at: string;
};

export type Invoice = {
  id: string;
  user_id: string;
  client_id: string | null;
  job_id: string | null;
  quote_id: string | null;
  request_id: string | null;
  number: string;
  subject: string;
  issued_date: string | null;
  payment_terms: string;
  line_items: LineItem[];
  discount: number;
  subtotal: number;
  gst: number;
  total: number;
  balance: number;
  paid_at: string | null;
  status: "draft" | "sent" | "paid" | "overdue";
  client_message: string;
  contract: string;
  internal_notes: string;
  attachments: unknown[];
  created_at: string;
  updated_at: string;
};

export type ExpenseCategory =
  | "COGS_Materials"
  | "Motor_Vehicle"
  | "Tools_Equipment"
  | "Subcontractors"
  | "Admin_Insurance";

export type ReceiptScanResult = {
  item_name: string;
  description: string;
  amount: number;
  gst_amount: number;
  gst_inclusive: boolean;
  expense_date: string;
  merchant: string;
  category: ExpenseCategory;
  accounting_code: string;
  reimburse_to: string;
};

export type Expense = {
  id: string;
  user_id: string;
  job_id: string | null;
  item_name: string;
  description: string;
  merchant: string;
  amount: number;
  gst_amount: number;
  gst_inclusive: boolean;
  category: ExpenseCategory;
  accounting_code: string;
  reimburse_to: string;
  expense_date: string | null;
  receipt_path: string;
  ai_extracted: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type ClientInsert = Omit<Client, "id" | "created_at" | "updated_at">;
export type RequestInsert = Omit<Request, "id" | "created_at" | "updated_at">;
export type QuoteInsert = Omit<Quote, "id" | "created_at" | "updated_at">;
export type JobInsert = Omit<Job, "id" | "created_at" | "updated_at">;
export type InvoiceInsert = Omit<Invoice, "id" | "created_at" | "updated_at">;
