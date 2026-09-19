import { Link } from "react-router-dom";

export function EmptyState({ message, actionLabel, actionTo }: { message: string; actionLabel?: string; actionTo?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <p className="text-slate-500">{message}</p>
      {actionLabel && actionTo && (
        <Link
          to={actionTo}
          className="mt-4 inline-block rounded-lg bg-[var(--mp-orange)] px-4 py-2 text-sm font-bold text-white"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
