import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Receipt } from "lucide-react";
import { listExpenses } from "@/lib/expenses";

export function ExpensesStartPage() {
  const [count, setCount] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    listExpenses()
      .then((rows) => setCount(rows.length))
      .catch(() => setCount(0));
  }, []);

  const countLabel = count === null ? "…" : String(count);

  if (count !== null && count > 0) {
    return (
      <div className="mx-auto max-w-3xl py-4">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-[var(--mp-navy)]">Expenses</h1>
          <div className="flex gap-2">
            <Link to="/expenses/new" className="rounded-lg bg-[var(--mp-orange)] px-4 py-2 text-sm font-bold text-white">
              New expense
            </Link>
            <Link to="/expenses/list" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold">
              View all ({countLabel})
            </Link>
          </div>
        </div>
        <p className="text-sm text-slate-600">
          {count} expense{count === 1 ? "" : "s"} logged.{" "}
          <Link to="/expenses/list" className="font-semibold text-[var(--mp-orange)] underline">
            Open list →
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-[var(--mp-navy)]">Expenses</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/expenses/list" className="text-sm font-semibold text-[var(--mp-orange)] underline">
            View all expenses ({countLabel})
          </Link>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-1 rounded-lg bg-[var(--mp-orange)] px-4 py-2 text-sm font-bold text-white"
            >
              New Expense <ChevronDown size={16} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 z-10 mt-1 w-44 rounded-lg border bg-white py-1 shadow-lg">
                <Link
                  to="/expenses/new"
                  className="block px-3 py-2 text-sm hover:bg-slate-50"
                  onClick={() => setMenuOpen(false)}
                >
                  From receipt photo
                </Link>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => alert("Expense reports — coming for tax time.")}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-[var(--mp-navy)]"
          >
            View Report
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-lg rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <span className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-sky-100 text-sky-700">
          <Receipt size={36} />
        </span>
        <h2 className="text-xl font-bold text-[var(--mp-navy)]">Track your expenses</h2>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-slate-600">
          Snap a receipt photo — AI reads it and fills the form. Attach to a job, track GST, ready for tax time.
        </p>
        <Link
          to="/expenses/new"
          className="mt-8 inline-block rounded-lg bg-[var(--mp-orange)] px-6 py-3 text-sm font-bold text-white"
        >
          Log your first expense
        </Link>
        <p className="mt-4">
          <button type="button" className="text-sm font-semibold text-[var(--mp-orange)] underline">
            Learn about expenses
          </button>
        </p>
      </div>
    </div>
  );
}
