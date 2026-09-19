import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { HardHat } from "lucide-react";
import { EntityWorkflowBar } from "@/components/workflow/EntityWorkflowBar";
import { FormSaveBar } from "@/components/ui/FormSaveBar";
import { useErrorBanner } from "@/context/ErrorBannerContext";
import { getJobsOn, jobsOnDealValue, listJobsOn, updateJobsOn } from "@/lib/jobs-on";
import { upsertPipelineForWorkflow } from "@/lib/pipeline";

export function JobsOnFormPage() {
  const { id } = useParams();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const { showError } = useErrorBanner();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    site_address: "",
    notes: "",
    status: "active" as "active" | "completed",
    number: "",
    quote_id: "" as string | null,
    lead_id: "" as string | null,
  });

  useEffect(() => {
    async function load() {
      try {
        const quoteParam = search.get("quote");
        if (quoteParam && !id) {
          const rows = await listJobsOn();
          const match = rows.find((r) => r.quote_id === quoteParam);
          if (match) {
            navigate(`/jobs-on/${match.id}`, { replace: true });
            return;
          }
        }
        if (!id || id === "new") {
          setLoading(false);
          return;
        }
        const row = await getJobsOn(id);
        if (!row) throw new Error("Jobs On record not found");
        setForm({
          title: row.title,
          site_address: row.site_address,
          notes: row.notes,
          status: row.status,
          number: row.number,
          quote_id: row.quote_id,
          lead_id: row.lead_id,
        });
      } catch (e) {
        showError(e instanceof Error ? e.message : "Load failed");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, search, navigate, showError]);

  async function persist(e?: FormEvent) {
    e?.preventDefault();
    if (!id || id === "new") return;
    setSaving(true);
    try {
      const row = await updateJobsOn(id, {
        title: form.title,
        site_address: form.site_address,
        notes: form.notes,
        status: form.status,
      });
      await upsertPipelineForWorkflow({
        jobs_on_id: row.id,
        job_id: row.lead_id,
        quote_id: row.quote_id,
        request_id: row.request_id,
        client_id: row.client_id,
        title: row.title || row.number,
        stage: row.status === "completed" ? "invoiced" : "jobs_on",
        deal_value: jobsOnDealValue(row),
        address: row.site_address,
      }).catch(() => {});
      navigate("/jobs-on/list");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-slate-500">Loading…</p>;

  return (
    <div className="pb-24">
      <Link to="/jobs-on" className="mb-6 inline-block text-sm text-slate-500 hover:text-slate-800">
        ← Back
      </Link>

      <EntityWorkflowBar anchor={{ jobsOnId: id, quoteId: form.quote_id ?? undefined, leadId: form.lead_id ?? undefined }} current="jobs_on" />

      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
          <HardHat size={22} />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-[var(--mp-navy)]">Jobs On {form.number}</h1>
          <p className="text-sm text-slate-500">Approved work — notes and site details while the job is live.</p>
        </div>
      </div>

      <form onSubmit={persist} className="mx-auto max-w-2xl space-y-5">
        <label className="block text-sm">
          <span className="mb-1 block text-xs font-semibold text-slate-500">Title</span>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs font-semibold text-slate-500">Site address</span>
          <input
            value={form.site_address}
            onChange={(e) => setForm({ ...form, site_address: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs font-semibold text-slate-500">Job notes</span>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={8}
            placeholder="Access, colours confirmed, prep done, crew notes…"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs font-semibold text-slate-500">Status</span>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as "active" | "completed" })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
          >
            <option value="active">Active — work in progress</option>
            <option value="completed">Completed — ready to invoice</option>
          </select>
        </label>
      </form>

      <FormSaveBar saving={saving} label="Save Jobs On" onSave={() => persist()} cancelTo="/jobs-on" />
    </div>
  );
}
