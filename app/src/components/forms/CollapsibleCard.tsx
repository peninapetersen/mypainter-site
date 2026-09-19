import { ChevronDown, ChevronUp } from "lucide-react";
import type { ReactNode } from "react";

export function CollapsibleCard({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-left font-bold text-[var(--mp-navy)]"
      >
        {title}
        {open ? <ChevronUp size={18} className="text-[var(--mp-orange)]" /> : <ChevronDown size={18} className="text-[var(--mp-orange)]" />}
      </button>
      {open && <div className="border-t border-slate-200 px-4 py-4">{children}</div>}
    </div>
  );
}
