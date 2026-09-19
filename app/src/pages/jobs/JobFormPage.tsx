import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Hammer } from "lucide-react";
import { FormSaveBar } from "@/components/ui/FormSaveBar";
import { ClientSelect } from "@/components/forms/ClientSelect";
import { JobSiteVisitCard } from "@/components/forms/JobSiteVisitCard";
import { JobBillingSection } from "@/components/forms/JobBillingSection";
import { JobLineItemsCard } from "@/components/forms/JobLineItemsCard";
import { JobTotalsPanel } from "@/components/forms/JobTotalsPanel";
import { JobVisitsSection } from "@/components/forms/JobVisitsSection";
import { RequestNotesCard } from "@/components/forms/RequestNotesCard";
import { useErrorBanner } from "@/context/ErrorBannerContext";
import { useClientsMap } from "@/hooks/useClientsMap";
import { calcLineCost, calcLineSubtotal } from "@/lib/line-items";
import {
  defaultBillingFlags,
  defaultJobVisit,
  displayJobNumber,
  parseBillingFlags,
  parseChecklists,
  parseVisits,
} from "@/lib/job-defaults";
import { EntityWorkflowBar } from "@/components/workflow/EntityWorkflowBar";
import { getClientBundle } from "@/lib/clients";
import { createJob, deleteJob, getJob, peekJobNumber, updateJob } from "@/lib/jobs";
import { upsertPipelineForWorkflow } from "@/lib/pipeline";
import { getQuote } from "@/lib/quotes";
import { getRequest, updateRequest } from "@/lib/requests";
import { resolveClientSiteAddress } from "@/lib/site-address";
import { getWorkSettings } from "@/lib/work-settings";
import { renderVisitTitle } from "@/lib/visit-title";
import type { Client, JobBillingFlags, JobChecklist, JobVisit, LineItem, WorkSettings } from "@/types/entities";

export function JobFormPage() {
  const { id } = useParams();
  const [search] = useSearchParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const { showError } = useErrorBanner();
  const { clients, map: clientsMap } = useClientsMap();
  const [workSettings, setWorkSettings] = useState<WorkSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewNumber, setPreviewNumber] = useState("");
  const [scheduleMode, setScheduleMode] = useState<"one-off" | "recurring">("one-off");
  const [showDiscount, setShowDiscount] = useState(false);
  const [showTax, setShowTax] = useState(false);
  const [saveOk, setSaveOk] = useState<string | null>(null);
  const [linkedClient, setLinkedClient] = useState<Client | null>(null);
  const fromRequest = search.get("fromRequest");
  const isMeasureUp = isNew && !!fromRequest;
  const [form, setForm] = useState({
    client_id: "",
    quote_id: "" as string | null,
    request_id: "" as string | null,
    title: "",
    visits: [defaultJobVisit()] as JobVisit[],
    checklists: [] as JobChecklist[],
    billing_flags: defaultBillingFlags() as JobBillingFlags,
    line_items: [] as LineItem[],
    status: "scheduled" as "scheduled" | "active" | "completed",
    site_address: "",
    notes: "",
  });

  async function loadClientContext(clientId: string, preferJobAddress?: string) {
    const bundle = await getClientBundle(clientId);
    if (!bundle) {
      setLinkedClient(null);
      return;
    }
    setLinkedClient(bundle.client);
    const fromClient = resolveClientSiteAddress(bundle.client, bundle.properties);
    setForm((f) => ({
      ...f,
      site_address: preferJobAddress?.trim() || f.site_address.trim() || fromClient,
    }));
  }

  useEffect(() => {
    getWorkSettings().then(setWorkSettings).catch(() => {});
  }, []);

  useEffect(() => {
    async function load() {
      try {
        if (isNew) {
          setPreviewNumber(await peekJobNumber());
          const fromQuote = search.get("fromQuote");
          const fromRequest = search.get("fromRequest");
          if (fromQuote) {
            const q = await getQuote(fromQuote);
            if (q) {
              setForm((f) => ({
                ...f,
                client_id: q.client_id ?? "",
                quote_id: q.id,
                request_id: q.request_id,
                title: q.title,
                line_items: q.line_items.map((li) => ({ ...li, unitCost: li.unitCost ?? 0 })),
              }));
              if (q.client_id) await loadClientContext(q.client_id);
            }
          } else if (fromRequest) {
            const r = await getRequest(fromRequest);
            if (r) {
              setForm((f) => ({
                ...f,
                client_id: r.client_id ?? "",
                request_id: r.id,
                title: r.title || "Measure-up visit",
                line_items: r.line_items.map((li) => ({ ...li, unitCost: li.unitCost ?? 0 })),
              }));
              if (r.client_id) await loadClientContext(r.client_id);
            }
          }
          setLoading(false);
          return;
        }
        const j = await getJob(id!);
        if (!j) throw new Error("Job not found");
        setPreviewNumber(displayJobNumber(j.number));
        const flags = parseBillingFlags(j.billing_flags);
        setShowDiscount(Number(flags.discount) > 0);
        setShowTax(!!flags.gstRegistered);
        setForm({
          client_id: j.client_id ?? "",
          quote_id: j.quote_id,
          request_id: j.request_id,
          title: j.title,
          visits: parseVisits(j.visits),
          checklists: parseChecklists(j.checklists),
          billing_flags: flags,
          line_items: j.line_items,
          status: j.status,
          site_address: j.site_address ?? "",
          notes: j.notes,
        });
        if (j.client_id) await loadClientContext(j.client_id, j.site_address ?? "");
      } catch (e) {
        showError(e instanceof Error ? e.message : "Load failed");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, isNew, search, showError]);

  const subtotalPrice = calcLineSubtotal(form.line_items);
  const subtotalCost = calcLineCost(form.line_items);

  async function persist() {
    setSaving(true);
    const payload = {
      client_id: form.client_id || null,
      quote_id: form.quote_id || null,
      request_id: form.request_id || null,
      title: form.title,
      visits: form.visits,
      checklists: form.checklists,
      billing_flags: {
        ...form.billing_flags,
        discount: form.billing_flags.discount ?? 0,
        gstRegistered: form.billing_flags.gstRegistered || showTax,
      },
      line_items: form.line_items,
      status: form.status,
      site_address: form.site_address.trim(),
      notes: form.notes,
    };
    try {
      if (isNew) {
        const j = await createJob(payload);
        if (form.request_id) {
          await updateRequest(form.request_id, { status: "approved" }).catch(() => {});
        }
        await upsertPipelineForWorkflow({
          request_id: form.request_id,
          quote_id: form.quote_id,
          job_id: j.id,
          client_id: form.client_id || null,
          title: form.title || j.number,
          stage: "lead",
          deal_value: j.subtotal_price,
          address: form.site_address.trim(),
        }).catch(() => {});
        setSaveOk(`Saved as ${j.number}`);
        navigate(`/leads/${j.id}`, { replace: true });
      } else {
        const j = await updateJob(id!, payload);
        setSaveOk(`Saved ${j.number}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Save failed";
      showError(msg.includes("column") ? `${msg} — run migrations 011–013 in Supabase.` : msg);
    } finally {
      setSaving(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await persist();
  }

  function convertToQuote() {
    if (isNew) {
      showError("Save the measure-up first, then create a quote.");
      return;
    }
    navigate(`/quotes/new?fromJob=${id}`);
  }

  function convertToInvoice() {
    if (isNew) {
      showError("Save the job first, then create an invoice.");
      return;
    }
    navigate(`/invoices/new?fromJob=${id}`);
  }

  async function onDelete() {
    if (!confirm("Delete this job?")) return;
    try {
      await deleteJob(id!);
      navigate("/leads");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  if (loading) return <p className="text-slate-500">Loading…</p>;

  return (
    <div className="pb-24">
      <div className="mb-6 flex items-start justify-between">
        <Link to="/leads" className="text-sm text-slate-500 hover:text-slate-800">
          ← Back
        </Link>
        {!isNew && (
          <div className="flex flex-wrap justify-end gap-2">
            <Link
              to={`/expenses/new?fromJob=${id}`}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
            >
              + Expense
            </Link>
            <Link
              to={`/timesheets/new?fromJob=${id}`}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
            >
              + Time
            </Link>
            <button
              type="button"
              onClick={convertToQuote}
              disabled={saving}
              className="rounded-lg bg-[var(--mp-navy)] px-4 py-2 text-sm font-bold text-white"
            >
              → Create quote
            </button>
            <button
              type="button"
              onClick={convertToInvoice}
              disabled={saving}
              className="rounded-lg border border-[var(--mp-navy)] px-4 py-2 text-sm font-bold text-[var(--mp-navy)]"
            >
              → Create invoice
            </button>
            <button type="button" onClick={onDelete} className="text-sm text-red-600 hover:underline">
              Delete
            </button>
          </div>
        )}
      </div>

      {!isNew && <EntityWorkflowBar anchor={{ leadId: id }} current="lead" />}
      {isNew && (form.quote_id || form.request_id) && (
        <EntityWorkflowBar anchor={{ quoteId: form.quote_id ?? undefined, requestId: form.request_id ?? undefined }} current="lead" />
      )}

      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-[var(--mp-orange)]">
          <Hammer size={22} />
        </span>
        <h1 className="text-2xl font-bold text-[var(--mp-navy)]">
          {isMeasureUp ? "Schedule lead visit" : isNew ? "New Lead" : `Lead ${previewNumber}`}
        </h1>
      </div>

      {saveOk && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
          {saveOk}
        </div>
      )}

      <FormSaveBar
        placement="top"
        saveLabel={isMeasureUp ? "Save lead visit" : "Save lead"}
        saving={saving}
        onSave={persist}
        cancelTo="/leads"
        hint="Fill in the details, then tap Save — nothing is stored until you do."
      />

      <form onSubmit={onSubmit} className="mx-auto max-w-3xl space-y-6">
        <input
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
        />

        <div className="grid gap-4 sm:grid-cols-[1fr_100px]">
          <ClientSelect
            clients={clients}
            value={form.client_id}
            onChange={(v) => {
              setForm({ ...form, client_id: v });
              if (v) loadClientContext(v).catch(() => setLinkedClient(null));
              else setLinkedClient(null);
            }}
          />
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Job #</label>
            <input readOnly value={previewNumber} className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm" />
            <p className="mt-1 text-xs text-slate-400">
              Customize{" "}
              <button type="button" className="font-semibold text-[var(--mp-orange)] underline" onClick={() => alert("Custom fields — Phase 5")}>
                Add Field
              </button>
            </p>
          </div>
        </div>

        <JobSiteVisitCard
          client={linkedClient}
          siteAddress={form.site_address}
          onSiteAddressChange={(site_address) => setForm({ ...form, site_address })}
          jobId={isNew ? undefined : id}
          requestId={form.request_id ?? undefined}
          measureUp={isMeasureUp || !!form.request_id}
        />

        <JobVisitsSection
          visits={form.visits}
          checklists={form.checklists}
          scheduleMode={scheduleMode}
          onScheduleModeChange={setScheduleMode}
          onChange={(visits) => setForm({ ...form, visits })}
          onChecklistsChange={(checklists) => setForm({ ...form, checklists })}
          visitTitlePreview={
            workSettings
              ? renderVisitTitle(workSettings.visit_title_template, {
                  clientName: form.client_id ? clientsMap.get(form.client_id) ?? "" : "",
                  jobTitle: form.title,
                  jobNumber: previewNumber,
                })
              : undefined
          }
          assignedDefault={workSettings?.invoice_reminder_assigned_to ?? "Richo Petersen"}
        />

        <JobBillingSection flags={form.billing_flags} onChange={(billing_flags) => setForm({ ...form, billing_flags })} />

        <JobLineItemsCard items={form.line_items} onChange={(line_items) => setForm({ ...form, line_items })} />

        <div className="flex justify-end">
          <div className="w-full max-w-sm">
            <JobTotalsPanel
              subtotalPrice={subtotalPrice}
              subtotalCost={subtotalCost}
              discount={form.billing_flags.discount ?? 0}
              gstRegistered={form.billing_flags.gstRegistered || showTax}
              showDiscount={showDiscount || (form.billing_flags.discount ?? 0) > 0}
              showTax={showTax || !!form.billing_flags.gstRegistered}
              onToggleDiscount={() => setShowDiscount(true)}
              onToggleTax={() => {
                setShowTax(true);
                setForm({ ...form, billing_flags: { ...form.billing_flags, gstRegistered: true } });
              }}
              onDiscountChange={(discount) => setForm({ ...form, billing_flags: { ...form.billing_flags, discount } })}
            />
          </div>
        </div>

        <RequestNotesCard notes={form.notes} onChange={(notes) => setForm({ ...form, notes })} />
      </form>

      <FormSaveBar
        placement="bottom"
        saveLabel={isMeasureUp ? "Save lead visit" : "Save lead"}
        saving={saving}
        onSave={persist}
        cancelTo="/leads"
      />
    </div>
  );
}
