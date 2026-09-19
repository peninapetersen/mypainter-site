export type LineItem = {
  name: string;
  description?: string;
  qty: number;
  unitPrice: number;
  unitCost?: number;
  optional?: boolean;
  /** Income account code — from catalogue category default */
  account_code?: string;
  /** Text-only block (Jobber "Add Text") — excluded from totals */
  isText?: boolean;
};

export type CustomField = { label: string; value: string };

export type GalleryImage = { path: string; caption?: string };

export type CommunicationSettings = { email: boolean; sms: boolean };

export type TaxMode = "exclusive" | "inclusive";

export type AccountCodeType = "income" | "expense" | "asset" | "other";

export type AccountGstType = "gst_on_income" | "gst_on_expenses" | "no_gst" | "zero_rated";

/** Where an account code appears in Richard's workflow. */
export type AccountCodeSection =
  | "products_services"
  | "quotes"
  | "invoices"
  | "expenses"
  | "suppliers"
  | "jobs_on_costs"
  | "contractors"
  | "tax_return";

export type AccountCode = {
  id: string;
  user_id: string;
  code: string;
  name: string;
  friendly_name: string;
  account_type: AccountCodeType;
  gst_type: AccountGstType;
  description: string;
  applies_to: AccountCodeSection[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type Supplier = {
  id: string;
  user_id: string;
  name: string;
  company_name: string;
  email: string;
  phone: string;
  mobile: string;
  fax: string;
  address: string;
  physical_street_1: string;
  physical_street_2: string;
  physical_city: string;
  physical_region: string;
  physical_postal_code: string;
  physical_country: string;
  postal_street_1: string;
  postal_street_2: string;
  postal_city: string;
  postal_region: string;
  postal_postal_code: string;
  postal_country: string;
  default_due_days: number;
  tax_mode: TaxMode;
  default_account_code: string;
  gst_number: string;
  account_code: string;
  website: string;
  logo_path: string;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type Contractor = {
  id: string;
  user_id: string;
  name: string;
  company_name: string;
  email: string;
  phone: string;
  trade: string;
  hourly_rate: number;
  day_rate: number;
  photo_path: string;
  website: string;
  notes: string;
  created_at: string;
  updated_at: string;
};

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
  client_type: "person" | "company";
  last_activity_at: string | null;
  photo_path: string;
  website: string;
  /** CRM link — another client record representing the company/org */
  company_client_id: string | null;
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
  service_id: string | null;
  title: string;
  requested_on: string | null;
  service_details: string;
  measurements: Record<string, unknown>;
  estimate_subtotal: number;
  source: "admin" | "website" | "contact";
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
  approval_token: string | null;
  sent_at: string | null;
  approved_at: string | null;
  internal_notes: string;
  created_at: string;
  updated_at: string;
};

/** Approved work in progress — created when customer approves a quote. */
export type JobOn = {
  id: string;
  user_id: string;
  lead_id: string | null;
  quote_id: string | null;
  request_id: string | null;
  client_id: string | null;
  number: string;
  title: string;
  site_address: string;
  line_items: LineItem[];
  images: GalleryImage[];
  notes: string;
  status: "draft" | "active" | "completed";
  approved_at: string;
  created_at: string;
  updated_at: string;
};

export type JobChecklistItem = {
  id: string;
  label: string;
  checked: boolean;
  notes: string;
};

export type JobChecklist = {
  id: string;
  title: string;
  items: JobChecklistItem[];
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
  request_id: string | null;
  number: string;
  title: string;
  visits: JobVisit[];
  checklists: JobChecklist[];
  billing_flags: JobBillingFlags;
  line_items: LineItem[];
  subtotal_cost: number;
  subtotal_price: number;
  status: "scheduled" | "active" | "completed";
  site_address: string;
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
  jobs_on_id: string | null;
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
  testimonial_token: string | null;
  sent_at: string | null;
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
  quote_id: string | null;
  jobs_on_id: string | null;
  invoice_id: string | null;
  supplier_id: string | null;
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

export type CrewTimesheet = {
  id: string;
  user_id: string;
  crew_member: string;
  job_id: string | null;
  jobs_on_id: string | null;
  contractor_id: string | null;
  check_in_time: string | null;
  check_out_time: string | null;
  duration_seconds: number | null;
  geo: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type PipelineStage = "lead" | "quote" | "jobs_on" | "invoiced" | "paid" | "testimonial";

export type Testimonial = {
  id: string;
  user_id: string;
  client_id: string | null;
  lead_id: string | null;
  quote_id: string | null;
  jobs_on_id: string | null;
  invoice_id: string | null;
  customer_name: string;
  rating: number;
  review_text: string;
  submitted_at: string;
  created_at: string;
  updated_at: string;
};

export type PipelineOpportunity = {
  id: string;
  user_id: string;
  client_id: string | null;
  title: string;
  stage: PipelineStage;
  deal_value: number;
  assigned_to: string;
  address: string;
  outcome: string | null;
  outcome_reason: string;
  sort_order: number;
  request_id: string | null;
  quote_id: string | null;
  job_id: string | null;
  jobs_on_id: string | null;
  invoice_id: string | null;
  testimonial_requested: boolean;
  testimonial_received: boolean;
  created_at: string;
  updated_at: string;
};

export type ScheduleEventKind = "personal" | "task";

export type ScheduleEventRecord = {
  id: string;
  user_id: string;
  kind: ScheduleEventKind;
  title: string;
  description: string;
  starts_at: string;
  ends_at: string | null;
  all_day: boolean;
  assigned_to: string;
  client_id: string | null;
  created_at: string;
  updated_at: string;
};

export type CalendarEventKind = "job_visit" | "request" | "task" | "personal";

export type CalendarEvent = {
  id: string;
  kind: CalendarEventKind;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  personal: boolean;
  assignedTo?: string;
  clientId?: string | null;
  href?: string;
};

export type WorkSettings = {
  user_id: string;
  quote_reminder_enabled: boolean;
  quote_reminder_days: number;
  arrival_window: string;
  arrival_window_style: "after" | "center";
  visit_title_template: string;
  invoice_subject_default: string;
  invoice_use_job_title: boolean;
  payment_terms_residential: string;
  payment_terms_commercial: string;
  statement_sort_order: "newest_first" | "oldest_first";
  statement_disclaimer: string;
  invoice_reminder_reassign: boolean;
  invoice_reminder_assigned_to: string;
  quote_default_terms: string;
  invoice_default_contract: string;
  document_phone: string;
  document_email: string;
  document_tagline: string;
  gst_rate: number;
  gst_default_on_quotes: boolean;
  gst_default_on_invoices: boolean;
  default_tax_mode: TaxMode;
  contact_list_columns: Record<string, { visible: string[] }>;
  created_at: string;
  updated_at: string;
};

export type ClientInsert = Omit<Client, "id" | "created_at" | "updated_at">;
export type RequestInsert = Omit<Request, "id" | "created_at" | "updated_at">;
export type QuoteInsert = Omit<Quote, "id" | "created_at" | "updated_at">;
export type JobInsert = Omit<Job, "id" | "created_at" | "updated_at">;
export type InvoiceInsert = Omit<Invoice, "id" | "created_at" | "updated_at">;
