import { Link } from "react-router-dom";
import { Pencil, Plus } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { supplierDisplayName } from "@/lib/suppliers";
import type { Supplier } from "@/types/entities";

export function SupplierSelect({
  suppliers,
  value,
  onChange,
  returnTo,
}: {
  suppliers: Supplier[];
  value: string;
  onChange: (id: string) => void;
  returnTo?: string;
}) {
  const selected = suppliers.find((s) => s.id === value);
  const editHref = value
    ? returnTo
      ? `/suppliers/${value}?returnTo=${encodeURIComponent(returnTo)}`
      : `/suppliers/${value}`
    : null;
  const newHref = returnTo ? `/suppliers/new?returnTo=${encodeURIComponent(returnTo)}` : "/suppliers/new";

  return (
    <div>
      <p className="mb-1 text-sm font-semibold text-slate-700">Supplier</p>
      <div className="flex gap-2">
        {selected && (
          <Avatar photoPath={selected.logo_path} name={supplierDisplayName(selected)} size={40} rounded="lg" />
        )}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">— Select supplier —</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {supplierDisplayName(s)}
            </option>
          ))}
        </select>
        {editHref && (
          <Link
            to={editHref}
            title="Edit supplier"
            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[var(--mp-navy)] px-3 py-2 text-sm font-bold text-[var(--mp-navy)] hover:bg-slate-50"
          >
            <Pencil size={14} />
            <span className="hidden sm:inline">Edit</span>
          </Link>
        )}
        <Link
          to={newHref}
          title="New supplier"
          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[var(--mp-orange)] px-3 py-2 text-sm font-bold text-[var(--mp-orange)] hover:bg-orange-50"
        >
          <Plus size={14} />
          <span className="hidden sm:inline">New</span>
        </Link>
      </div>
    </div>
  );
}
