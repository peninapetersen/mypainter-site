import { FormEvent, useEffect, useId, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Inbox, Truck } from "lucide-react";
import { ClientSelect } from "@/components/forms/ClientSelect";
import { RequestClientCard } from "@/components/forms/RequestClientCard";
import { RequestImageUpload } from "@/components/forms/RequestImageUpload";
import { RequestLineItemsCard } from "@/components/forms/RequestLineItemsCard";
import { RequestNotesCard } from "@/components/forms/RequestNotesCard";
import { FormSaveBar } from "@/components/ui/FormSaveBar";
import { RequestWebsiteCard } from "@/components/forms/RequestWebsiteCard";
import { useErrorBanner } from "@/context/ErrorBannerContext";
import { useClientsMap } from "@/hooks/useClientsMap";
import { todayIsoDate } from "@/lib/line-items";
import { formatDateLong } from "@/lib/nz";
import { buildLineItemsFromService, type RequestMeasurements } from "@/lib/service-estimate";
import { getService } from "@/lib/services";
import { EntityWorkflowBar } from "@/components/workflow/EntityWorkflowBar";
import { upsertPipelineForWorkflow } from "@/lib/pipeline";
import { createQuote } from "@/lib/quotes";
import { createRequest, deleteRequest, getRequest, updateRequest } from "@/lib/requests";
import type { LineItem } from "@/types/entities";
import type { MpService } from "@/types/services";

export function RequestFormPage() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showError } = useErrorBanner();
  const { clients } = useClientsMap();
  const draftFolderId = useId().replace(/:/g, "");
  const uploadFolderId = isNew ? draftFolderId : id!;
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [assessmentOpen, setAssessmentOpen] = useState(false);
  const [service, setService] = useState<MpService | null>(null);
  const [form, setForm] = useState({
    client_id: "",
    service_id: "" as string,
    title: "",
    requested_on: todayIsoDate(),
    service_details: "",
    measurements: {} as RequestMeasurements,
    estimate_subtotal: 0,
    source: "admin" as "admin" | "website" | "contact",
    images: [] as { path: string; caption?: string }[],
    assessment_at: "" as string,
    line_items: [] as LineItem[],
    status: "open" as "draft" | "open" | "approved" | "closed",
    internal_notes: "",
  });

  useEffect(() => {
    const linkedClient = searchParams.get("clientId");
    if (linkedClient) {
      setForm((f) => ({ ...f, client_id: linkedClient }));
      searchParams.delete("clientId");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (isNew) return;
    getRequest(id!)
      .then((r) => {
        if (!r) throw new Error("Request not found");
        setForm({
          client_id: r.client_id ?? "",
          service_id: r.service_id ?? "",
          title: r.title,
          requested_on: r.requested_on ?? todayIsoDate(),
          service_details: r.service_details,
          measurements: (r.measurements ?? {}) as RequestMeasurements,
          estimate_subtotal: Number(r.estimate_subtotal) || 0,
          source: r.source ?? "admin",
          images: r.images ?? [],
          assessment_at: r.assessment_at ? r.assessment_at.slice(0, 16) : "",
          line_items: r.line_items,
          status: r.status,
          internal_notes: r.internal_notes,
        });
        setAssessmentOpen(!!r.assessment_at);
        if (r.service_id) {
          getService(r.service_id)
            .then(setService)
            .catch(() => setService(null));
        } else {
          setService(null);
        }
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

  function convertToInvoice() {
    if (isNew) {
      showError("Save the request first, then create an invoice.");
      return;
    }
    navigate(`/invoices/new?fromRequest=${id}`);
  }

  async function convertToQuote() {
    setSaving(true);
    try {
      let lineItems = form.line_items;
      if (!lineItems.length && service) {
        lineItems = buildLineItemsFromService(service, form.measurements);
      } else if (!lineItems.length && form.estimate_subtotal > 0) {
        lineItems = [{ name: form.title || "Quoted work", qty: 1, unitPrice: form.estimate_subtotal }];
      }
      const q = await createQuote({
        client_id: form.client_id || null,
        request_id: id!,
        title: form.title,
        line_items: lineItems,
      });
      await updateRequest(id!, { status: "approved" });
      await upsertPipelineForWorkflow({
        request_id: id!,
        quote_id: q.id,
        client_id: form.client_id || null,
        title: form.title || q.number,
        stage: "quote",
        deal_value: q.total,
      }).catch(() => {});
      navigate(`/quotes/${q.id}`);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Could not create quote");
    } finally {
      setSaving(false);
    }
  }

  function scheduleMeasureUp() {
    if (isNew) {
      showError("Save the request first, then schedule the measure-up.");
      return;
    }
    navigate(`/leads/new?fromRequest=${id}`);
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

  const selectedClient = form.client_id ? clients.find((c) => c.id === form.client_id) ?? null : null;
  const requestPath = isNew ? undefined : `/requests/${id}`;

  return (
    <div className="pb-24">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/requests" className="text-sm text-slate-500 hover:text-slate-800">
            ← Back to start
          </Link>
        </div>
        {!isNew && (
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" onClick={scheduleMeasureUp} disabled={saving} className="rounded-lg bg-[var(--mp-navy)] px-4 py-2 text-sm font-bold text-white">
              → Schedule measure-up
            </button>
            <button type="button" onClick={convertToQuote} disabled={saving} className="rounded-lg border border-[var(--mp-navy)] px-4 py-2 text-sm font-bold text-[var(--mp-navy)]">
              → Create quote
            </button>
            <button type="button" onClick={convertToInvoice} disabled={saving} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600">
              → Create invoice
            </button>
            <button type="button" onClick={onDelete} className="text-sm text-red-600 hover:underline">
              Delete
            </button>
          </div>
        )}
      </div>

      {!isNew && <EntityWorkflowBar anchor={{ requestId: id }} current="request" />}

      <div className="mb-8 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-[var(--mp-orange)]">
          <Inbox size={22} />
        </span>
        <h1 className="text-2xl font-bold text-[var(--mp-navy)]">{isNew ? "New Request" : form.title || "Edit Request"}</h1>
      </div>

      <FormSaveBar
        placement="top"
        saveLabel="Save request"
        saving={saving}
        onSave={persist}
        cancelTo="/requests"
        hint="Tap Save to store this request — web enquiries are not linked to a job until you schedule measure-up."
      />

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
              <ClientSelect
                clients={clients}
                value={form.client_id}
                onChange={(v) => setForm({ ...form, client_id: v })}
                returnTo={requestPath}
              />
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

        {selectedClient && <RequestClientCard client={selectedClient} requestId={isNew ? undefined : id} />}

        <hr className="border-slate-200" />

        {!isNew && (
          <RequestWebsiteCard
            service={service}
            measurements={form.measurements}
            estimateSubtotal={form.estimate_subtotal}
            source={form.source}
          />
        )}

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

      <FormSaveBar placement="bottom" saveLabel="Save request" saving={saving} onSave={persist} cancelTo="/requests" />
    </div>
  );
}
