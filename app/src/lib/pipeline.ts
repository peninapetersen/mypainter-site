import { requireUserId } from "@/lib/auth";
import { clientDisplayName } from "@/lib/client-display";
import { listClients } from "@/lib/clients";
import { listInvoices, updateInvoice } from "@/lib/invoices";
import { jobsOnDealValue, listJobsOn } from "@/lib/jobs-on";
import { listJobs } from "@/lib/jobs";
import { normalisePipelineStage } from "@/lib/pipeline-stages";
import { listQuotes } from "@/lib/quotes";
import { listRequests } from "@/lib/requests";
import { supabase } from "@/lib/supabase";
import type { Invoice, Job, JobOn, PipelineOpportunity, PipelineStage, Quote, Request } from "@/types/entities";

export async function listPipeline(): Promise<PipelineOpportunity[]> {
  const { data, error } = await supabase
    .from("mp_pipeline_opportunities")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(normaliseStage) as PipelineOpportunity[];
}

function normaliseStage(row: PipelineOpportunity): PipelineOpportunity {
  const stage = normalisePipelineStage(String(row.stage));
  return { ...row, stage, deal_value: Number(row.deal_value) };
}

export async function createPipelineCard(input: {
  title: string;
  stage?: PipelineStage;
  client_id?: string | null;
  deal_value?: number;
  address?: string;
  assigned_to?: string;
}): Promise<PipelineOpportunity> {
  const user_id = await requireUserId();
  const stage = input.stage ?? "lead";
  const { count } = await supabase
    .from("mp_pipeline_opportunities")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user_id)
    .eq("stage", stage);
  const { data, error } = await supabase
    .from("mp_pipeline_opportunities")
    .insert({
      user_id,
      title: input.title,
      stage,
      client_id: input.client_id ?? null,
      deal_value: input.deal_value ?? 0,
      address: input.address ?? "",
      assigned_to: input.assigned_to ?? "Richo Petersen",
      sort_order: count ?? 0,
    })
    .select("*")
    .single();
  if (error) throw error;
  return normaliseStage(data as PipelineOpportunity);
}

export async function movePipelineCard(
  id: string,
  stage: PipelineStage,
  sortOrder: number,
): Promise<PipelineOpportunity> {
  const patch: Partial<PipelineOpportunity> = { stage, sort_order: sortOrder };

  const { data: existing } = await supabase.from("mp_pipeline_opportunities").select("*").eq("id", id).maybeSingle();
  const card = existing as PipelineOpportunity | null;

  if (stage === "testimonial" && card) {
    patch.testimonial_requested = true;
  }

  const { data, error } = await supabase
    .from("mp_pipeline_opportunities")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;

  const updated = normaliseStage(data as PipelineOpportunity);

  if (stage === "paid" && updated.invoice_id) {
    await updateInvoice(updated.invoice_id, { status: "paid", balance: 0 });
  }
  if (stage === "testimonial" && updated.invoice_id) {
    await updateInvoice(updated.invoice_id, { status: "paid", balance: 0 });
  }

  return updated;
}

export async function deletePipelineCard(id: string): Promise<void> {
  const { error } = await supabase.from("mp_pipeline_opportunities").delete().eq("id", id);
  if (error) throw error;
}

function entityLinked(
  cards: PipelineOpportunity[],
  field: "request_id" | "quote_id" | "job_id" | "jobs_on_id" | "invoice_id",
  id: string,
): boolean {
  return cards.some((c) => c[field] === id);
}

function deriveStageFromInvoice(inv: Invoice): PipelineStage {
  if (inv.status === "paid") return "paid";
  return "invoiced";
}

function deriveStageFromQuote(q: Quote): PipelineStage {
  if (q.status === "approved") return "jobs_on";
  return "quote";
}

function deriveStageFromLead(_j: Job): PipelineStage {
  return "lead";
}

function deriveStageFromJobsOn(_j: JobOn): PipelineStage {
  return "jobs_on";
}

function deriveStageFromRequest(_r: Request): PipelineStage {
  return "lead";
}

const LINK_COLUMNS = [
  "request_id",
  "quote_id",
  "job_id",
  "jobs_on_id",
  "invoice_id",
  "testimonial_requested",
  "testimonial_received",
] as const;

async function insertPipelineRows(rows: Record<string, unknown>[]) {
  const { error } = await supabase.from("mp_pipeline_opportunities").insert(rows);
  if (!error) return;
  if (/column|schema cache|PGRST204/i.test(error.message)) {
    const basic = rows.map((row) => {
      const copy = { ...row };
      for (const k of LINK_COLUMNS) delete copy[k];
      return copy;
    });
    const { error: e2 } = await supabase.from("mp_pipeline_opportunities").insert(basic);
    if (e2) throw e2;
    return;
  }
  throw error;
}

export type PipelineSyncResult = {
  added: number;
  clients: number;
  requests: number;
  quotes: number;
  jobs: number;
  invoices: number;
};

/** Import clients, requests, quotes, jobs, invoices that aren't on the board yet. */
export async function syncPipelineFromEntities(): Promise<PipelineSyncResult> {
  const user_id = await requireUserId();
  const [cards, requests, quotes, jobs, jobsOn, invoices, clients] = await Promise.all([
    listPipeline(),
    listRequests(),
    listQuotes(),
    listJobs(),
    listJobsOn().catch(() => [] as JobOn[]),
    listInvoices(),
    listClients(),
  ]);

  const clientMap = new Map(clients.map((c) => [c.id, c]));
  const inserts: Record<string, unknown>[] = [];
  const counts = { clients: 0, requests: 0, quotes: 0, jobs: 0, invoices: 0 };
  let orderByStage: Record<PipelineStage, number> = {
    lead: cards.filter((c) => c.stage === "lead" || c.stage === ("job" as PipelineStage)).length,
    quote: cards.filter((c) => c.stage === "quote").length,
    jobs_on: cards.filter((c) => c.stage === "jobs_on").length,
    invoiced: cards.filter((c) => c.stage === "invoiced").length,
    paid: cards.filter((c) => c.stage === "paid").length,
    testimonial: cards.filter((c) => c.stage === "testimonial").length,
  };

  function push(row: Record<string, unknown>) {
    inserts.push({ user_id, assigned_to: "Richo Petersen", ...row });
  }

  for (const inv of invoices) {
    if (entityLinked(cards, "invoice_id", inv.id)) continue;
    const stage = deriveStageFromInvoice(inv);
    const client = inv.client_id ? clientMap.get(inv.client_id) : null;
    push({
      title: inv.subject || `Invoice ${inv.number}`,
      stage,
      client_id: inv.client_id,
      deal_value: Number(inv.total),
      address: client?.address ?? "",
      invoice_id: inv.id,
      quote_id: inv.quote_id,
      job_id: inv.job_id,
      jobs_on_id: inv.jobs_on_id,
      request_id: inv.request_id,
      sort_order: orderByStage[stage]++,
    });
  }

  for (const on of jobsOn) {
    if (entityLinked(cards, "jobs_on_id", on.id)) continue;
    const hasInvoice = invoices.some((i) => i.jobs_on_id === on.id);
    if (hasInvoice) continue;
    const stage = deriveStageFromJobsOn(on);
    const client = on.client_id ? clientMap.get(on.client_id) : null;
    push({
      title: on.title || `Jobs On ${on.number}`,
      stage,
      client_id: on.client_id,
      deal_value: jobsOnDealValue(on),
      address: on.site_address || client?.address || "",
      jobs_on_id: on.id,
      job_id: on.lead_id,
      quote_id: on.quote_id,
      request_id: on.request_id,
      sort_order: orderByStage[stage]++,
    });
  }

  for (const job of jobs) {
    if (entityLinked(cards, "job_id", job.id)) continue;
    const hasJobsOn = jobsOn.some((o) => o.lead_id === job.id);
    const hasInvoice = invoices.some((i) => i.job_id === job.id);
    if (hasJobsOn || hasInvoice) continue;
    const stage = deriveStageFromLead(job);
    const client = job.client_id ? clientMap.get(job.client_id) : null;
    push({
      title: job.title || `Lead ${job.number}`,
      stage,
      client_id: job.client_id,
      deal_value: Number(job.subtotal_price),
      address: job.site_address || client?.address || "",
      job_id: job.id,
      quote_id: job.quote_id,
      sort_order: orderByStage[stage]++,
    });
  }

  for (const q of quotes) {
    if (entityLinked(cards, "quote_id", q.id)) continue;
    const hasJobsOn = jobsOn.some((o) => o.quote_id === q.id);
    const hasInvoice = invoices.some((i) => i.quote_id === q.id);
    if (hasJobsOn || hasInvoice) continue;
    if (q.status === "declined") continue;
    const stage = deriveStageFromQuote(q);
    const client = q.client_id ? clientMap.get(q.client_id) : null;
    push({
      title: q.title || `Quote ${q.number}`,
      stage,
      client_id: q.client_id,
      deal_value: Number(q.total),
      address: client?.address ?? "",
      quote_id: q.id,
      request_id: q.request_id,
      sort_order: orderByStage[stage]++,
    });
  }

  for (const r of requests) {
    if (entityLinked(cards, "request_id", r.id)) continue;
    const hasQuote = quotes.some((q) => q.request_id === r.id);
    if (hasQuote) continue;
    if (r.status === "closed") continue;
    const stage = deriveStageFromRequest(r);
    const client = r.client_id ? clientMap.get(r.client_id) : null;
    push({
      title: r.title || "New request",
      stage,
      client_id: r.client_id,
      deal_value: Number(r.subtotal),
      address: client?.address ?? "",
      request_id: r.id,
      sort_order: orderByStage[stage]++,
    });
  }

  if (!inserts.length) {
    return { added: 0, clients: 0, requests: 0, quotes: 0, jobs: 0, invoices: 0 };
  }
  const { error } = await supabase.from("mp_pipeline_opportunities").insert(inserts);
  if (error) throw error;
  return {
    added: inserts.length,
    clients: 0,
    requests: inserts.filter((r) => r.request_id).length,
    quotes: inserts.filter((r) => r.quote_id).length,
    jobs: inserts.filter((r) => r.job_id).length,
    invoices: inserts.filter((r) => r.invoice_id).length,
  };
}

/** Keep pipeline board in sync when converting between workflow steps. */
export async function upsertPipelineForWorkflow(input: {
  request_id?: string | null;
  quote_id?: string | null;
  job_id?: string | null;
  jobs_on_id?: string | null;
  invoice_id?: string | null;
  title: string;
  stage: PipelineStage;
  client_id?: string | null;
  deal_value?: number;
  address?: string;
}): Promise<void> {
  const user_id = await requireUserId();
  const cards = await listPipeline();
  const match = cards.find(
    (c) =>
      (input.request_id && c.request_id === input.request_id) ||
      (input.quote_id && c.quote_id === input.quote_id) ||
      (input.job_id && c.job_id === input.job_id) ||
      (input.jobs_on_id && c.jobs_on_id === input.jobs_on_id) ||
      (input.invoice_id && c.invoice_id === input.invoice_id),
  );

  const patch = {
    title: input.title,
    stage: input.stage,
    client_id: input.client_id ?? null,
    deal_value: input.deal_value ?? 0,
    request_id: input.request_id ?? null,
    quote_id: input.quote_id ?? null,
    job_id: input.job_id ?? null,
    jobs_on_id: input.jobs_on_id ?? null,
    invoice_id: input.invoice_id ?? null,
    ...(input.address !== undefined ? { address: input.address } : {}),
  };

  if (match) {
    const { error } = await supabase.from("mp_pipeline_opportunities").update(patch).eq("id", match.id);
    if (error) throw error;
    return;
  }

  const { count } = await supabase
    .from("mp_pipeline_opportunities")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user_id)
    .eq("stage", input.stage);

  const { error } = await supabase.from("mp_pipeline_opportunities").insert({
    user_id,
    assigned_to: "Richo Petersen",
    sort_order: count ?? 0,
    ...patch,
  });
  if (error) throw error;
}

export function pipelineCardHref(card: PipelineOpportunity): string | null {
  if (card.invoice_id) return `/invoices/${card.invoice_id}`;
  if (card.jobs_on_id) return `/jobs-on/${card.jobs_on_id}`;
  if (card.job_id) return `/leads/${card.job_id}`;
  if (card.quote_id) return `/quotes/${card.quote_id}`;
  if (card.request_id) return `/requests/${card.request_id}`;
  return null;
}
