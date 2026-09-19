import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Clock } from "lucide-react";
import { EntityWorkflowBar } from "@/components/workflow/EntityWorkflowBar";
import { useErrorBanner } from "@/context/ErrorBannerContext";
import { contractorDisplayName, listContractors } from "@/lib/contractors";
import { listJobsOn } from "@/lib/jobs-on";
import { listJobs } from "@/lib/jobs";
import { createTimesheet, deleteTimesheet, getTimesheet, updateTimesheet } from "@/lib/timesheets";
import type { Contractor, Job, JobOn } from "@/types/entities";

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function TimesheetFormPage() {
  const { id } = useParams();
  const [search] = useSearchParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const { showError } = useErrorBanner();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsOn, setJobsOn] = useState<JobOn[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    crew_member: "Richo Petersen",
    job_id: search.get("fromJob") ?? "",
    jobs_on_id: search.get("fromJobsOn") ?? "",
    contractor_id: "",
    check_in_time: toLocalInput(new Date().toISOString()),
    check_out_time: "",
  });

  useEffect(() => {
    Promise.all([listJobs(), listJobsOn(), listContractors()])
      .then(([j, on, c]) => {
        setJobs(j);
        setJobsOn(on);
        setContractors(c);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isNew) return;
    getTimesheet(id!)
      .then((t) => {
        if (!t) throw new Error("Timesheet not found");
        setForm({
          crew_member: t.crew_member,
          job_id: t.job_id ?? "",
          jobs_on_id: t.jobs_on_id ?? "",
          contractor_id: t.contractor_id ?? "",
          check_in_time: toLocalInput(t.check_in_time),
          check_out_time: toLocalInput(t.check_out_time),
        });
      })
      .catch((e) => showError(e.message))
      .finally(() => setLoading(false));
  }, [id, isNew, showError]);

  function onContractorChange(contractorId: string) {
    const contractor = contractors.find((c) => c.id === contractorId);
    setForm((prev) => ({
      ...prev,
      contractor_id: contractorId,
      crew_member: contractor ? contractorDisplayName(contractor) : prev.crew_member,
    }));
  }

  async function persist(e?: FormEvent) {
    e?.preventDefault();
    setSaving(true);
    try {
      const payload = {
        crew_member: form.crew_member,
        job_id: form.job_id || null,
        jobs_on_id: form.jobs_on_id || null,
        contractor_id: form.contractor_id || null,
        check_in_time: form.check_in_time ? new Date(form.check_in_time).toISOString() : null,
        check_out_time: form.check_out_time ? new Date(form.check_out_time).toISOString() : null,
      };
      if (isNew) {
        const t = await createTimesheet(payload);
        if (form.jobs_on_id) navigate(`/jobs-on/${form.jobs_on_id}`);
        else navigate(`/timesheets/${t.id}`);
      } else {
        await updateTimesheet(id!, payload);
        if (form.jobs_on_id) navigate(`/jobs-on/${form.jobs_on_id}`);
        else navigate("/timesheets");
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!confirm("Delete this timesheet entry?")) return;
    try {
      await deleteTimesheet(id!);
      if (form.jobs_on_id) navigate(`/jobs-on/${form.jobs_on_id}`);
      else navigate("/timesheets");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  if (loading) return <p className="text-slate-500">Loading…</p>;

  return (
    <div className="pb-24">
      <div className="mb-6 flex items-start justify-between">
        <Link
          to={form.jobs_on_id ? `/jobs-on/${form.jobs_on_id}` : "/timesheets"}
          className="text-sm text-slate-500 hover:text-slate-800"
        >
          ← Back
        </Link>
        {!isNew && (
          <button type="button" onClick={onDelete} className="text-sm text-red-600 hover:underline">
            Delete
          </button>
        )}
      </div>

      {(form.job_id || form.jobs_on_id) && (
        <EntityWorkflowBar
          anchor={{ jobId: form.job_id || undefined, jobsOnId: form.jobs_on_id || undefined }}
          current="timesheet"
        />
      )}

      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
          <Clock size={22} />
        </span>
        <h1 className="text-2xl font-bold text-[var(--mp-navy)]">{isNew ? "Log time" : "Edit timesheet"}</h1>
      </div>

      <form onSubmit={persist} className="mx-auto max-w-lg space-y-4">
        <label className="block text-sm">
          <span className="mb-1 block text-xs font-semibold text-slate-500">Jobs On (live job)</span>
          <select
            value={form.jobs_on_id}
            onChange={(e) => setForm({ ...form, jobs_on_id: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="">— Optional —</option>
            {jobsOn.map((j) => (
              <option key={j.id} value={j.id}>
                {j.number} — {j.title || j.site_address || "Untitled"}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-xs font-semibold text-slate-500">Contractor (optional)</span>
          <select
            value={form.contractor_id}
            onChange={(e) => onContractorChange(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="">— Staff / manual name —</option>
            {contractors.map((c) => (
              <option key={c.id} value={c.id}>
                {contractorDisplayName(c)}
                {c.hourly_rate > 0 ? ` — $${c.hourly_rate}/hr` : c.day_rate > 0 ? ` — $${c.day_rate}/day` : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-xs font-semibold text-slate-500">Crew member</span>
          <input
            value={form.crew_member}
            onChange={(e) => setForm({ ...form, crew_member: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-xs font-semibold text-slate-500">Lead (pipeline job)</span>
          <select
            value={form.job_id}
            onChange={(e) => setForm({ ...form, job_id: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="">— Optional —</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.number} — {j.title || "Untitled"}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-xs font-semibold text-slate-500">Check in</span>
          <input
            type="datetime-local"
            value={form.check_in_time}
            onChange={(e) => setForm({ ...form, check_in_time: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-xs font-semibold text-slate-500">Check out</span>
          <input
            type="datetime-local"
            value={form.check_out_time}
            onChange={(e) => setForm({ ...form, check_out_time: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
      </form>

      <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-slate-200 bg-white px-4 py-3 md:left-56">
        <div className="mx-auto flex max-w-lg items-center justify-end gap-3">
          <Link
            to={form.jobs_on_id ? `/jobs-on/${form.jobs_on_id}` : "/timesheets"}
            className="rounded-lg border border-[var(--mp-orange)] px-5 py-2 text-sm font-bold text-[var(--mp-orange)]"
          >
            Cancel
          </Link>
          <button
            type="button"
            disabled={saving}
            onClick={() => persist()}
            className="rounded-lg bg-[var(--mp-orange)] px-5 py-2 text-sm font-bold text-white disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
