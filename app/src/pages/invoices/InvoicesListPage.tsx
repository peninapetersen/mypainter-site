import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListDeleteButton } from "@/components/ui/ListDeleteButton";
import { useErrorBanner } from "@/context/ErrorBannerContext";
import { useClientsMap } from "@/hooks/useClientsMap";
import { formatCurrency, formatDate } from "@/lib/nz";
import { deleteInvoice, listInvoices } from "@/lib/invoices";
import { formatSupabaseError } from "@/lib/supabase-errors";
import type { Invoice } from "@/types/entities";

export function InvoicesListPage() {
  const { showError } = useErrorBanner();
  const { map } = useClientsMap();
  const [rows, setRows] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    listInvoices()
      .then(setRows)
      .catch((e) => showError(e.message))
      .finally(() => setLoading(false));
  }, [showError]);

  async function removeInvoice(inv: Invoice) {
    setDeletingId(inv.id);
    try {
      await deleteInvoice(inv.id);
      setRows((prev) => prev.filter((r) => r.id !== inv.id));
    } catch (e) {
      showError(formatSupabaseError(e));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Invoices"
        backTo="/invoices"
        actions={
          <Link to="/invoices/new" className="rounded-lg bg-[var(--mp-orange)] px-4 py-2 text-sm font-bold text-white">
            + New invoice
          </Link>
        }
      />
      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : rows.length === 0 ? (
        <EmptyState message="No invoices yet." actionLabel="Create first invoice" actionTo="/invoices/new" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Number</th>
                <th className="hidden px-4 py-3 sm:table-cell">Client</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Balance</th>
                <th className="hidden px-4 py-3 md:table-cell">Issued</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((inv) => (
                <tr key={inv.id} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link to={`/invoices/${inv.id}`} className="font-mono text-xs font-semibold text-[var(--mp-navy)] hover:underline">
                      {inv.number}
                    </Link>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">{inv.client_id ? map.get(inv.client_id) ?? "—" : "—"}</td>
                  <td className="px-4 py-3">{formatCurrency(inv.total)}</td>
                  <td className="px-4 py-3">{formatCurrency(inv.balance)}</td>
                  <td className="hidden px-4 py-3 md:table-cell">{formatDate(inv.issued_date) || "—"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={inv.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ListDeleteButton
                      label={inv.number || "invoice"}
                      deleting={deletingId === inv.id}
                      onDelete={() => removeInvoice(inv)}
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
