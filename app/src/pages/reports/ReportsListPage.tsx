import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/ui/PageHeader";
import { ListEntryLink, ListRefLink } from "@/components/ui/ListEntryLink";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListDeleteButton } from "@/components/ui/ListDeleteButton";
import { useErrorBanner } from "@/context/ErrorBannerContext";
import { useClientsMap } from "@/hooks/useClientsMap";
import { formatDate } from "@/lib/nz";
import { deleteReport, listReports } from "@/lib/reports";
import { formatSupabaseError } from "@/lib/supabase-errors";
import type { Report } from "@/types/entities";

export function ReportsListPage() {
  const { showError } = useErrorBanner();
  const { map } = useClientsMap();
  const [rows, setRows] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    listReports()
      .then(setRows)
      .catch((e) => showError(formatSupabaseError(e)))
      .finally(() => setLoading(false));
  }, [showError]);

  async function remove(r: Report) {
    setDeletingId(r.id);
    try {
      await deleteReport(r.id);
      setRows((prev) => prev.filter((x) => x.id !== r.id));
    } catch (e) {
      showError(formatSupabaseError(e));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Reports"
        actions={
          <Link to="/reports/new" className="rounded-lg bg-[var(--mp-orange)] px-4 py-2 text-sm font-bold text-white">
            + New report
          </Link>
        }
      />
      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : rows.length === 0 ? (
        <EmptyState message="No reports yet." actionLabel="Create first report" actionTo="/reports/new" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Number</th>
                <th className="hidden px-4 py-3 sm:table-cell">Client</th>
                <th className="hidden px-4 py-3 md:table-cell">Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <ListEntryLink to={`/reports/${r.id}`}>{r.title || "Untitled"}</ListEntryLink>
                  </td>
                  <td className="px-4 py-3">
                    <ListRefLink to={`/reports/${r.id}`}>{r.number}</ListRefLink>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">{r.client_id ? map.get(r.client_id) ?? "—" : "—"}</td>
                  <td className="hidden px-4 py-3 md:table-cell">{formatDate(r.report_date) || "—"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ListDeleteButton label={r.number || r.title || "report"} deleting={deletingId === r.id} onDelete={() => remove(r)} />
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
