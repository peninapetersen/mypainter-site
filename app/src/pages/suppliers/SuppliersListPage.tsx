import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListDeleteButton } from "@/components/ui/ListDeleteButton";
import { useErrorBanner } from "@/context/ErrorBannerContext";
import { deleteSupplier, listSuppliers, supplierDisplayName } from "@/lib/suppliers";
import type { Supplier } from "@/types/entities";

export function SuppliersListPage() {
  const { showError } = useErrorBanner();
  const [rows, setRows] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const reload = useCallback(() => {
    return listSuppliers()
      .then(setRows)
      .catch((e) => showError(e.message));
  }, [showError]);

  useEffect(() => {
    reload().finally(() => setLoading(false));
  }, [reload]);

  async function onDelete(row: Supplier) {
    setDeletingId(row.id);
    try {
      await deleteSupplier(row.id);
      setRows((prev) => prev.filter((r) => r.id !== row.id));
    } catch (e) {
      showError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Suppliers"
        subtitle="Paint shops, hire companies, and material suppliers."
        actions={
          <Link
            to="/suppliers/new"
            className="rounded-lg bg-[var(--mp-orange)] px-4 py-2 text-sm font-bold text-white hover:opacity-90"
          >
            New supplier
          </Link>
        }
      />

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : rows.length === 0 ? (
        <EmptyState
          message="No suppliers yet. Add paint shops and material suppliers you buy from."
          actionLabel="Add supplier"
          actionTo="/suppliers/new"
        />
      ) : (
        <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
          {rows.map((row) => (
            <li key={row.id} className="flex items-center gap-3 px-4 py-3">
              <Link to={`/suppliers/${row.id}`} className="min-w-0 flex-1 hover:text-[var(--mp-orange)]">
                <p className="font-semibold text-[var(--mp-navy)]">{supplierDisplayName(row)}</p>
                <p className="truncate text-sm text-slate-500">
                  {[row.phone, row.email, row.account_code].filter(Boolean).join(" · ") || "No contact details"}
                </p>
              </Link>
              <ListDeleteButton
                label={supplierDisplayName(row)}
                deleting={deletingId === row.id}
                onDelete={() => onDelete(row)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
