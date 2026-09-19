import { Link } from "react-router-dom";

/** Primary row link — title / name column on list pages. */
export function ListEntryLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="font-semibold text-[var(--mp-navy)] hover:text-[var(--mp-orange)] hover:underline">
      {children}
    </Link>
  );
}

/** Secondary link — number / reference column. */
export function ListRefLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="font-mono text-xs text-slate-500 hover:text-[var(--mp-orange)] hover:underline">
      {children}
    </Link>
  );
}
