import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Clock, Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { ListDeleteButton } from "@/components/ui/ListDeleteButton";
import { useErrorBanner } from "@/context/ErrorBannerContext";
import { listJobs } from "@/lib/jobs";
import { deleteTimesheet, formatDuration, listTimesheets } from "@/lib/timesheets";
import { formatDateLong } from "@/lib/nz";
import type { CrewTimesheet, Job } from "@/types/entities";

export function TimesheetsPage() {
  const [search] = useSearchParams();
  const jobFilter = search.get("jobId");
  const { showError } = useErrorBanner();
  const [rows, setRows] = useState<CrewTimesheet[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listTimesheets(), listJobs()])
      .then(([ts, j]) => {
        setJobs(j);
        setRows(jobFilter ? ts.filter((t) => t.job_id === jobFilter) : ts);
      })
      .catch((e) => showError(e.message))
      .finally(() => setLoading(false));
  }, [jobFilter, showError]);

  const jobMap = new Map(jobs.map((j) => [j.id, j]));

  async function remove(row: CrewTimesheet) {
    try {
      await deleteTimesheet(row.id);
      setRows((prev) => prev.filter((r) => r.id !== row.id));
    } catch (e) {
      showError(e instanceof Error ? e.message : "Delete failed");
    }
  }

  return (
    <div>
      <PageHeader
        title="Timesheets"
        backTo="/"
        actions={
          <Link
            to={jobFilter ? `/timesheets/new?fromJob=${jobFilter}` : "/timesheets/new"}
            className="inline-flex items-center gap-1 rounded-lg bg-[var(--mp-orange)] px-4 py-2 text-sm font-bold text-white"
          >
            <Plus size={16} />
            Log time
          </Link>
        }
      />

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-10 text-center">
          <Clock size={36} className="mx-auto mb-4 text-sky-600" />
          <p className="font-bold text-[var(--mp-navy)]">No time logged yet</p>
          <p className="mt-2 text-sm text-slate-500">Log hours against a job — ready for crew check-in later.</p>
          <Link
            to="/timesheets/new"
            className="mt-6 inline-block rounded-lg bg-[var(--mp-orange)] px-5 py-2 text-sm font-bold text-white"
          >
            Log first entry
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b bg-slate-50 text-left text-xs font-bold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Crew</th>
                <th className="px-4 py-3">Job</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => {
                const job = t.job_id ? jobMap.get(t.job_id) : null;
                return (
                  <tr key={t.id} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      {t.check_in_time ? formatDateLong(t.check_in_time.slice(0, 10)) : "—"}
                    </td>
                    <td className="px-4 py-3">{t.crew_member || "—"}</td>
                    <td className="px-4 py-3">
                      {job ? (
                        <Link to={`/jobs/${job.id}`} className="font-semibold text-[var(--mp-navy)] hover:underline">
                          {job.number} — {job.title || "Job"}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold">{formatDuration(t.duration_seconds)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/timesheets/${t.id}`} className="text-xs font-semibold text-[var(--mp-orange)] underline">
                          Edit
                        </Link>
                        <ListDeleteButton label="timesheet entry" onDelete={() => remove(t)} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
