import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListDeleteButton } from "@/components/ui/ListDeleteButton";
import { ListEntryLink } from "@/components/ui/ListEntryLink";
import { AccountCodePillFilters } from "@/components/settings/AccountCodePillFilters";
import { useErrorBanner } from "@/context/ErrorBannerContext";
import { friendlyNameForCode, listAccountCodes, resolveServiceAccountCode } from "@/lib/account-codes";
import { formatCurrency } from "@/lib/nz";
import { deleteService, listAllServices } from "@/lib/services";
import { formatSupabaseError } from "@/lib/supabase-errors";
import type { AccountCode } from "@/types/entities";
import type { MpService } from "@/types/services";

export function ServicesListPage() {
  const { showError } = useErrorBanner();
  const [rows, setRows] = useState<MpService[]>([]);
  const [codes, setCodes] = useState<AccountCode[]>([]);
  const [codeFilter, setCodeFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const productPills = useMemo(
    () => codes.filter((c) => c.is_active && (c.applies_to ?? []).includes("products_services")),
    [codes],
  );

  const reload = useCallback(() => {
    return Promise.all([listAllServices(), listAccountCodes({ activeOnly: false })])
      .then(([services, allCodes]) => {
        setRows(services);
        setCodes(allCodes);
      })
      .catch((e) => showError(formatSupabaseError(e)));
  }, [showError]);

  useEffect(() => {
    reload().finally(() => setLoading(false));
  }, [reload]);

  const filtered = useMemo(() => {
    if (!codeFilter) return rows;
    return rows.filter((r) => resolveServiceAccountCode(r) === codeFilter);
  }, [rows, codeFilter]);

  async function onDelete(row: MpService) {
    setDeletingId(row.id);
    try {
      await deleteService(row.id);
      setRows((prev) => prev.filter((r) => r.id !== row.id));
    } catch (e) {
      showError(formatSupabaseError(e));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Products & services"
        subtitle="Rate card for quotes, invoices, and the website calculator. Category pills come from Tax & accounting."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to="/settings/tax" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50">
              Account codes
            </Link>
            <Link to="/services/new" className="rounded-lg bg-[var(--mp-orange)] px-4 py-2 text-sm font-bold text-white">
              + New item
            </Link>
          </div>
        }
      />

      {!loading && productPills.length > 0 && (
        <AccountCodePillFilters codes={productPills} selected={codeFilter} onSelect={setCodeFilter} />
      )}

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : rows.length === 0 ? (
        <EmptyState message="No products or services yet." actionLabel="Add first item" actionTo="/services/new" />
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-slate-600">No items in this category.</p>
          <button type="button" onClick={() => setCodeFilter(null)} className="mt-3 text-sm font-semibold text-[var(--mp-orange)] hover:underline">
            Show all
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="hidden px-4 py-3 sm:table-cell">Category</th>
                <th className="px-4 py-3">Rate</th>
                <th className="hidden px-4 py-3 md:table-cell">Tax code</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const ac = resolveServiceAccountCode(row);
                return (
                  <tr key={row.id} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <ListEntryLink to={`/services/${row.id}`}>{row.name}</ListEntryLink>
                      {row.description && <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{row.description}</p>}
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">{friendlyNameForCode(codes, ac)}</td>
                    <td className="px-4 py-3">
                      {formatCurrency(row.rate_per_unit)}
                      {row.unit_label ? <span className="text-xs text-slate-400"> / {row.unit_label}</span> : null}
                    </td>
                    <td className="hidden px-4 py-3 font-mono text-xs md:table-cell">{ac}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          row.active
                            ? "rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800"
                            : "rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600"
                        }
                      >
                        {row.active ? "Active" : "Hidden"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ListDeleteButton label={row.name} deleting={deletingId === row.id} onDelete={() => onDelete(row)} />
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
