import { resolveJobsOnSiteAddress } from "@/lib/jobs-on-address";
import { createJobsOnFromQuote, getJobsOnByQuote, updateJobsOn } from "@/lib/jobs-on";
import { listJobs } from "@/lib/jobs";
import { upsertPipelineForWorkflow } from "@/lib/pipeline";
import { getQuote } from "@/lib/quotes";
import type { JobOn, LineItem } from "@/types/entities";

function jobsOnTableHint(message: string): string {
  if (/relation.*mp_jobs_on|mp_jobs_on.*does not exist|schema cache|PGRST204/i.test(message)) {
    return `${message} — run supabase/migrations/017_jobs_on_table_only.sql in Supabase SQL editor, then retry.`;
  }
  return message;
}

/** Approved quote must have a Jobs On row — create or reactivate if customer approve missed it. */
export async function ensureJobsOnForApprovedQuote(quoteId: string): Promise<JobOn> {
  const quote = await getQuote(quoteId);
  if (!quote) throw new Error("Quote not found");
  if (quote.status !== "approved") throw new Error("Quote is not approved yet");

  const existing = await getJobsOnByQuote(quoteId);
  if (existing) {
    if (existing.status === "draft") {
      const leadForAddr = existing.lead_id ?? null;
      const site_address =
        existing.site_address?.trim() ||
        (await resolveJobsOnSiteAddress({
          client_id: quote.client_id,
          lead_id: leadForAddr,
        }));
      const reactivated = await updateJobsOn(existing.id, {
        status: "active",
        approved_at: new Date().toISOString(),
        title: quote.title || existing.title,
        line_items: (quote.line_items ?? []).filter((li: LineItem) => !li.isText),
        ...(site_address ? { site_address } : {}),
      });
      await syncPipeline(quote, reactivated);
      return reactivated;
    }
    return existing;
  }

  const leads = await listJobs().catch(() => []);
  const lead =
    leads.find((j) => j.quote_id === quoteId) ??
    (quote.request_id ? leads.find((j) => j.request_id === quote.request_id) : null) ??
    null;

  try {
    const jobsOn = await createJobsOnFromQuote({
      quote,
      lead_id: lead?.id ?? null,
    });
    await syncPipeline(quote, jobsOn);
    return jobsOn;
  } catch (e) {
    throw new Error(jobsOnTableHint(e instanceof Error ? e.message : "Could not create Jobs On"));
  }
}

async function syncPipeline(quote: NonNullable<Awaited<ReturnType<typeof getQuote>>>, jobsOn: JobOn) {
  await upsertPipelineForWorkflow({
    request_id: quote.request_id,
    quote_id: quote.id,
    job_id: jobsOn.lead_id,
    jobs_on_id: jobsOn.id,
    client_id: quote.client_id,
    title: jobsOn.title || quote.number,
    stage: "jobs_on",
    deal_value: Number(quote.total),
  }).catch(() => {});
}
