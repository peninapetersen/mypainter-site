import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ChevronDown, Plus, Receipt } from "lucide-react";
import { ClientSelect } from "@/components/forms/ClientSelect";
import { InvoiceClientMessageSection } from "@/components/forms/InvoiceClientMessageSection";
import { InvoiceContractSection } from "@/components/forms/InvoiceContractSection";
import { InvoiceTotalsPanel } from "@/components/forms/InvoiceTotalsPanel";
import { QuoteLineItemsCard } from "@/components/forms/QuoteLineItemsCard";
import { RequestNotesCard } from "@/components/forms/RequestNotesCard";
import { useErrorBanner } from "@/context/ErrorBannerContext";
import { useClientsMap } from "@/hooks/useClientsMap";
import { DEFAULT_INVOICE_CONTRACT, PAYMENT_TERMS_OPTIONS, displayInvoiceNumber } from "@/lib/invoice-defaults";
import { calcLineSubtotal, calcQuoteTotals, todayIsoDate } from "@/lib/line-items";
import { EntityWorkflowBar } from "@/components/workflow/EntityWorkflowBar";
import { listClients } from "@/lib/clients";
import {
  createInvoice,
  deleteInvoice,
  getInvoice,
  markInvoicePaid,
  peekInvoiceNumber,
  prepareInvoiceForCustomer,
  updateInvoice,
} from "@/lib/invoices";
import { upsertPipelineForWorkflow } from "@/lib/pipeline";
import { getJobsOn } from "@/lib/jobs-on";
import { getJob, listJobs } from "@/lib/jobs";
import { getQuote } from "@/lib/quotes";
import { getRequest } from "@/lib/requests";
import { getWorkSettings } from "@/lib/work-settings";
import type { Client, LineItem, WorkSettings } from "@/types/entities";

function paymentTermsForClient(ws: WorkSettings | null, clientId: string, clientsList: Client[]): string {
  if (!ws) return PAYMENT_TERMS_OPTIONS[0];
  if (!clientId) return ws.payment_terms_residential;
  const client = clientsList.find((c) => c.id === clientId);
  const isCommercial = !!(client?.company_name?.trim());
  return isCommercial ? ws.payment_terms_commercial : ws.payment_terms_residential;
}

function SectionToolbar({ pills }: { pills: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-100 px-3 py-2">
      <button type="button" className="flex items-center gap-1 text-sm font-semibold text-slate-600">
        <Plus size={14} /> Add section
      </button>
      {pills.map((p) => (
        <span key={p} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
          {p}
        </span>
      ))}
    </div>
  );
}

export function InvoiceFormPage() {
  const { id } = useParams();
  const [search] = useSearchParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const { showError } = useErrorBanner();
  const { clients } = useClientsMap();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewNumber, setPreviewNumber] = useState("");
  const [showClientMessage, setShowClientMessage] = useState(false);
  const [showContract, setShowContract] = useState(true);
  const [showDiscount, setShowDiscount] = useState(false);
  const [showTax, setShowTax] = useState(false);
  const [applyDefaultContract, setApplyDefaultContract] = useState(true);
  const [testimonialUrl, setTestimonialUrl] = useState("");
  const [form, setForm] = useState({
    client_id: "",
    job_id: "" as string | null,
    jobs_on_id: "" as string | null,
    quote_id: "" as string | null,
    request_id: "" as string | null,
    subject: "For Services Rendered",
    issued_date: todayIsoDate(),
    payment_terms: PAYMENT_TERMS_OPTIONS[0] as string,
    line_items: [] as LineItem[],
    discount: 0,
    gstRegistered: false,
    client_message: "",
    contract: DEFAULT_INVOICE_CONTRACT,
    internal_notes: "",
    status: "draft" as "draft" | "sent" | "paid" | "overdue",
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        if (isNew) {
          const [ws, clientList, jobs] = await Promise.all([
            getWorkSettings().catch(() => null),
            clients.length ? Promise.resolve(clients) : listClients(),
            listJobs().catch(() => []),
          ]);
          if (cancelled) return;
          setPreviewNumber(await peekInvoiceNumber());
          const fromJob = search.get("fromJob");
          const fromJobsOn = search.get("fromJobsOn");
          const fromQuote = search.get("fromQuote");
          const fromRequest = search.get("fromRequest");

          const subjectDefault = ws?.invoice_subject_default ?? "For Services Rendered";
          const useJobTitle = ws?.invoice_use_job_title ?? true;

          if (fromJobsOn) {
            const on = await getJobsOn(fromJobsOn);
            if (cancelled) return;
            if (on) {
              const clientId = on.client_id ?? "";
              setForm((f) => ({
                ...f,
                client_id: clientId,
                jobs_on_id: on.id,
                job_id: on.lead_id,
                quote_id: on.quote_id,
                request_id: on.request_id,
                subject: useJobTitle && on.title ? on.title : subjectDefault,
                payment_terms: paymentTermsForClient(ws, clientId, clientList),
                line_items: on.line_items.filter((li) => !li.isText),
              }));
            }
          } else if (fromJob) {
            const j = await getJob(fromJob);
            if (cancelled) return;
            if (j) {
              const clientId = j.client_id ?? "";
              setForm((f) => ({
                ...f,
                client_id: clientId,
                job_id: j.id,
                quote_id: j.quote_id,
                subject: useJobTitle && j.title ? j.title : subjectDefault,
                payment_terms: paymentTermsForClient(ws, clientId, clientList),
                line_items: j.line_items.filter((li) => !li.isText),
                gstRegistered: !!j.billing_flags?.gstRegistered,
              }));
              setShowTax(!!j.billing_flags?.gstRegistered);
            }
          } else if (fromQuote) {
            const q = await getQuote(fromQuote);
            if (cancelled) return;
            if (q) {
              const linkedJob = jobs.find((j) => j.quote_id === q.id) ?? null;
              const clientId = q.client_id ?? "";
              setForm((f) => ({
                ...f,
                client_id: clientId,
                job_id: linkedJob?.id ?? null,
                quote_id: q.id,
                request_id: q.request_id,
                subject: useJobTitle && q.title ? q.title : subjectDefault,
                payment_terms: paymentTermsForClient(ws, clientId, clientList),
                line_items: q.line_items.filter((li) => !li.isText),
                discount: Number(q.discount),
                gstRegistered: Number(q.gst) > 0,
                contract: q.terms || DEFAULT_INVOICE_CONTRACT,
              }));
              setShowDiscount(Number(q.discount) > 0);
              setShowTax(Number(q.gst) > 0);
            }
          } else if (fromRequest) {
            const r = await getRequest(fromRequest);
            if (cancelled) return;
            if (r) {
              const clientId = r.client_id ?? "";
              setForm((f) => ({
                ...f,
                client_id: clientId,
                request_id: r.id,
                subject: useJobTitle && r.title ? r.title : subjectDefault,
                payment_terms: paymentTermsForClient(ws, clientId, clientList),
                line_items: r.line_items.filter((li) => !li.isText),
              }));
            }
          } else {
            setForm((f) => ({
              ...f,
              subject: subjectDefault,
              payment_terms: ws?.payment_terms_residential ?? PAYMENT_TERMS_OPTIONS[0],
            }));
          }
          setLoading(false);
          return;
        }
        const inv = await getInvoice(id!);
        if (!inv) throw new Error("Invoice not found");
        setPreviewNumber(displayInvoiceNumber(inv.number));
        setShowDiscount(Number(inv.discount) > 0);
        setShowTax(Number(inv.gst) > 0);
        setShowClientMessage(!!inv.client_message?.trim());
        setShowContract(!!inv.contract?.trim());
        if (inv.testimonial_token) {
          setTestimonialUrl(`${window.location.origin}/review.html?token=${inv.testimonial_token}`);
        }
        setForm({
          client_id: inv.client_id ?? "",
          job_id: inv.job_id,
          jobs_on_id: inv.jobs_on_id,
          quote_id: inv.quote_id,
          request_id: inv.request_id,
          subject: inv.subject,
          issued_date: inv.issued_date ?? todayIsoDate(),
          payment_terms: inv.payment_terms || PAYMENT_TERMS_OPTIONS[0],
          line_items: inv.line_items,
          discount: Number(inv.discount),
          gstRegistered: Number(inv.gst) > 0,
          client_message: inv.client_message ?? "",
          contract: inv.contract ?? DEFAULT_INVOICE_CONTRACT,
          internal_notes: inv.internal_notes ?? "",
          status: inv.status,
        });
      } catch (e) {
        if (!cancelled) showError(e instanceof Error ? e.message : "Load failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id, isNew, search, showError]);

  const subtotal = calcLineSubtotal(form.line_items);
  const totals = calcQuoteTotals(subtotal, form.discount, form.gstRegistered || showTax);
  const balance = form.status === "paid" ? 0 : totals.total;

  async function persist() {
    setSaving(true);
    const payload = {
      ...form,
      client_id: form.client_id || null,
      job_id: form.job_id || null,
      jobs_on_id: form.jobs_on_id || null,
      quote_id: form.quote_id || null,
      request_id: form.request_id || null,
      ...totals,
      balance,
      gstRegistered: form.gstRegistered || showTax,
    };
    try {
      if (isNew) {
        const inv = await createInvoice(payload);
        await upsertPipelineForWorkflow({
          request_id: form.request_id,
          quote_id: form.quote_id,
          job_id: form.job_id,
          jobs_on_id: form.jobs_on_id,
          invoice_id: inv.id,
          client_id: form.client_id || null,
          title: form.subject || inv.number,
          stage: "invoiced",
          deal_value: inv.total,
        }).catch(() => {});
        navigate(`/invoices/${inv.id}`);
      } else {
        await updateInvoice(id!, payload);
        navigate("/invoices/list");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Save failed";
      const needsMigration =
        /quote_id|request_id|client_message|contract|discount|invalid input syntax for type date|column/i.test(msg);
      showError(needsMigration ? `${msg} — run migration 003 in Supabase SQL editor, then retry.` : msg);
    } finally {
      setSaving(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await persist();
  }

  async function markPaid() {
    if (!id || isNew) return;
    setSaving(true);
    try {
      await markInvoicePaid(id);
      setForm((f) => ({ ...f, status: "paid" }));
      await upsertPipelineForWorkflow({
        invoice_id: id,
        jobs_on_id: form.jobs_on_id,
        quote_id: form.quote_id,
        job_id: form.job_id,
        title: form.subject || previewNumber,
        stage: "paid",
        deal_value: totals.total,
      }).catch(() => {});
    } catch (err) {
      showError(err instanceof Error ? err.message : "Could not mark paid");
    } finally {
      setSaving(false);
    }
  }

  async function copyTestimonialLink() {
    if (!id || isNew) return;
    setSaving(true);
    try {
      const { testimonialUrl: url } = await prepareInvoiceForCustomer(id, window.location.origin);
      setTestimonialUrl(url);
      await navigator.clipboard.writeText(url).catch(() => {});
    } catch (err) {
      showError(err instanceof Error ? err.message : "Could not create review link");
    } finally {
      setSaving(false);
    }
  }

  function convertToQuoteNewCustomer() {
    navigate(`/quotes/new?fromInvoice=${id}&newClient=1`);
  }

  async function onDelete() {
    if (!confirm("Delete this invoice?")) return;
    try {
      await deleteInvoice(id!);
      navigate("/invoices");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  if (loading) return <p className="text-slate-500">Loading…</p>;

  return (
    <div className="pb-24">
      <div className="mb-6 flex items-start justify-between">
        <Link to="/invoices" className="text-sm text-slate-500 hover:text-slate-800">
          ← Back
        </Link>
        {!isNew && (
          <div className="flex flex-wrap justify-end gap-2">
            {form.status !== "paid" && (
              <button
                type="button"
                onClick={markPaid}
                disabled={saving}
                className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white"
              >
                Mark paid
              </button>
            )}
            <button
              type="button"
              onClick={copyTestimonialLink}
              disabled={saving}
              className="rounded-lg border border-violet-300 px-3 py-2 text-sm font-semibold text-violet-700"
            >
              Review link
            </button>
            <Link
              to={`/expenses/new?fromInvoice=${id}`}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
            >
              + Expense
            </Link>
            <button
              type="button"
              onClick={convertToQuoteNewCustomer}
              disabled={saving}
              className="rounded-lg border border-[var(--mp-navy)] px-4 py-2 text-sm font-bold text-[var(--mp-navy)]"
            >
              → Quote for new customer
            </button>
            <button type="button" onClick={onDelete} className="text-sm text-red-600 hover:underline">
              Delete
            </button>
          </div>
        )}
      </div>

      {!isNew && <EntityWorkflowBar anchor={{ invoiceId: id }} current="invoice" />}
      {isNew && (form.job_id || form.jobs_on_id || form.quote_id || form.request_id) && (
        <EntityWorkflowBar
          anchor={{
            leadId: form.job_id ?? undefined,
            jobsOnId: form.jobs_on_id ?? undefined,
            quoteId: form.quote_id ?? undefined,
            requestId: form.request_id ?? undefined,
          }}
          current="invoice"
        />
      )}

      {testimonialUrl && (
        <div className="mb-4 rounded-lg border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-900">
          <p className="font-semibold">Customer testimonial link</p>
          <p className="mt-1 break-all text-xs">{testimonialUrl}</p>
        </div>
      )}

      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
          <Receipt size={22} />
        </span>
        <h1 className="text-2xl font-bold text-[var(--mp-navy)]">{isNew ? "New Invoice" : `Invoice ${previewNumber}`}</h1>
      </div>

      <form onSubmit={onSubmit} className="mx-auto max-w-3xl space-y-6">
        <label className="block text-sm">
          <span className="mb-1 block text-xs font-semibold text-slate-500">Subject</span>
          <input
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
          />
        </label>

        <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
          <ClientSelect clients={clients} value={form.client_id} onChange={(v) => setForm({ ...form, client_id: v })} />
          <div className="space-y-3 text-sm">
            <div>
              <span className="mb-1 block text-xs font-semibold text-slate-500">Invoice #</span>
              <input readOnly value={previewNumber} className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2" />
            </div>
            <div>
              <span className="mb-1 block text-xs font-semibold text-slate-500">Issued date</span>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={form.issued_date}
                  onChange={(e) => setForm({ ...form, issued_date: e.target.value })}
                  className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2"
                />
                <button
                  type="button"
                  onClick={() => setForm({ ...form, issued_date: "" })}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600"
                >
                  Clear
                </button>
              </div>
            </div>
            <div>
              <span className="mb-1 block text-xs font-semibold text-slate-500">Payment terms</span>
              <select
                value={form.payment_terms}
                onChange={(e) => setForm({ ...form, payment_terms: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                {PAYMENT_TERMS_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-slate-400">
              Customize{" "}
              <button type="button" className="font-semibold text-[var(--mp-orange)] underline" onClick={() => alert("Custom fields — Phase 5")}>
                Add Field
              </button>
            </p>
          </div>
        </div>

        <QuoteLineItemsCard items={form.line_items} onChange={(line_items) => setForm({ ...form, line_items })} />

        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <InvoiceTotalsPanel
            subtotal={totals.subtotal}
            discount={form.discount}
            gst={totals.gst}
            total={totals.total}
            balance={balance}
            gstRegistered={form.gstRegistered || showTax}
            showDiscount={showDiscount || form.discount > 0}
            showTax={showTax || form.gstRegistered}
            onToggleDiscount={() => setShowDiscount(true)}
            onToggleTax={() => {
              setShowTax(true);
              setForm({ ...form, gstRegistered: true });
            }}
            onDiscountChange={(discount) => setForm({ ...form, discount })}
          />
        </div>

        <SectionToolbar pills={showClientMessage ? ["Client Message"] : []} />

        {showClientMessage ? (
          <InvoiceClientMessageSection
            message={form.client_message}
            onChange={(client_message) => setForm({ ...form, client_message })}
            onRemove={() => {
              setShowClientMessage(false);
              setForm({ ...form, client_message: "" });
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setShowClientMessage(true)}
            className="text-sm font-semibold text-[var(--mp-orange)] underline"
          >
            + Add Client Message
          </button>
        )}

        {showContract && (
          <InvoiceContractSection
            contract={form.contract}
            onChange={(contract) => setForm({ ...form, contract })}
            onRemove={() => setShowContract(false)}
            applyDefault={applyDefaultContract}
            onApplyDefaultChange={setApplyDefaultContract}
          />
        )}

        {!showContract && (
          <button
            type="button"
            onClick={() => setShowContract(true)}
            className="text-sm font-semibold text-[var(--mp-orange)] underline"
          >
            + Add Contract / Disclaimer
          </button>
        )}

        <RequestNotesCard notes={form.internal_notes} onChange={(internal_notes) => setForm({ ...form, internal_notes })} />
      </form>

      <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-slate-200 bg-white px-4 py-3 md:left-56">
        <div className="mx-auto flex max-w-3xl items-center justify-end gap-3">
          <Link to="/invoices" className="rounded-lg border border-[var(--mp-orange)] px-5 py-2 text-sm font-bold text-[var(--mp-orange)]">
            Cancel
          </Link>
          <div className="flex overflow-hidden rounded-lg">
            <button
              type="button"
              disabled={saving}
              onClick={() => persist()}
              className="bg-[var(--mp-orange)] px-5 py-2 text-sm font-bold text-white disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save Invoice"}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => persist()}
              className="border-l border-orange-400 bg-[var(--mp-orange)] px-2 py-2 text-white"
              aria-label="Save options"
            >
              <ChevronDown size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
