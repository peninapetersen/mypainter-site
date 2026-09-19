import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/ui/PageHeader";
import { ClientSelect } from "@/components/forms/ClientSelect";
import { LineItemsEditor } from "@/components/forms/LineItemsEditor";
import { useErrorBanner } from "@/context/ErrorBannerContext";
import { useClientsMap } from "@/hooks/useClientsMap";
import { calcLineCost, calcLineSubtotal } from "@/lib/line-items";
import { formatCurrency } from "@/lib/nz";
import { getQuote } from "@/lib/quotes";
import { createJob, deleteJob, getJob, updateJob } from "@/lib/jobs";
import { createInvoice } from "@/lib/invoices";
import type { LineItem } from "@/types/entities";

export function JobFormPage() {
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
    quote_id: "" as string | null,
    title: "",
    line_items: [] as LineItem[],
    status: "scheduled" as "scheduled" | "active" | "completed",
    notes: "",
  });

  useEffect(() => {
    async function load() {
      try {
        if (isNew) {
          const fromQuote = search.get("fromQuote");
          if (fromQuote) {
            const q = await getQuote(fromQuote);
            if (q) {
              setForm({
                client_id: q.client_id ?? "",
                quote_id: q.id,
                title: q.title,
                line_items: q.line_items,
                status: "scheduled",
                notes: "",
              });
            }
          }
          setLoading(false);
          return;
        }
        const j = await getJob(id!);
        if (!j) throw new Error("Job not found");
        setNumber(j.number);
        setForm({
          client_id: j.client_id ?? "",
          quote_id: j.quote_id,
          title: j.title,
          line_items: j.line_items,
          status: j.status,
          notes: j.notes,
        });
      } catch (e) {
        showError(e instanceof Error ? e.message : "Load failed");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, isNew, search, showError]);

  const price = calcLineSubtotal(form.line_items);
  const cost = calcLineCost(form.line_items);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, client_id: form.client_id || null, quote_id: form.quote_id || null };
    try {
      if (isNew) {
        const j = await createJob(payload);
        navigate(`/jobs/${j.id}`);
      } else {
        await updateJob(id!, payload);
        navigate("/jobs");
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function convertToInvoice() {
    setSaving(true);
    try {
      const inv = await createInvoice({
        client_id: form.client_id || null,
        job_id: id!,
        line_items: form.line_items,
        gstRegistered: false,
      });
      navigate(`/invoices/${inv.id}`);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Could not create invoice");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!confirm("Delete this job?")) return;
    try {
      await deleteJob(id!);
      navigate("/jobs");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  if (loading) return <p className="text-slate-500">Loading…</p>;

  return (
    <div>
      <PageHeader
        title={isNew ? "New job" : `Job ${number}`}
        backTo="/jobs"
        actions={
          !isNew && (
            <button type="button" onClick={convertToInvoice} disabled={saving} className="rounded-lg bg-[var(--mp-navy)] px-4 py-2 text-sm font-bold text-white">
              → Create invoice
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
            <label className="block text-sm font-semibold">
              Status
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as typeof form.status })} className="mt-1 w-full rounded-lg border px-3 py-2">
                <option value="scheduled">Scheduled</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </label>
            <label className="block text-sm font-semibold">
              Notes
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="mt-1 w-full rounded-lg border px-3 py-2" />
            </label>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 h-fit">
            <h2 className="mb-4 font-bold">Job totals</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt>Cost</dt><dd>{formatCurrency(cost)}</dd></div>
              <div className="flex justify-between border-t pt-2 text-lg font-bold"><dt>Price</dt><dd>{formatCurrency(price)}</dd></div>
              <div className="flex justify-between text-green-700"><dt>Margin</dt><dd>{formatCurrency(price - cost)}</dd></div>
            </dl>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 font-bold">Line items</h2>
          <LineItemsEditor items={form.line_items} onChange={(line_items) => setForm({ ...form, line_items })} showCost />
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={saving} className="rounded-lg bg-[var(--mp-orange)] px-5 py-2 font-bold text-white disabled:opacity-60">
            {saving ? "Saving…" : "Save"}
          </button>
          <Link to="/jobs" className="rounded-lg border px-5 py-2 font-semibold">Cancel</Link>
          {!isNew && (
            <button type="button" onClick={onDelete} className="ml-auto text-sm text-red-600 hover:underline">Delete</button>
          )}
        </div>
      </form>
    </div>
  );
}
