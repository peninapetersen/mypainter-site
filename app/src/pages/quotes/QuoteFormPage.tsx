import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Eye, FileText, Plus } from "lucide-react";
import { DocumentPreviewModal } from "@/components/documents/DocumentPreviewModal";
import { QuoteDocument } from "@/components/documents/QuoteDocument";
import { buildQuoteDocumentData } from "@/lib/document-preview";
import { documentProfileFromSettings } from "@/lib/document-profile";
import { getWorkSettings } from "@/lib/work-settings";
import { ClientSelect } from "@/components/forms/ClientSelect";
import { FormSaveBar } from "@/components/ui/FormSaveBar";
import { QuoteContractSection } from "@/components/forms/QuoteContractSection";
import { QuoteLineItemsCard } from "@/components/forms/QuoteLineItemsCard";
import { QuoteTotalsPanel } from "@/components/forms/QuoteTotalsPanel";
import { RequestNotesCard } from "@/components/forms/RequestNotesCard";
import { useErrorBanner } from "@/context/ErrorBannerContext";
import { useClientsMap } from "@/hooks/useClientsMap";
import { calcLineSubtotal, calcQuoteTotals, DEFAULT_QUOTE_TERMS, todayIsoDate, addDaysIsoDate } from "@/lib/line-items";
import { formatGstLabel, resolveGstRate } from "@/lib/tax";
import { getInvoice } from "@/lib/invoices";
import { getRequest } from "@/lib/requests";
import { EntityWorkflowBar } from "@/components/workflow/EntityWorkflowBar";
import { getJob, updateJob } from "@/lib/jobs";
import { upsertPipelineForWorkflow } from "@/lib/pipeline";
import {
  createQuote,
  deleteQuote,
  ensureQuoteViewLink,
  getQuote,
  peekQuoteNumber,
  quoteApprovalUrl,
  sendQuoteToCustomer,
  unapproveQuote,
  updateQuote,
} from "@/lib/quotes";
import { getJobsOnByQuote } from "@/lib/jobs-on";
import { ensureJobsOnForApprovedQuote } from "@/lib/jobs-on-sync";
import type { LineItem } from "@/types/entities";

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

export function QuoteFormPage() {
  const { id } = useParams();
  const [search] = useSearchParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const { showError } = useErrorBanner();
  const { clients } = useClientsMap();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewNumber, setPreviewNumber] = useState("");
  const [showContract, setShowContract] = useState(true);
  const [showDiscount, setShowDiscount] = useState(false);
  const [showTax, setShowTax] = useState(false);
  const [applyDefaultTerms, setApplyDefaultTerms] = useState(true);
  const [approvalUrl, setApprovalUrl] = useState("");
  const [sending, setSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [docProfile, setDocProfile] = useState(() => documentProfileFromSettings(null));
  const [gstRate, setGstRate] = useState(0.15);
  const [jobsOnId, setJobsOnId] = useState<string | null>(null);
  const [jobsOnNumber, setJobsOnNumber] = useState("");
  const [form, setForm] = useState({
    client_id: "",
    request_id: "" as string | null,
    job_id: "" as string | null,
    title: "",
    quote_date: todayIsoDate(),
    valid_until: addDaysIsoDate(30),
    line_items: [] as LineItem[],
    discount: 0,
    gstRegistered: false,
    terms: DEFAULT_QUOTE_TERMS,
    status: "draft" as "draft" | "sent" | "approved" | "declined",
    internal_notes: "",
  });

  useEffect(() => {
    getWorkSettings()
      .then((ws) => {
        setDocProfile(documentProfileFromSettings(ws));
        setGstRate(resolveGstRate(ws));
        if (isNew) {
          setForm((f) => ({
            ...f,
            terms: ws.quote_default_terms || f.terms,
            gstRegistered: ws.gst_default_on_quotes ?? f.gstRegistered,
          }));
          if (ws.gst_default_on_quotes) setShowTax(true);
        }
      })
      .catch(() => {});
  }, [isNew]);

  useEffect(() => {
    async function load() {
      try {
        if (isNew) {
          setPreviewNumber(await peekQuoteNumber());
          const fromRequest = search.get("fromRequest");
          const fromJob = search.get("fromJob");
          const fromInvoice = search.get("fromInvoice");
          const newClient = search.get("newClient") === "1";
          if (fromJob) {
            const j = await getJob(fromJob);
            if (j) {
              setForm((f) => ({
                ...f,
                client_id: j.client_id ?? "",
                request_id: j.request_id,
                job_id: j.id,
                title: j.title,
                line_items: j.line_items.filter((li) => !li.isText),
              }));
            }
          } else if (fromRequest) {
            const r = await getRequest(fromRequest);
            if (r) {
              setForm((f) => ({
                ...f,
                client_id: r.client_id ?? "",
                request_id: r.id,
                title: r.title,
                line_items: r.line_items,
              }));
            }
          } else if (fromInvoice) {
            const inv = await getInvoice(fromInvoice);
            if (inv) {
              setForm((f) => ({
                ...f,
                client_id: newClient ? "" : inv.client_id ?? "",
                title: inv.subject || f.title,
                line_items: inv.line_items,
                discount: Number(inv.discount ?? 0),
                gstRegistered: Number(inv.gst) > 0,
                terms: inv.contract || f.terms,
                internal_notes: newClient ? `From invoice ${inv.number} — assign a new client.` : inv.internal_notes ?? "",
              }));
              setShowDiscount(Number(inv.discount) > 0);
              setShowTax(Number(inv.gst) > 0);
            }
          }
          setLoading(false);
          return;
        }
        const q = await getQuote(id!);
        if (!q) throw new Error("Quote not found");
        if (q.status === "approved") {
          try {
            const on = await ensureJobsOnForApprovedQuote(id!);
            setJobsOnId(on.id);
            setJobsOnNumber(on.number);
          } catch (e) {
            const msg = e instanceof Error ? e.message : "Jobs On not created";
            showError(msg);
            const existing = await getJobsOnByQuote(id!).catch(() => null);
            if (existing) {
              setJobsOnId(existing.id);
              setJobsOnNumber(existing.number);
            }
          }
        } else {
          setJobsOnId(null);
          setJobsOnNumber("");
        }
        setPreviewNumber(q.number);
        setShowDiscount(Number(q.discount) > 0);
        setShowTax(Number(q.gst) > 0);
        setForm({
          client_id: q.client_id ?? "",
          request_id: q.request_id,
          job_id: null,
          title: q.title,
          quote_date: q.quote_date ?? todayIsoDate(),
          valid_until: q.valid_until ?? addDaysIsoDate(30),
          line_items: q.line_items,
          discount: Number(q.discount),
          gstRegistered: Number(q.gst) > 0,
          terms: q.terms,
          status: q.status,
          internal_notes: q.internal_notes,
        });
        if (q.approval_token) {
          setApprovalUrl(quoteApprovalUrl(q.approval_token, window.location.origin));
        }
      } catch (e) {
        showError(e instanceof Error ? e.message : "Load failed");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, isNew, search, showError]);

  const subtotal = calcLineSubtotal(form.line_items);
  const totals = calcQuoteTotals(subtotal, form.discount, form.gstRegistered || showTax, gstRate);

  async function persist() {
    setSaving(true);
    const payload = {
      ...form,
      client_id: form.client_id || null,
      request_id: form.request_id || null,
      ...totals,
      gstRegistered: form.gstRegistered || showTax,
    };
    try {
      if (isNew) {
        const q = await createQuote(payload);
        if (form.job_id) {
          await updateJob(form.job_id, { quote_id: q.id });
        }
        await upsertPipelineForWorkflow({
          request_id: form.request_id,
          quote_id: q.id,
          job_id: form.job_id,
          client_id: form.client_id || null,
          title: form.title || q.number,
          stage: "quote",
          deal_value: q.total,
        }).catch(() => {});
        navigate(`/quotes/${q.id}`);
      } else {
        await updateQuote(id!, payload);
        navigate("/quotes/list");
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await persist();
  }

  async function openQuotePrint() {
    if (isNew || !id) return;

    function openPrintTab(url: string) {
      const sep = url.includes("?") ? "&" : "?";
      const w = window.open(`${url}${sep}print=1`, "_blank", "noopener");
      if (!w) showError("Pop-up blocked — allow pop-ups for mypainter.co.nz, then try again.");
    }

    // Open synchronously on click when we already have the link (avoids pop-up blockers).
    if (approvalUrl) {
      openPrintTab(approvalUrl);
      return;
    }

    const pending = window.open("about:blank", "_blank", "noopener");
    if (!pending) {
      showError("Pop-up blocked — allow pop-ups for mypainter.co.nz, then try again.");
      return;
    }

    try {
      const { url } = await ensureQuoteViewLink(id, window.location.origin);
      setApprovalUrl(url);
      const sep = url.includes("?") ? "&" : "?";
      pending.location.href = `${url}${sep}print=1`;
    } catch (err) {
      pending.close();
      showError(err instanceof Error ? err.message : "Could not open print view");
    }
  }

  async function createJobsOnNow() {
    if (!id) return;
    setSaving(true);
    try {
      const on = await ensureJobsOnForApprovedQuote(id);
      setJobsOnId(on.id);
      setJobsOnNumber(on.number);
      setForm((f) => ({ ...f, status: "approved" }));
    } catch (err) {
      showError(err instanceof Error ? err.message : "Could not create Jobs On");
    } finally {
      setSaving(false);
    }
  }

  async function onUnapprove() {
    if (isNew || !id) return;
    if (
      !confirm(
        "Unapprove this quote?\n\n• Quote goes back to Sent (customer can approve again)\n• Jobs On becomes Draft\n• Pipeline moves back to Quote",
      )
    ) {
      return;
    }
    setSaving(true);
    try {
      const q = await unapproveQuote(id);
      setForm((f) => ({ ...f, status: "sent" }));
      if (q.approval_token) {
        setApprovalUrl(quoteApprovalUrl(q.approval_token, window.location.origin));
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : "Could not unapprove");
    } finally {
      setSaving(false);
    }
  }

  async function sendToCustomer() {
    if (isNew) {
      showError("Save the quote first, then send it.");
      return;
    }
    setSending(true);
    try {
      const { url } = await sendQuoteToCustomer(id!, window.location.origin);
      setApprovalUrl(url);
      setForm((f) => ({ ...f, status: "sent" }));
      await navigator.clipboard.writeText(url).catch(() => {});
    } catch (err) {
      showError(err instanceof Error ? err.message : "Could not send quote");
    } finally {
      setSending(false);
    }
  }

  function convertToInvoice() {
    if (isNew) {
      showError("Save the quote first, then create an invoice.");
      return;
    }
    navigate(`/invoices/new?fromQuote=${id}`);
  }

  async function onDelete() {
    if (!confirm("Delete this quote?")) return;
    try {
      await deleteQuote(id!);
      navigate("/quotes");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  if (loading) return <p className="text-slate-500">Loading…</p>;

  const displayNum = previewNumber.replace("MP-", "");
  const quoteDoc = buildQuoteDocumentData({
    number: previewNumber,
    title: form.title,
    quote_date: form.quote_date,
    valid_until: form.valid_until,
    line_items: form.line_items,
    discount: form.discount,
    gstRegistered: form.gstRegistered || showTax,
    terms: form.terms,
    client_id: form.client_id,
    clients,
    profile: docProfile,
  });
  const customerEmail = clients.find((c) => c.id === form.client_id)?.email?.trim() ?? "";

  return (
    <div className="pb-24">
      <div className="mb-6 flex items-start justify-between">
        <Link to="/quotes" className="text-sm text-slate-500 hover:text-slate-800">
          ← Back
        </Link>
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-[var(--mp-navy)]"
          >
            <Eye size={16} />
            View
          </button>
          {!isNew && form.status === "approved" && (
            <button
              type="button"
              onClick={onUnapprove}
              disabled={saving}
              className="rounded-lg border border-amber-400 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-900"
            >
              Unapprove
            </button>
          )}
          {!isNew && (
            <>
              <button type="button" onClick={convertToInvoice} disabled={saving} className="rounded-lg bg-[var(--mp-navy)] px-4 py-2 text-sm font-bold text-white">
                → Create invoice
              </button>
              <button type="button" onClick={onDelete} className="text-sm text-red-600 hover:underline">
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {!isNew && <EntityWorkflowBar anchor={{ quoteId: id }} current="quote" />}
      {isNew && form.job_id && <EntityWorkflowBar anchor={{ jobId: form.job_id }} current="quote" />}
      {isNew && !form.job_id && form.request_id && <EntityWorkflowBar anchor={{ requestId: form.request_id }} current="quote" />}

      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-500">
          <FileText size={22} />
        </span>
        <h1 className="text-2xl font-bold text-[var(--mp-navy)]">{isNew ? "New Quote" : previewNumber}</h1>
      </div>

      {approvalUrl && (
        <div className="mb-4 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          <p className="font-semibold">Customer approval link</p>
          <p className="mt-1 break-all text-xs">{approvalUrl}</p>
          <p className="mt-2 text-xs text-sky-700">A4 quote + Approve button. Customer approves → Jobs On.</p>
        </div>
      )}

      {form.status === "approved" && !jobsOnId && (
        <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="font-semibold">Approved — but no Jobs On yet</p>
          <p className="mt-1 text-xs">The Jobs On table may be missing in Supabase, or creation failed.</p>
          <button
            type="button"
            onClick={createJobsOnNow}
            disabled={saving}
            className="mt-3 rounded-lg bg-[var(--mp-orange)] px-4 py-2 text-xs font-bold text-white"
          >
            Create Jobs On now
          </button>
        </div>
      )}

      {jobsOnId && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <p className="font-semibold">Jobs On: {jobsOnNumber || jobsOnId}</p>
          <Link to={`/jobs-on/${jobsOnId}`} className="mt-1 inline-block text-xs font-semibold text-[var(--mp-navy)] underline">
            Open job →
          </Link>
        </div>
      )}

      <FormSaveBar
        placement="top"
        saveLabel="Save quote"
        saving={saving}
        onSave={persist}
        cancelTo="/quotes"
        hint="Nothing is saved until you tap Save quote."
      />

      <form onSubmit={onSubmit} className="mx-auto max-w-3xl space-y-6">
        <input
          required
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
        />

        <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
          <ClientSelect clients={clients} value={form.client_id} onChange={(v) => setForm({ ...form, client_id: v })} />
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Quote #</label>
            <input readOnly value={displayNum} className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm" />
            <p className="mt-1 text-xs text-slate-400">
              Customize{" "}
              <button type="button" className="font-semibold text-[var(--mp-orange)] underline" onClick={() => alert("Custom fields — Phase 5")}>
                Add Field
              </button>
            </p>
          </div>
        </div>

        <SectionToolbar pills={["Introduction"]} />

        <QuoteLineItemsCard items={form.line_items} onChange={(line_items) => setForm({ ...form, line_items })} />

        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <QuoteTotalsPanel
            subtotal={totals.subtotal}
            discount={form.discount}
            gst={totals.gst}
            total={totals.total}
            gstRegistered={form.gstRegistered || showTax}
            showDiscount={showDiscount || form.discount > 0}
            showTax={showTax || form.gstRegistered}
            onToggleDiscount={() => setShowDiscount(true)}
            onToggleTax={() => {
              setShowTax(true);
              setForm({ ...form, gstRegistered: true });
            }}
            onDiscountChange={(discount) => setForm({ ...form, discount })}
            gstLabel={formatGstLabel({ gst_rate: gstRate })}
          />
        </div>

        <SectionToolbar pills={["Attachments", "Images", "Client Message"]} />

        {showContract && (
          <QuoteContractSection
            terms={form.terms}
            onChange={(terms) => setForm({ ...form, terms })}
            onRemove={() => setShowContract(false)}
            applyDefault={applyDefaultTerms}
            onApplyDefaultChange={setApplyDefaultTerms}
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

      <FormSaveBar placement="bottom" saveLabel="Save quote" saving={saving} onSave={persist} cancelTo="/quotes" />

      <DocumentPreviewModal
        open={showPreview}
        title={`Quote ${quoteDoc.number}`}
        onClose={() => setShowPreview(false)}
        onSend={sendToCustomer}
        sending={sending}
        sendDisabled={isNew}
        sendHint={
          isNew
            ? "Save first. Send creates a link to quote-view.html (A4 quote + Approve) and copies it."
            : "Send creates the customer link and copies it. They view the A4 quote and tap Approve."
        }
        linkUrl={approvalUrl || undefined}
        customerEmail={customerEmail || undefined}
        onPrint={!isNew ? openQuotePrint : undefined}
      >
        <QuoteDocument data={quoteDoc} />
      </DocumentPreviewModal>
    </div>
  );
}
