import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/ui/PageHeader";
import { ClientSelect } from "@/components/forms/ClientSelect";
import { LineItemsEditor } from "@/components/forms/LineItemsEditor";
import { useErrorBanner } from "@/context/ErrorBannerContext";
import { useClientsMap } from "@/hooks/useClientsMap";
import { calcLineSubtotal, calcQuoteTotals, todayIsoDate } from "@/lib/line-items";
import { formatCurrency } from "@/lib/nz";
import { getJob } from "@/lib/jobs";
import { createInvoice, deleteInvoice, getInvoice, updateInvoice } from "@/lib/invoices";
import type { LineItem } from "@/types/entities";

export function InvoiceFormPage() {
  const { id } = useParams();
  const [search] = useSearchParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const { showError } = useErrorBanner();
  const { clients } = useClientsMap();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [number, setNumber] = useState("");
  const [form, setForm] = useState({
    client_id: "",
    job_id: "" as string | null,
    subject: "For Services Rendered",
    issued_date: todayIsoDate(),
    payment_terms: "Due on receipt",
    line_items: [] as LineItem[],
    gstRegistered: false,
    status: "draft" as "draft" | "sent" | "paid" | "overdue",
  });

  useEffect(() => {
    async function load() {
      try {
        if (isNew) {
          const fromJob = search.get("fromJob");
          if (fromJob) {
            const j = await getJob(fromJob);
            if (j) {
              setForm((f) => ({
                ...f,
                client_id: j.client_id ?? "",
                job_id: j.id,
                subject: j.title || f.subject,
                line_items: j.line_items,
              }));
            }
          }
          setLoading(false);
          return;
        }
        const inv = await getInvoice(id!);
        if (!inv) throw new Error("Invoice not found");
        setNumber(inv.number);
        setForm({
          client_id: inv.client_id ?? "",
          job_id: inv.job_id,
          subject: inv.subject,
          issued_date: inv.issued_date ?? todayIsoDate(),
          payment_terms: inv.payment_terms,
          line_items: inv.line_items,
          gstRegistered: Number(inv.gst) > 0,
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
  const totals = calcQuoteTotals(subtotal, 0, form.gstRegistered);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      client_id: form.client_id || null,
      job_id: form.job_id || null,
      ...totals,
      balance: form.status === "paid" ? 0 : totals.total,
      gstRegistered: form.gstRegistered,
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
      showError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
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
    <div>
      <PageHeader title={isNew ? "New invoice" : `Invoice ${number}`} backTo="/invoices" />
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 lg:col-span-2">
            <label className="block text-sm font-semibold">
              Client
              <div className="mt-1">
                <ClientSelect clients={clients} value={form.client_id} onChange={(v) => setForm({ ...form, client_id: v })} />
              </div>
            </label>
            <label className="block text-sm font-semibold">
              Subject
              <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold">
                Issued date
                <input type="date" value={form.issued_date} onChange={(e) => setForm({ ...form, issued_date: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" />
              </label>
              <label className="block text-sm font-semibold">
                Payment terms
                <input value={form.payment_terms} onChange={(e) => setForm({ ...form, payment_terms: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" />
              </label>
            </div>
            <label className="block text-sm font-semibold">
              Status
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as typeof form.status })} className="mt-1 w-full rounded-lg border px-3 py-2">
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </label>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 h-fit">
            <h2 className="mb-4 font-bold">Totals</h2>
            <label className="mb-3 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.gstRegistered} onChange={(e) => setForm({ ...form, gstRegistered: e.target.checked })} />
              GST registered (15%)
            </label>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatCurrency(totals.subtotal)}</dd></div>
              {form.gstRegistered && <div className="flex justify-between"><dt>GST</dt><dd>{formatCurrency(totals.gst)}</dd></div>}
              <div className="flex justify-between border-t pt-2 text-lg font-bold"><dt>Total</dt><dd>{formatCurrency(totals.total)}</dd></div>
            </dl>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 font-bold">Line items</h2>
          <LineItemsEditor items={form.line_items} onChange={(line_items) => setForm({ ...form, line_items })} />
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={saving} className="rounded-lg bg-[var(--mp-orange)] px-5 py-2 font-bold text-white disabled:opacity-60">
            {saving ? "Saving…" : "Save"}
          </button>
          <Link to="/invoices" className="rounded-lg border px-5 py-2 font-semibold">Cancel</Link>
          {!isNew && (
            <button type="button" onClick={onDelete} className="ml-auto text-sm text-red-600 hover:underline">Delete</button>
          )}
        </div>
      </form>
    </div>
  );
}
