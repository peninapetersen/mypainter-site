import { FormEvent, useEffect, useId, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Inbox, Truck } from "lucide-react";
import { ClientSelect } from "@/components/forms/ClientSelect";
import { RequestImageUpload } from "@/components/forms/RequestImageUpload";
import { RequestLineItemsCard } from "@/components/forms/RequestLineItemsCard";
import { RequestNotesCard } from "@/components/forms/RequestNotesCard";
import { useErrorBanner } from "@/context/ErrorBannerContext";
import { useClientsMap } from "@/hooks/useClientsMap";
import { todayIsoDate } from "@/lib/line-items";
import { formatDateLong } from "@/lib/nz";
import { createQuote } from "@/lib/quotes";
import { createRequest, deleteRequest, getRequest, updateRequest } from "@/lib/requests";
import type { LineItem } from "@/types/entities";

export function RequestFormPage() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const { showError } = useErrorBanner();
  const { clients } = useClientsMap();
  const draftFolderId = useId().replace(/:/g, "");
  const uploadFolderId = isNew ? draftFolderId : id!;
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [assessmentOpen, setAssessmentOpen] = useState(false);
  const [form, setForm] = useState({
    client_id: "",
    title: "",
    requested_on: todayIsoDate(),
    service_details: "",
    images: [] as { path: string; caption?: string }[],
    assessment_at: "" as string,
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
          images: r.images ?? [],
          assessment_at: r.assessment_at ? r.assessment_at.slice(0, 16) : "",
          line_items: r.line_items,
          status: r.status,
          internal_notes: r.internal_notes,
        });
        setAssessmentOpen(!!r.assessment_at);
      })
      .catch((e) => showError(e.message))
      .finally(() => setLoading(false));
  }, [id, isNew, showError]);

  async function persist() {
    setSaving(true);
    const payload = {
      ...form,
      client_id: form.client_id || null,
      assessment_at: form.assessment_at ? new Date(form.assessment_at).toISOString() : null,
    };
    try {
      if (isNew) {
        const r = await createRequest(payload);
        navigate(`/requests/${r.id}`);
      } else {
        await updateRequest(id!, payload);
        navigate("/requests/list");
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
    <div className="pb-24">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/requests" className="text-sm text-slate-500 hover:text-slate-800">
            ← Back to start
          </Link>
        </div>
        {!isNew && (
          <div className="flex gap-2">
            <button type="button" onClick={convertToQuote} disabled={saving} className="rounded-lg bg-[var(--mp-navy)] px-4 py-2 text-sm font-bold text-white">
              → Create quote
            </button>
            <button type="button" onClick={onDelete} className="text-sm text-red-600 hover:underline">
              Delete
            </button>
          </div>
        )}
      </div>

      <div className="mb-8 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-[var(--mp-orange)]">
          <Inbox size={22} />
        </span>
        <h1 className="text-2xl font-bold text-[var(--mp-navy)]">{isNew ? "New Request" : form.title || "Edit Request"}</h1>
      </div>

      <form onSubmit={onSubmit} className="mx-auto max-w-3xl space-y-8">
        <div className="space-y-4">
          <input
            required
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <ClientSelect clients={clients} value={form.client_id} onChange={(v) => setForm({ ...form, client_id: v })} />
            </div>
            <div>
              <p className="mb-1 text-sm font-semibold text-slate-700">Requested on</p>
              <input
                type="date"
                value={form.requested_on}
                onChange={(e) => setForm({ ...form, requested_on: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-slate-400">{formatDateLong(form.requested_on)}</p>
            </div>
          </div>
        </div>

        <hr className="border-slate-200" />

        <section>
          <h2 className="text-xl font-bold text-[var(--mp-navy)]">Overview</h2>
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-sm font-bold text-[var(--mp-navy)]">Service details</p>
              <p className="text-sm text-slate-500">Please provide as much information as you can</p>
              <textarea
                value={form.service_details}
                onChange={(e) => setForm({ ...form, service_details: e.target.value })}
                rows={5}
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <RequestImageUpload
              images={form.images}
              onChange={(images) => setForm({ ...form, images })}
              folderId={uploadFolderId}
              onError={showError}
            />
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-bold text-[var(--mp-navy)]">On-site assessment</h2>
          {!assessmentOpen ? (
            <button
              type="button"
              onClick={() => setAssessmentOpen(true)}
              className="flex w-full flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center"
            >
              <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500">
                <Truck size={22} />
              </span>
              <span className="max-w-sm text-sm text-slate-600">
                Visit the property to assess the job before you do the work
              </span>
              <span className="mt-3 text-sm font-semibold text-[var(--mp-orange)]">Schedule assessment</span>
            </button>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <label className="block text-sm font-semibold text-slate-700">
                Assessment date & time
                <input
                  type="datetime-local"
                  value={form.assessment_at}
                  onChange={(e) => setForm({ ...form, assessment_at: e.target.value })}
                  className="mt-1 w-full max-w-sm rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </label>
              <button type="button" onClick={() => { setAssessmentOpen(false); setForm({ ...form, assessment_at: "" }); }} className="mt-2 text-sm text-slate-500 hover:underline">
                Remove assessment
              </button>
            </div>
          )}
        </section>

        <RequestLineItemsCard items={form.line_items} onChange={(line_items) => setForm({ ...form, line_items })} />

        <RequestNotesCard notes={form.internal_notes} onChange={(internal_notes) => setForm({ ...form, internal_notes })} />
      </form>

      <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-slate-200 bg-white px-4 py-3 md:left-56">
        <div className="mx-auto flex max-w-3xl items-center justify-end gap-3">
          <Link to="/requests" className="rounded-lg border border-[var(--mp-orange)] px-5 py-2 text-sm font-bold text-[var(--mp-orange)]">
            Cancel
          </Link>
          <button
            type="button"
            disabled={saving}
            onClick={() => persist()}
            className="rounded-lg bg-[var(--mp-orange)] px-5 py-2 text-sm font-bold text-white disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save Request"}
          </button>
        </div>
      </div>
    </div>
  );
}
