import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ChevronDown, Hammer } from "lucide-react";
import { ClientSelect } from "@/components/forms/ClientSelect";
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
  parseVisits,
} from "@/lib/job-defaults";
import { createInvoice } from "@/lib/invoices";
import { createJob, deleteJob, getJob, peekJobNumber, updateJob } from "@/lib/jobs";
import { getQuote } from "@/lib/quotes";
import type { JobBillingFlags, JobVisit, LineItem } from "@/types/entities";

export function JobFormPage() {
  const { id } = useParams();
  const [search] = useSearchParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const { showError } = useErrorBanner();
  const { clients } = useClientsMap();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewNumber, setPreviewNumber] = useState("");
  const [scheduleMode, setScheduleMode] = useState<"one-off" | "recurring">("one-off");
  const [showDiscount, setShowDiscount] = useState(false);
  const [showTax, setShowTax] = useState(false);
  const [form, setForm] = useState({
    client_id: "",
    quote_id: "" as string | null,
    title: "",
    visits: [defaultJobVisit()] as JobVisit[],
    billing_flags: defaultBillingFlags() as JobBillingFlags,
    line_items: [] as LineItem[],
    status: "scheduled" as "scheduled" | "active" | "completed",
    notes: "",
  });

  useEffect(() => {
    async function load() {
      try {
        if (isNew) {
          setPreviewNumber(await peekJobNumber());
          const fromQuote = search.get("fromQuote");
          if (fromQuote) {
            const q = await getQuote(fromQuote);
            if (q) {
              setForm((f) => ({
                ...f,
                client_id: q.client_id ?? "",
                quote_id: q.id,
                title: q.title,
                line_items: q.line_items.map((li) => ({ ...li, unitCost: li.unitCost ?? 0 })),
              }));
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
          title: j.title,
          visits: parseVisits(j.visits),
          billing_flags: flags,
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

  const subtotalPrice = calcLineSubtotal(form.line_items);
  const subtotalCost = calcLineCost(form.line_items);

  async function persist() {
    setSaving(true);
    const payload = {
      client_id: form.client_id || null,
      quote_id: form.quote_id || null,
      title: form.title,
      visits: form.visits,
      billing_flags: {
        ...form.billing_flags,
        discount: form.billing_flags.discount ?? 0,
        gstRegistered: form.billing_flags.gstRegistered || showTax,
      },
      line_items: form.line_items,
      status: form.status,
      notes: form.notes,
    };
    try {
      if (isNew) {
        const j = await createJob(payload);
        navigate(`/jobs/${j.id}`);
      } else {
        await updateJob(id!, payload);
        navigate("/jobs/list");
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

  async function convertToInvoice() {
    setSaving(true);
    try {
      const inv = await createInvoice({
        client_id: form.client_id || null,
        job_id: id!,
        line_items: form.line_items,
        gstRegistered: form.billing_flags.gstRegistered || showTax,
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
    <div className="pb-24">
      <div className="mb-6 flex items-start justify-between">
        <Link to="/jobs" className="text-sm text-slate-500 hover:text-slate-800">
          ← Back
        </Link>
        {!isNew && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={convertToInvoice}
              disabled={saving}
              className="rounded-lg bg-[var(--mp-navy)] px-4 py-2 text-sm font-bold text-white"
            >
              → Create invoice
            </button>
            <button type="button" onClick={onDelete} className="text-sm text-red-600 hover:underline">
              Delete
            </button>
          </div>
        )}
      </div>

      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-[var(--mp-orange)]">
          <Hammer size={22} />
        </span>
        <h1 className="text-2xl font-bold text-[var(--mp-navy)]">{isNew ? "New Job" : `Job ${previewNumber}`}</h1>
      </div>

      <form onSubmit={onSubmit} className="mx-auto max-w-3xl space-y-6">
        <input
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
        />

        <div className="grid gap-4 sm:grid-cols-[1fr_100px]">
          <ClientSelect clients={clients} value={form.client_id} onChange={(v) => setForm({ ...form, client_id: v })} />
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

        <JobVisitsSection
          visits={form.visits}
          scheduleMode={scheduleMode}
          onScheduleModeChange={setScheduleMode}
          onChange={(visits) => setForm({ ...form, visits })}
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

      <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-slate-200 bg-white px-4 py-3 md:left-56">
        <div className="mx-auto flex max-w-3xl items-center justify-end gap-3">
          <Link to="/jobs" className="rounded-lg border border-[var(--mp-orange)] px-5 py-2 text-sm font-bold text-[var(--mp-orange)]">
            Cancel
          </Link>
          <div className="flex overflow-hidden rounded-lg">
            <button
              type="button"
              disabled={saving}
              onClick={() => persist()}
              className="bg-[var(--mp-orange)] px-5 py-2 text-sm font-bold text-white disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save Job"}
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
