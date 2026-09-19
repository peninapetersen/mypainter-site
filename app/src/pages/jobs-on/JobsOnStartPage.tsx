import { Link } from "react-router-dom";
import { HardHat } from "lucide-react";
import { useListCount } from "@/hooks/useListCount";
import { listJobsOn } from "@/lib/jobs-on";

export function JobsOnStartPage() {
  const count = useListCount(listJobsOn);
  const countSuffix = count === null ? " (…)" : ` (${count})`;

  return (
    <div className="mx-auto max-w-3xl py-8 text-center">
      <h1 className="text-3xl font-bold text-[var(--mp-navy)]">Jobs On</h1>
      <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-500">
        When a customer approves a quote, the job moves here. Add site notes, track expenses, then invoice when done.
      </p>
      <p className="mt-4">
        <Link to="/jobs-on/list" className="text-sm font-semibold text-[var(--mp-orange)] underline">
          View all Jobs On
          {countSuffix}
        </Link>
      </p>
      <div className="mt-10 flex justify-center">
        <span className="flex h-24 w-24 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
          <HardHat size={40} />
        </span>
      </div>
      <p className="mt-6 text-sm text-slate-500">
        Send a quote from{" "}
        <Link to="/quotes/list" className="font-semibold text-[var(--mp-orange)] underline">
          Quotes
        </Link>{" "}
        — customer approval creates Jobs On automatically.
      </p>
    </div>
  );
}
