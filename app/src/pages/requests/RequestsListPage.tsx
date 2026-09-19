import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListDeleteButton } from "@/components/ui/ListDeleteButton";
import { useErrorBanner } from "@/context/ErrorBannerContext";
import { useClientsMap } from "@/hooks/useClientsMap";
import { formatCurrency, formatDate } from "@/lib/nz";
import { deleteRequest, listRequests } from "@/lib/requests";
import { formatSupabaseError } from "@/lib/supabase-errors";
import type { Request } from "@/types/entities";

export function RequestsListPage() {
  const { showError } = useErrorBanner();
  const { map } = useClientsMap();
  const [rows, setRows] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    listRequests()
      .then(setRows)
      .catch((e) => showError(e.message))
      .finally(() => setLoading(false));
  }, [showError]);

  async function removeRequest(r: Request) {
    setDeletingId(r.id);
    try {
      await deleteRequest(r.id);
      setRows((prev) => prev.filter((row) => row.id !== r.id));
    } catch (e) {
      showError(formatSupabaseError(e));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Requests"
        backTo="/requests"
        actions={
          <Link to="/requests/new" className="rounded-lg bg-[var(--mp-orange)] px-4 py-2 text-sm font-bold text-white">
            + New request
          </Link>
        }
      />
      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : rows.length === 0 ? (
        <EmptyState message="No requests yet." actionLabel="Add first request" actionTo="/requests/new" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="hidden px-4 py-3 sm:table-cell">Client</th>
                <th className="hidden px-4 py-3 md:table-cell">Date</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link to={`/requests/${r.id}`} className="font-semibold text-[var(--mp-navy)] hover:underline">
                      {r.title || "Untitled request"}
                      {r.source === "website" && (
                        <span className="ml-2 rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-orange-800">
                          Web
                        </span>
                      )}
                    </Link>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">{r.client_id ? map.get(r.client_id) ?? "—" : "—"}</td>
                  <td className="hidden px-4 py-3 md:table-cell">{formatDate(r.requested_on) || "—"}</td>
                  <td className="px-4 py-3">{formatCurrency(r.subtotal)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ListDeleteButton
                      label={r.title || "request"}
                      deleting={deletingId === r.id}
                      onDelete={() => removeRequest(r)}
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
