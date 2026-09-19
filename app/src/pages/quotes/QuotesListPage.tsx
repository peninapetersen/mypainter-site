import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { useErrorBanner } from "@/context/ErrorBannerContext";
import { useClientsMap } from "@/hooks/useClientsMap";
import { formatCurrency, formatDate } from "@/lib/nz";
import { listQuotes } from "@/lib/quotes";
import type { Quote } from "@/types/entities";

export function QuotesListPage() {
  const { showError } = useErrorBanner();
  const { map } = useClientsMap();
  const [rows, setRows] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listQuotes()
      .then(setRows)
      .catch((e) => showError(e.message))
      .finally(() => setLoading(false));
  }, [showError]);

  return (
    <div>
      <PageHeader
        title="Quotes"
        backTo="/quotes"
        actions={
          <Link to="/quotes/new" className="rounded-lg bg-[var(--mp-orange)] px-4 py-2 text-sm font-bold text-white">
            + New quote
          </Link>
        }
      />
      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : rows.length === 0 ? (
        <EmptyState message="No quotes yet." actionLabel="Create first quote" actionTo="/quotes/new" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Number</th>
                <th className="px-4 py-3">Title</th>
                <th className="hidden px-4 py-3 sm:table-cell">Client</th>
                <th className="px-4 py-3">Total</th>
                <th className="hidden px-4 py-3 md:table-cell">Valid until</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((q) => (
                <tr key={q.id} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs">{q.number}</td>
                  <td className="px-4 py-3">
                    <Link to={`/quotes/${q.id}`} className="font-semibold text-[var(--mp-navy)] hover:underline">
                      {q.title || "Untitled"}
                    </Link>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">{q.client_id ? map.get(q.client_id) ?? "—" : "—"}</td>
                  <td className="px-4 py-3">{formatCurrency(q.total)}</td>
                  <td className="hidden px-4 py-3 md:table-cell">{formatDate(q.valid_until) || "—"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={q.status} />
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
