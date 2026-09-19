import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { useErrorBanner } from "@/context/ErrorBannerContext";
import { EXPENSE_CATEGORIES, listExpenses } from "@/lib/expenses";
import { formatCurrency, formatDate } from "@/lib/nz";
import type { Expense } from "@/types/entities";

const categoryLabel = Object.fromEntries(EXPENSE_CATEGORIES.map((c) => [c.value, c.label]));

export function ExpensesListPage() {
  const { showError } = useErrorBanner();
  const [rows, setRows] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listExpenses()
      .then(setRows)
      .catch((e) => showError(e.message))
      .finally(() => setLoading(false));
  }, [showError]);

  const gstTotal = rows.reduce((s, r) => s + Number(r.gst_amount), 0);

  return (
    <div>
      <PageHeader
        title="Expenses"
        backTo="/expenses"
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
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Item</th>
                <th className="hidden px-4 py-3 sm:table-cell">Merchant</th>
                <th className="px-4 py-3">Total</th>
                <th className="hidden px-4 py-3 md:table-cell">GST</th>
                <th className="hidden px-4 py-3 lg:table-cell">Category</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3">{formatDate(r.expense_date) || "—"}</td>
                  <td className="px-4 py-3">
                    <Link to={`/expenses/${r.id}`} className="font-semibold text-[var(--mp-navy)] hover:underline">
                      {r.item_name || "Receipt"}
                    </Link>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">{r.merchant || "—"}</td>
                  <td className="px-4 py-3">{formatCurrency(r.amount)}</td>
                  <td className="hidden px-4 py-3 md:table-cell">{formatCurrency(r.gst_amount)}</td>
                  <td className="hidden px-4 py-3 lg:table-cell text-xs text-slate-500">{categoryLabel[r.category] ?? r.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
