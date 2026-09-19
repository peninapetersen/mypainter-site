import { Link } from "react-router-dom";
import { Download, Hammer, Plus } from "lucide-react";
import { useListCount } from "@/hooks/useListCount";
import { listJobs } from "@/lib/jobs";

export function JobsStartPage() {
  const count = useListCount(listJobs);
  const countSuffix = count === null ? " (…)" : ` (${count})`;

  return (
    <div className="mx-auto max-w-3xl py-8 text-center">
      <h1 className="text-3xl font-bold text-[var(--mp-navy)]">Leads</h1>
      <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-500">
        Site visits and measure-ups before a quote goes out. Schedule a lead visit from a request, then build the quote.
      </p>
      <p className="mt-4">
        <Link to="/leads/list" className="text-sm font-semibold text-[var(--mp-orange)] underline">
          View all leads
          {countSuffix}
        </Link>
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-100 p-6 opacity-60">
          <p className="mb-6 font-bold text-[var(--mp-navy)]">See Jobs in Action</p>
          <div className="mx-auto flex h-32 max-w-[140px] flex-col overflow-hidden rounded border border-slate-200 bg-white shadow-sm">
            <div className="h-3 bg-emerald-700" />
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-3">
              <span className="flex h-10 w-10 items-center justify-center rounded bg-emerald-100 text-emerald-700">
                <Hammer size={20} />
              </span>
              <div className="h-2 w-full rounded bg-slate-200" />
              <div className="h-2 w-4/5 rounded bg-slate-100" />
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-400">Demo — coming soon</p>
        </div>

        <Link
          to="/leads/new"
          className="group rounded-xl border border-slate-200 bg-slate-50 p-6 transition hover:border-[var(--mp-orange)] hover:shadow-md"
        >
          <p className="mb-6 font-bold text-[var(--mp-navy)] group-hover:text-[var(--mp-orange)]">Create a Job</p>
          <div className="flex h-32 items-center justify-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--mp-orange)] text-white shadow-lg transition group-hover:scale-105">
              <Plus size={28} strokeWidth={2.5} />
            </span>
          </div>
        </Link>
      </div>

      <button
        type="button"
        onClick={() => alert("Import job data from CSV — coming in a later phase.")}
        className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[var(--mp-orange)] hover:underline"
      >
        <Download size={16} />
        Import Job Data
      </button>
    </div>
  );
}
