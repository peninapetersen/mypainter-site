import { listExpenses } from "@/lib/expenses";
import { getInvoice, listInvoices } from "@/lib/invoices";
import { ensureJobsOnForApprovedQuote } from "@/lib/jobs-on-sync";
import { getJobsOn, listJobsOn } from "@/lib/jobs-on";
import { getJob, listJobs } from "@/lib/jobs";
import { getQuote, listQuotes } from "@/lib/quotes";
import { getRequest } from "@/lib/requests";
import { listTimesheets } from "@/lib/timesheets";
import type { CrewTimesheet, Expense, Invoice, Job, JobOn, Quote, Request } from "@/types/entities";

export type WorkflowChain = {
  request: Request | null;
  quote: Quote | null;
  lead: Job | null;
  jobsOn: JobOn | null;
  invoice: Invoice | null;
  expenses: Expense[];
  timesheets: CrewTimesheet[];
};

export type WorkflowAnchor = {
  requestId?: string;
  quoteId?: string;
  leadId?: string;
  /** @deprecated use leadId — same mp_jobs row */
  jobId?: string;
  jobsOnId?: string;
  invoiceId?: string;
};

async function latestQuoteForRequest(requestId: string, quotes: Quote[]): Promise<Quote | null> {
  return quotes.find((q) => q.request_id === requestId) ?? null;
}

async function latestLeadForQuote(quoteId: string, leads: Job[]): Promise<Job | null> {
  return leads.find((j) => j.quote_id === quoteId) ?? null;
}

async function latestLeadForRequest(requestId: string, leads: Job[]): Promise<Job | null> {
  return leads.find((j) => j.request_id === requestId) ?? null;
}

async function latestJobsOnForQuote(quoteId: string, rows: JobOn[]): Promise<JobOn | null> {
  return rows.find((o) => o.quote_id === quoteId) ?? null;
}

async function latestInvoiceForJobsOn(jobsOnId: string, invoices: Invoice[]): Promise<Invoice | null> {
  return invoices.find((i) => i.jobs_on_id === jobsOnId) ?? null;
}

async function latestInvoiceForLead(leadId: string, invoices: Invoice[]): Promise<Invoice | null> {
  return invoices.find((i) => i.job_id === leadId) ?? null;
}

async function latestInvoiceForQuote(quoteId: string, invoices: Invoice[]): Promise<Invoice | null> {
  return invoices.find((i) => i.quote_id === quoteId) ?? null;
}

/** Walk FK links: Request → Lead → Quote → Jobs On → Invoice. */
export async function loadWorkflowChain(anchor: WorkflowAnchor): Promise<WorkflowChain> {
  const leadId = anchor.leadId ?? anchor.jobId;
  const [quotes, leads, jobsOnList, invoices, allExpenses, allTimesheets] = await Promise.all([
    listQuotes(),
    listJobs(),
    listJobsOn().catch(() => [] as JobOn[]),
    listInvoices(),
    listExpenses(),
    listTimesheets(),
  ]);

  let request: Request | null = null;
  let quote: Quote | null = null;
  let lead: Job | null = null;
  let jobsOn: JobOn | null = null;
  let invoice: Invoice | null = null;

  if (anchor.invoiceId) {
    invoice = await getInvoice(anchor.invoiceId);
    if (invoice?.jobs_on_id) jobsOn = jobsOnList.find((o) => o.id === invoice!.jobs_on_id) ?? (await getJobsOn(invoice.jobs_on_id));
    if (invoice?.job_id) lead = leads.find((j) => j.id === invoice!.job_id) ?? (await getJob(invoice.job_id));
    if (invoice?.quote_id) quote = quotes.find((q) => q.id === invoice!.quote_id) ?? (await getQuote(invoice.quote_id));
    if (invoice?.request_id) request = await getRequest(invoice.request_id);
  }

  if (anchor.jobsOnId && !jobsOn) {
    jobsOn = await getJobsOn(anchor.jobsOnId);
  }
  if (leadId && !lead) {
    lead = await getJob(leadId);
  }
  if (anchor.quoteId && !quote) {
    quote = await getQuote(anchor.quoteId);
  }
  if (anchor.requestId && !request) {
    request = await getRequest(anchor.requestId);
  }

  if (jobsOn && !quote && jobsOn.quote_id) {
    quote = quotes.find((q) => q.id === jobsOn!.quote_id) ?? (await getQuote(jobsOn.quote_id));
  }
  if (jobsOn && !lead && jobsOn.lead_id) {
    lead = leads.find((j) => j.id === jobsOn!.lead_id) ?? (await getJob(jobsOn.lead_id));
  }
  if (lead && !quote && lead.quote_id) {
    quote = quotes.find((q) => q.id === lead!.quote_id) ?? (await getQuote(lead.quote_id));
  }
  if (lead && !request && lead.request_id) {
    request = await getRequest(lead.request_id);
  }
  if (quote && !request && quote.request_id) {
    request = await getRequest(quote.request_id);
  }

  if (request && !lead) lead = await latestLeadForRequest(request.id, leads);
  if (quote && !jobsOn) jobsOn = await latestJobsOnForQuote(quote.id, jobsOnList);
  if (quote?.status === "approved" && !jobsOn) {
    try {
      jobsOn = await ensureJobsOnForApprovedQuote(quote.id);
    } catch {
      /* QuoteFormPage shows repair button */
    }
  }
  if (quote && !lead) lead = await latestLeadForQuote(quote.id, leads);
  if (request && !quote) quote = await latestQuoteForRequest(request.id, quotes);

  if (!invoice && jobsOn) invoice = await latestInvoiceForJobsOn(jobsOn.id, invoices);
  if (!invoice && lead) invoice = await latestInvoiceForLead(lead.id, invoices);
  if (!invoice && quote) invoice = await latestInvoiceForQuote(quote.id, invoices);

  const expenseFilter = (e: Expense) =>
    (lead && e.job_id === lead.id) ||
    (quote && e.quote_id === quote.id) ||
    (jobsOn && e.jobs_on_id === jobsOn.id) ||
    (invoice && e.invoice_id === invoice.id);

  const timesheetFilter = (t: CrewTimesheet) =>
    (jobsOn && t.jobs_on_id === jobsOn.id) || (lead != null && t.job_id === lead.id);

  return {
    request,
    quote,
    lead,
    jobsOn,
    invoice,
    expenses: allExpenses.filter(expenseFilter),
    timesheets: allTimesheets.filter(timesheetFilter),
  };
}
