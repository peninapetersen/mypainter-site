import { Link } from "react-router-dom";
import { Download, FileText, Plus } from "lucide-react";

type StartCard = {
  title: string;
  to: string;
  variant: "template" | "create";
  disabled?: boolean;
};

export function CreateStartPage({
  heading,
  description,
  cards,
  importLabel,
  importHint,
  viewAllLabel,
  viewAllTo,
  viewAllCount,
}: {
  heading: string;
  description: string;
  cards: StartCard[];
  importLabel?: string;
  importHint?: string;
  viewAllLabel?: string;
  viewAllTo?: string;
  /** Total items in the list — shown as "View all (n)" */
  viewAllCount?: number | null;
}) {
  const countSuffix =
    viewAllCount === null || viewAllCount === undefined ? " (…)" : ` (${viewAllCount})`;

  return (
    <div className="mx-auto max-w-3xl py-8 text-center">
      <h1 className="text-3xl font-bold text-[var(--mp-navy)]">{heading}</h1>
      <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-500">{description}</p>

      {viewAllTo && viewAllLabel && (
        <p className="mt-4">
          <Link to={viewAllTo} className="text-sm font-semibold text-[var(--mp-orange)] underline">
            {viewAllLabel}
            {countSuffix}
          </Link>
        </p>
      )}

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {cards.map((card) =>
          card.disabled ? (
            <div
              key={card.title}
              className="rounded-xl border border-slate-200 bg-slate-100 p-6 opacity-60"
            >
              <p className="mb-6 font-bold text-[var(--mp-navy)]">{card.title}</p>
              <div className="mx-auto flex h-32 max-w-[140px] items-end justify-center rounded border border-slate-200 bg-white p-3">
                <div className="h-full w-full rounded bg-slate-200" />
              </div>
              <p className="mt-4 text-xs text-slate-400">Coming soon</p>
            </div>
          ) : (
            <Link
              key={card.title}
              to={card.to}
              className="group rounded-xl border border-slate-200 bg-slate-50 p-6 transition hover:border-[var(--mp-orange)] hover:shadow-md"
            >
              <p className="mb-6 font-bold text-[var(--mp-navy)] group-hover:text-[var(--mp-orange)]">{card.title}</p>
              {card.variant === "template" ? (
                <div className="mx-auto flex h-32 max-w-[140px] flex-col overflow-hidden rounded border border-slate-200 bg-white shadow-sm">
                  <div className="h-3 bg-[#8b2942]" />
                  <div className="flex-1 space-y-2 p-3">
                    <div className="h-2 w-3/4 rounded bg-slate-200" />
                    <div className="h-2 w-full rounded bg-slate-100" />
                    <div className="h-2 w-5/6 rounded bg-slate-100" />
                    <div className="mt-3 h-8 rounded bg-slate-100" />
                  </div>
                </div>
              ) : (
                <div className="flex h-32 items-center justify-center">
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--mp-orange)] text-white shadow-lg transition group-hover:scale-105">
                    <Plus size={28} strokeWidth={2.5} />
                  </span>
                </div>
              )}
            </Link>
          ),
        )}
      </div>

      {importLabel && (
        <button
          type="button"
          onClick={() => importHint && alert(importHint)}
          className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[var(--mp-orange)] hover:underline"
        >
          <Download size={16} />
          {importLabel}
        </button>
      )}
    </div>
  );
}

/** Small doc icon for list page back-link */
export function StartPageIcon() {
  return <FileText size={18} className="text-[var(--mp-orange)]" />;
}
