import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/ui/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { ListEntryLink } from "@/components/ui/ListEntryLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListDeleteButton } from "@/components/ui/ListDeleteButton";
import { useErrorBanner } from "@/context/ErrorBannerContext";
import { EXPENSE_CATEGORIES, deleteExpense, listExpenses } from "@/lib/expenses";
import { formatCurrency, formatDate } from "@/lib/nz";
import { listSuppliers, supplierDisplayName } from "@/lib/suppliers";
import { formatSupabaseError } from "@/lib/supabase-errors";
import type { Expense, Supplier } from "@/types/entities";

const categoryLabel = Object.fromEntries(EXPENSE_CATEGORIES.map((c) => [c.value, c.label]));

export function ExpensesListPage() {
  const { showError } = useErrorBanner();
  const [rows, setRows] = useState<Expense[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const supplierMap = useMemo(() => new Map(suppliers.map((s) => [s.id, s])), [suppliers]);

  useEffect(() => {
    Promise.all([listExpenses(), listSuppliers()])
      .then(([expenses, sups]) => {
        setRows(expenses);
        setSuppliers(sups);
      })
      .catch((e) => showError(e.message))
      .finally(() => setLoading(false));
  }, [showError]);

  async function removeExpense(r: Expense) {
    setDeletingId(r.id);
    try {
      await deleteExpense(r.id);
      setRows((prev) => prev.filter((row) => row.id !== r.id));
    } catch (e) {
      showError(formatSupabaseError(e));
    } finally {
      setDeletingId(null);
    }
  }

  const gstTotal = rows.reduce((s, r) => s + Number(r.gst_amount), 0);

  return (
    <div>
      <PageHeader
        title="Expenses"
        actions={
          <Link to="/expenses/new" className="rounded-lg bg-[var(--mp-orange)] px-4 py-2 text-sm font-bold text-white">
            + New expense
          </Link>
        }
      />
      {!loading && rows.length > 0 && (
        <div className="mb-4 rounded-lg bg-[var(--mp-navy)] px-4 py-3 text-white">
          <p className="text-xs text-white/70">GST captured (tax time ready)</p>
          <p className="text-xl font-bold">{formatCurrency(gstTotal)}</p>
        </div>
      )}
      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : rows.length === 0 ? (
        <EmptyState message="No expenses yet." actionLabel="Log first expense" actionTo="/expenses/new" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="w-12 px-3 py-3" aria-label="Supplier" />
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Item</th>
                <th className="hidden px-4 py-3 sm:table-cell">Supplier</th>
                <th className="px-4 py-3">Total</th>
                <th className="hidden px-4 py-3 md:table-cell">GST</th>
                <th className="hidden px-4 py-3 lg:table-cell">Category</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const supplier = r.supplier_id ? supplierMap.get(r.supplier_id) : null;
                const supplierLabel = supplier ? supplierDisplayName(supplier) : r.merchant || "—";
                return (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="px-3 py-3">
                      {supplier ? (
                        <Avatar photoPath={supplier.logo_path} name={supplierLabel} size={32} rounded="lg" />
                      ) : (
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{formatDate(r.expense_date) || "—"}</td>
                    <td className="px-4 py-3">
                      <ListEntryLink to={`/expenses/${r.id}`}>{r.item_name || "Receipt"}</ListEntryLink>
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">{supplierLabel}</td>
                    <td className="px-4 py-3">{formatCurrency(r.amount)}</td>
                    <td className="hidden px-4 py-3 md:table-cell">{formatCurrency(r.gst_amount)}</td>
                    <td className="hidden px-4 py-3 lg:table-cell text-xs text-slate-500">{categoryLabel[r.category] ?? r.category}</td>
                    <td className="px-4 py-3 text-right">
                      <ListDeleteButton
                        label={r.item_name || r.merchant || "expense"}
                        deleting={deletingId === r.id}
                        onDelete={() => removeExpense(r)}
                      />
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
