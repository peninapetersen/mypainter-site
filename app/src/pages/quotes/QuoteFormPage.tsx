import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/ui/PageHeader";
import { ClientSelect } from "@/components/forms/ClientSelect";
import { LineItemsEditor } from "@/components/forms/LineItemsEditor";
import { useErrorBanner } from "@/context/ErrorBannerContext";
import { useClientsMap } from "@/hooks/useClientsMap";
import { calcLineSubtotal, calcQuoteTotals, DEFAULT_QUOTE_TERMS, todayIsoDate, addDaysIsoDate } from "@/lib/line-items";
import { formatCurrency } from "@/lib/nz";
import { getRequest } from "@/lib/requests";
import { createQuote, deleteQuote, getQuote, updateQuote } from "@/lib/quotes";
import { createJob } from "@/lib/jobs";
import type { LineItem } from "@/types/entities";

export function QuoteFormPage() {
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
    request_id: "" as string | null,
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
    async function load() {
      try {
        if (isNew) {
          const fromRequest = search.get("fromRequest");
          if (fromRequest) {
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
          }
          setLoading(false);
          return;
        }
        const q = await getQuote(id!);
        if (!q) throw new Error("Quote not found");
        setNumber(q.number);
        setForm({
          client_id: q.client_id ?? "",
          request_id: q.request_id,
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
      } catch (e) {
        showError(e instanceof Error ? e.message : "Load failed");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, isNew, search, showError]);

  const subtotal = calcLineSubtotal(form.line_items);
  const totals = calcQuoteTotals(subtotal, form.discount, form.gstRegistered);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      client_id: form.client_id || null,
      request_id: form.request_id || null,
      ...totals,
      gstRegistered: form.gstRegistered,
    };
    try {
      if (isNew) {
        const q = await createQuote(payload);
        navigate(`/quotes/${q.id}`);
      } else {
        await updateQuote(id!, payload);
        navigate("/quotes");
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function convertToJob() {
    setSaving(true);
    try {
      const j = await createJob({
        client_id: form.client_id || null,
        quote_id: id!,
        title: form.title,
        line_items: form.line_items.map((li) => ({ ...li, unitCost: li.unitCost ?? 0 })),
        status: "scheduled",
      });
      await updateQuote(id!, { status: "approved", gstRegistered: form.gstRegistered });
      navigate(`/jobs/${j.id}`);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Could not create job");
    } finally {
      setSaving(false);
    }
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

  return (
    <div>
      <PageHeader
        title={isNew ? "New quote" : `Quote ${number}`}
        backTo="/quotes"
        actions={
          !isNew && (
            <button type="button" onClick={convertToJob} disabled={saving} className="rounded-lg bg-[var(--mp-navy)] px-4 py-2 text-sm font-bold text-white">
              → Create job
            </button>
          )
        }
      />
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
              Title *
              <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold">
                Quote date
                <input type="date" value={form.quote_date} onChange={(e) => setForm({ ...form, quote_date: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" />
              </label>
              <label className="block text-sm font-semibold">
                Valid until
                <input type="date" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" />
              </label>
            </div>
            <label className="block text-sm font-semibold">
              Status
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as typeof form.status })} className="mt-1 w-full rounded-lg border px-3 py-2">
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="approved">Approved</option>
                <option value="declined">Declined</option>
              </select>
            </label>
            <label className="block text-sm font-semibold">
              Terms
              <textarea value={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.value })} rows={3} className="mt-1 w-full rounded-lg border px-3 py-2" />
            </label>
            <label className="block text-sm font-semibold">
              Internal notes
              <textarea value={form.internal_notes} onChange={(e) => setForm({ ...form, internal_notes: e.target.value })} rows={2} className="mt-1 w-full rounded-lg border px-3 py-2" />
            </label>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 h-fit">
            <h2 className="mb-4 font-bold">Totals</h2>
            <label className="mb-3 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.gstRegistered} onChange={(e) => setForm({ ...form, gstRegistered: e.target.checked })} />
              GST registered (15%)
            </label>
            <label className="mb-3 block text-sm font-semibold">
              Discount $
              <input type="number" min={0} step={0.01} value={form.discount} onChange={(e) => setForm({ ...form, discount: parseFloat(e.target.value) || 0 })} className="mt-1 w-full rounded-lg border px-3 py-2" />
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
          <Link to="/quotes" className="rounded-lg border px-5 py-2 font-semibold">Cancel</Link>
          {!isNew && (
            <button type="button" onClick={onDelete} className="ml-auto text-sm text-red-600 hover:underline">Delete</button>
          )}
        </div>
      </form>
    </div>
  );
}
