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
import { createInvoice, deleteInvoice, getInvoice, peekInvoiceNumber, updateInvoice } from "@/lib/invoices";
import { getJob } from "@/lib/jobs";
import { getQuote } from "@/lib/quotes";
import { getRequest } from "@/lib/requests";
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
  const [form, setForm] = useState({
    client_id: "",
    job_id: "" as string | null,
    quote_id: "" as string | null,
    request_id: "" as string | null,
    subject: "For Services Rendered",
    issued_date: todayIsoDate(),
    payment_terms: PAYMENT_TERMS_OPTIONS[0],
    line_items: [] as LineItem[],
    discount: 0,
    gstRegistered: false,
    client_message: "",
    contract: DEFAULT_INVOICE_CONTRACT,
    internal_notes: "",
    status: "draft" as "draft" | "sent" | "paid" | "overdue",
  });

  useEffect(() => {
    async function load() {
      try {
        if (isNew) {
          setPreviewNumber(await peekInvoiceNumber());
          const fromJob = search.get("fromJob");
          const fromQuote = search.get("fromQuote");
          const fromRequest = search.get("fromRequest");

          if (fromJob) {
            const j = await getJob(fromJob);
            if (j) {
              setForm((f) => ({
                ...f,
                client_id: j.client_id ?? "",
                job_id: j.id,
                quote_id: j.quote_id,
                subject: j.title || f.subject,
                line_items: j.line_items.filter((li) => !li.isText),
                gstRegistered: !!j.billing_flags?.gstRegistered,
              }));
              setShowTax(!!j.billing_flags?.gstRegistered);
            }
          } else if (fromQuote) {
            const q = await getQuote(fromQuote);
            if (q) {
              setForm((f) => ({
                ...f,
                client_id: q.client_id ?? "",
                quote_id: q.id,
                request_id: q.request_id,
                subject: q.title || f.subject,
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
            if (r) {
              setForm((f) => ({
                ...f,
                client_id: r.client_id ?? "",
                request_id: r.id,
                subject: r.title || f.subject,
                line_items: r.line_items.filter((li) => !li.isText),
              }));
            }
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
        setForm({
          client_id: inv.client_id ?? "",
          job_id: inv.job_id,
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
        showError(e instanceof Error ? e.message : "Load failed");
      } finally {
        setLoading(false);
      }
    }
    load();
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
      quote_id: form.quote_id || null,
      request_id: form.request_id || null,
      ...totals,
      balance,
      gstRegistered: form.gstRegistered || showTax,
    };
    try {
      if (isNew) {
        const inv = await createInvoice(payload);
        navigate(`/invoices/${inv.id}`);
      } else {
        await updateInvoice(id!, payload);
        navigate("/invoices/list");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Save failed";
      showError(msg.includes("quote_id") || msg.includes("client_message") ? `${msg} — run migration 003 in Supabase first.` : msg);
    } finally {
      setSaving(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await persist();
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
