import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/ui/PageHeader";
import { ListEntryLink } from "@/components/ui/ListEntryLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListDeleteButton } from "@/components/ui/ListDeleteButton";
import { useErrorBanner } from "@/context/ErrorBannerContext";
import { contractorDisplayName, deleteContractor, listContractors } from "@/lib/contractors";
import { formatCurrency } from "@/lib/nz";
import type { Contractor } from "@/types/entities";

export function ContractorsListPage() {
  const { showError } = useErrorBanner();
  const [rows, setRows] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const reload = useCallback(() => {
    return listContractors()
      .then(setRows)
      .catch((e) => showError(e.message));
  }, [showError]);

  useEffect(() => {
    reload().finally(() => setLoading(false));
  }, [reload]);

  async function onDelete(row: Contractor) {
    setDeletingId(row.id);
    try {
      await deleteContractor(row.id);
      setRows((prev) => prev.filter((r) => r.id !== row.id));
    } catch (e) {
      showError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  function rateLabel(row: Contractor): string {
    if (row.hourly_rate > 0) return `${formatCurrency(row.hourly_rate)}/hr`;
    if (row.day_rate > 0) return `${formatCurrency(row.day_rate)}/day`;
    return "No rate set";
  }

  return (
    <div>
      <PageHeader
        title="Contractors"
        subtitle="Subcontractors and crew — hourly or day rates for time estimates."
        actions={
          <Link
            to="/contractors/new"
            className="rounded-lg bg-[var(--mp-orange)] px-4 py-2 text-sm font-bold text-white hover:opacity-90"
          >
            New contractor
          </Link>
        }
      />

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : rows.length === 0 ? (
        <EmptyState
          message="No contractors yet. Add subs with hourly or day rates for job cost estimates."
          actionLabel="Add contractor"
          actionTo="/contractors/new"
        />
      ) : (
        <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
          {rows.map((row) => (
            <li key={row.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <ListEntryLink to={`/contractors/${row.id}`}>{contractorDisplayName(row)}</ListEntryLink>
                <p className="truncate text-sm text-slate-500">
                  {[row.trade, row.phone, rateLabel(row)].filter(Boolean).join(" · ")}
                </p>
              </div>
              <ListDeleteButton
                label={contractorDisplayName(row)}
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
