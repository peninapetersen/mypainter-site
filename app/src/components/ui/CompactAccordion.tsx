import { useState, type ReactNode } from "react";
import { ChevronDown, type LucideIcon } from "lucide-react";

export function CompactAccordion({
  title,
  icon: Icon,
  badge,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon?: LucideIcon;
  badge?: string | number;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left"
      >
        <span className="flex min-w-0 items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
          {Icon && <Icon size={12} className="shrink-0" />}
          <span className="truncate">{title}</span>
          {badge !== undefined && badge !== "" && (
            <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-600">{badge}</span>
          )}
        </span>
        <ChevronDown size={14} className={`shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="border-t border-slate-100 px-3 pb-3 pt-2">{children}</div>}
    </div>
  );
}
