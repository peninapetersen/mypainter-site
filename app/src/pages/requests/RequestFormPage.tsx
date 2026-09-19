import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/ui/PageHeader";
import { ClientSelect } from "@/components/forms/ClientSelect";
import { LineItemsEditor } from "@/components/forms/LineItemsEditor";
import { useErrorBanner } from "@/context/ErrorBannerContext";
import { useClientsMap } from "@/hooks/useClientsMap";
import { todayIsoDate } from "@/lib/line-items";
import { createRequest, deleteRequest, getRequest, updateRequest } from "@/lib/requests";
import { createQuote } from "@/lib/quotes";
import type { LineItem } from "@/types/entities";

export function RequestFormPage() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const { showError } = useErrorBanner();
  const { clients } = useClientsMap();
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    client_id: "",
    title: "",
    requested_on: todayIsoDate(),
    service_details: "",
    line_items: [] as LineItem[],
    status: "open" as "draft" | "open" | "approved" | "closed",
    internal_notes: "",
  });

  useEffect(() => {
    if (isNew) return;
    getRequest(id!)
      .then((r) => {
        if (!r) throw new Error("Request not found");
        setForm({
          client_id: r.client_id ?? "",
          title: r.title,
          requested_on: r.requested_on ?? todayIsoDate(),
          service_details: r.service_details,
          line_items: r.line_items,
          status: r.status,
          internal_notes: r.internal_notes,
        });
      })
      .catch((e) => showError(e.message))
      .finally(() => setLoading(false));
  }, [id, isNew, showError]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, client_id: form.client_id || null };
    try {
      if (isNew) {
        const r = await createRequest(payload);
        navigate(`/requests/${r.id}`);
      } else {
        await updateRequest(id!, payload);
        navigate("/requests");
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function convertToQuote() {
    setSaving(true);
    try {
      const q = await createQuote({
        client_id: form.client_id || null,
        request_id: id!,
        title: form.title,
        line_items: form.line_items,
      });
      navigate(`/quotes/${q.id}`);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Could not create quote");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!confirm("Delete this request?")) return;
    try {
      await deleteRequest(id!);
      navigate("/requests");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  if (loading) return <p className="text-slate-500">Loading…</p>;

  return (
    <div>
      <PageHeader
        title={isNew ? "New request" : "Edit request"}
        backTo="/requests"
        actions={
          !isNew && (
            <button type="button" onClick={convertToQuote} disabled={saving} className="rounded-lg bg-[var(--mp-navy)] px-4 py-2 text-sm font-bold text-white">
              → Create quote
            </button>
          )
        }
      />
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 max-w-2xl">
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
            Requested on
            <input type="date" value={form.requested_on} onChange={(e) => setForm({ ...form, requested_on: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
          <label className="block text-sm font-semibold">
            Service details
            <textarea value={form.service_details} onChange={(e) => setForm({ ...form, service_details: e.target.value })} rows={4} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
          <label className="block text-sm font-semibold">
            Status
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as typeof form.status })} className="mt-1 w-full rounded-lg border px-3 py-2">
              <option value="draft">Draft</option>
              <option value="open">Open</option>
              <option value="approved">Approved</option>
              <option value="closed">Closed</option>
            </select>
          </label>
          <label className="block text-sm font-semibold">
            Internal notes
            <textarea value={form.internal_notes} onChange={(e) => setForm({ ...form, internal_notes: e.target.value })} rows={2} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 font-bold">Line items</h2>
          <LineItemsEditor items={form.line_items} onChange={(line_items) => setForm({ ...form, line_items })} />
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={saving} className="rounded-lg bg-[var(--mp-orange)] px-5 py-2 font-bold text-white disabled:opacity-60">
            {saving ? "Saving…" : "Save"}
          </button>
          <Link to="/requests" className="rounded-lg border px-5 py-2 font-semibold">
            Cancel
          </Link>
          {!isNew && (
            <button type="button" onClick={onDelete} className="ml-auto text-sm text-red-600 hover:underline">
              Delete
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
