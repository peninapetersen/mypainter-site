import { Link } from "react-router-dom";
import { Pencil, Plus } from "lucide-react";
import { clientDisplayName } from "@/lib/client-display";
import type { Client } from "@/types/entities";

export function ClientSelect({
  clients,
  value,
  onChange,
  required,
  returnTo,
}: {
  clients: Client[];
  value: string;
  onChange: (id: string) => void;
  required?: boolean;
  /** After edit/new client, return here (e.g. /requests/uuid) */
  returnTo?: string;
}) {
  const editHref = value
    ? returnTo
      ? `/clients/${value}?returnTo=${encodeURIComponent(returnTo)}`
      : `/clients/${value}`
    : null;
  const newHref = returnTo ? `/clients/new?returnTo=${encodeURIComponent(returnTo)}` : "/clients/new";

  return (
    <div>
      <p className="mb-1 text-sm font-semibold text-slate-700">Client</p>
      <div className="flex gap-2">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">— Select client —</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {[c.first_name, c.last_name].filter(Boolean).join(" ").trim() || clientDisplayName(c)}
              {c.company_name ? ` · ${c.company_name}` : ""}
            </option>
          ))}
        </select>
        {editHref && (
          <Link
            to={editHref}
            title="Edit client"
            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[var(--mp-navy)] px-3 py-2 text-sm font-bold text-[var(--mp-navy)] hover:bg-slate-50"
          >
            <Pencil size={14} />
            <span className="hidden sm:inline">Edit</span>
          </Link>
        )}
        <Link
          to={newHref}
          title="New client"
          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[var(--mp-orange)] px-3 py-2 text-sm font-bold text-[var(--mp-orange)] hover:bg-orange-50"
        >
          <Plus size={14} />
          <span className="hidden sm:inline">New</span>
        </Link>
      </div>
    </div>
  );
}
