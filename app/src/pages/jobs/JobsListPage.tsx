import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListDeleteButton } from "@/components/ui/ListDeleteButton";
import { useErrorBanner } from "@/context/ErrorBannerContext";
import { useClientsMap } from "@/hooks/useClientsMap";
import { formatCurrency } from "@/lib/nz";
import { deleteJob, listJobs } from "@/lib/jobs";
import { formatSupabaseError } from "@/lib/supabase-errors";
import type { Job } from "@/types/entities";

export function JobsListPage() {
  const { showError } = useErrorBanner();
  const { map } = useClientsMap();
  const [rows, setRows] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    listJobs()
      .then(setRows)
      .catch((e) => showError(e.message))
      .finally(() => setLoading(false));
  }, [showError]);

  async function removeJob(j: Job) {
    setDeletingId(j.id);
    try {
      await deleteJob(j.id);
      setRows((prev) => prev.filter((r) => r.id !== j.id));
    } catch (e) {
      showError(formatSupabaseError(e));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Jobs"
        backTo="/leads"
        actions={
          <Link to="/leads/new" className="rounded-lg bg-[var(--mp-orange)] px-4 py-2 text-sm font-bold text-white">
            + New job
          </Link>
        }
      />
      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : rows.length === 0 ? (
        <EmptyState message="No leads yet." actionLabel="Create first lead" actionTo="/leads/new" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Number</th>
                <th className="px-4 py-3">Title</th>
                <th className="hidden px-4 py-3 sm:table-cell">Client</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((j) => (
                <tr key={j.id} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs">{j.number}</td>
                  <td className="px-4 py-3">
                    <Link to={`/leads/${j.id}`} className="font-semibold text-[var(--mp-navy)] hover:underline">
                      {j.title || "Untitled job"}
                    </Link>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">{j.client_id ? map.get(j.client_id) ?? "—" : "—"}</td>
                  <td className="px-4 py-3">{formatCurrency(j.subtotal_price)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={j.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ListDeleteButton
                      label={j.title || j.number || "job"}
                      deleting={deletingId === j.id}
                      onDelete={() => removeJob(j)}
                    />
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
