import { DEFAULT_INVOICE_CONTRACT } from "@/lib/invoice-defaults";
import { formatCurrency } from "@/lib/nz";
import { formatDuration } from "@/lib/timesheets";
import { loadWorkflowChain, type WorkflowAnchor } from "@/lib/workflow";
import type { Expense, Job, JobOn, LineItem, Quote, Request } from "@/types/entities";

export type InvoicePrefill = {
  client_id: string | null;
  job_id: string | null;
  jobs_on_id: string | null;
  quote_id: string | null;
  request_id: string | null;
  subject: string;
  line_items: LineItem[];
  discount: number;
  gstRegistered: boolean;
  contract: string;
  client_message: string;
  internal_notes: string;
  /** Expenses added as line items — link to invoice on save */
  expenseIdsToLink: string[];
  expensesAddedCount: number;
};

function pricedItems(items: LineItem[] | undefined | null): LineItem[] {
  return (items ?? []).filter((li) => !li.isText);
}

function expenseLineItem(e: Expense): LineItem {
  const label = e.item_name?.trim() || e.merchant?.trim() || e.description?.trim() || "Materials";
  const detail = [e.merchant, e.description].filter((s) => s?.trim()).join(" · ");
  return {
    name: detail && detail !== label ? `${label} (${detail})` : label,
    qty: 1,
    unitPrice: Number(e.amount || 0),
    account_code: e.accounting_code || undefined,
  };
}

function buildInternalNotes(opts: {
  jobsOn: JobOn | null;
  quote: Quote | null;
  lead: Job | null;
  request: Request | null;
  billableExpenses: Expense[];
  workedSeconds: number;
}): string {
  const lines: string[] = [];
  const { jobsOn, quote, lead, request, billableExpenses, workedSeconds } = opts;

  if (jobsOn) {
    lines.push(`${jobsOn.number}${jobsOn.title ? ` · ${jobsOn.title}` : ""}`);
    if (jobsOn.site_address?.trim()) lines.push(`Site: ${jobsOn.site_address.trim()}`);
  }
  if (quote?.number) lines.push(`Quote: ${quote.number}`);
  if (lead?.number) lines.push(`Lead: ${lead.number}`);
  if (request?.title) lines.push(`Request: ${request.title}`);

  if (jobsOn?.notes?.trim()) lines.push("", "Job notes:", jobsOn.notes.trim());
  if (quote?.internal_notes?.trim()) lines.push("", "Quote notes:", quote.internal_notes.trim());
  if (lead?.notes?.trim()) lines.push("", "Lead notes:", lead.notes.trim());
  if (request?.internal_notes?.trim()) lines.push("", "Request notes:", request.internal_notes.trim());

  if (billableExpenses.length) {
    const total = billableExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);
    lines.push("", `Job expenses on invoice (${formatCurrency(total)}):`);
    for (const e of billableExpenses) {
      const label = e.item_name || e.merchant || e.description || "Expense";
      lines.push(`· ${label} — ${formatCurrency(Number(e.amount || 0))}`);
    }
  }

  if (workedSeconds > 0) lines.push("", `Time logged on job: ${formatDuration(workedSeconds)}`);

  return lines.join("\n").trim();
}

function buildClientMessage(jobsOn: JobOn | null): string {
  const site = jobsOn?.site_address?.trim();
  if (site) return `Thank you for your business. Work completed at ${site}.`;
  return "";
}

/** Build invoice fields from Request → Lead → Quote → Jobs On chain, including job expenses as line items. */
export async function prefillInvoiceFromWorkflow(
  anchor: WorkflowAnchor,
  opts?: { subjectDefault?: string; useJobTitle?: boolean },
): Promise<InvoicePrefill> {
  const chain = await loadWorkflowChain(anchor);
  const { jobsOn, quote, lead, request, expenses, timesheets } = chain;

  const workedSeconds = timesheets.reduce((s, t) => s + (t.duration_seconds ?? 0), 0);
  const billableExpenses = expenses.filter((e) => !e.invoice_id && Number(e.amount || 0) > 0);

  let baseItems: LineItem[] = [];
  if (jobsOn?.line_items?.length) baseItems = pricedItems(jobsOn.line_items);
  else if (quote?.line_items?.length) baseItems = pricedItems(quote.line_items);
  else if (lead?.line_items?.length) baseItems = pricedItems(lead.line_items);
  else if (request?.line_items?.length) baseItems = pricedItems(request.line_items);

  const expenseItems = billableExpenses.map(expenseLineItem);
  const line_items = [...baseItems, ...expenseItems];

  const subjectDefault = opts?.subjectDefault ?? "For Services Rendered";
  const useJobTitle = opts?.useJobTitle ?? true;
  const subject = useJobTitle
    ? jobsOn?.title || quote?.title || lead?.title || request?.title || subjectDefault
    : subjectDefault;

  const discount = Number(quote?.discount ?? lead?.billing_flags?.discount ?? 0);
  const gstRegistered = Number(quote?.gst ?? 0) > 0 || !!lead?.billing_flags?.gstRegistered;
  const contract = quote?.terms?.trim() || DEFAULT_INVOICE_CONTRACT;

  return {
    client_id: jobsOn?.client_id ?? quote?.client_id ?? lead?.client_id ?? request?.client_id ?? null,
    job_id: jobsOn?.lead_id ?? lead?.id ?? null,
    jobs_on_id: jobsOn?.id ?? null,
    quote_id: jobsOn?.quote_id ?? quote?.id ?? lead?.quote_id ?? null,
    request_id: jobsOn?.request_id ?? quote?.request_id ?? lead?.request_id ?? request?.id ?? null,
    subject,
    line_items,
    discount,
    gstRegistered,
    contract,
    client_message: buildClientMessage(jobsOn),
    internal_notes: buildInternalNotes({
      jobsOn,
      quote,
      lead,
      request,
      billableExpenses,
      workedSeconds,
    }),
    expenseIdsToLink: billableExpenses.map((e) => e.id),
    expensesAddedCount: billableExpenses.length,
  };
}
