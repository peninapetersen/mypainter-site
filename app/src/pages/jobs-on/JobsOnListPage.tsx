import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { useErrorBanner } from "@/context/ErrorBannerContext";
import { useClientsMap } from "@/hooks/useClientsMap";
import { formatCurrency } from "@/lib/nz";
import { jobsOnDealValue, listJobsOn } from "@/lib/jobs-on";
import type { JobOn } from "@/types/entities";

export function JobsOnListPage() {
  const { showError } = useErrorBanner();
  const { map } = useClientsMap();
  const [rows, setRows] = useState<JobOn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listJobsOn()
      .then(setRows)
      .catch((e) => showError(e.message))
      .finally(() => setLoading(false));
  }, [showError]);

  return (
    <div>
      <PageHeader title="Jobs On" subtitle="Approved quotes — work in progress." backTo="/jobs-on" />
      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : rows.length === 0 ? (
        <EmptyState message="No Jobs On yet — created when a customer approves a quote." actionLabel="View quotes" actionTo="/quotes/list" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-bold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Value</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <Link to={`/jobs-on/${r.id}`} className="font-semibold text-[var(--mp-navy)] hover:underline">
                      {r.number}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{r.title || "—"}</td>
                  <td className="px-4 py-3">{r.client_id ? map.get(r.client_id) || "—" : "—"}</td>
                  <td className="px-4 py-3">{formatCurrency(jobsOnDealValue(r))}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        r.status === "draft"
                          ? "rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800"
                          : r.status === "completed"
                            ? "rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600"
                            : "rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800"
                      }
                    >
                      {r.status === "draft" ? "Draft" : r.status === "completed" ? "Completed" : "Active"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
