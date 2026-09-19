import { friendlyName } from "@/lib/account-codes";
import type { AccountCode } from "@/types/entities";

/** Filter pills from account codes tagged for products & services. */
export function AccountCodePillFilters({
  codes,
  selected,
  onSelect,
}: {
  codes: AccountCode[];
  selected: string | null;
  onSelect: (code: string | null) => void;
}) {
  if (codes.length === 0) return null;

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={`rounded-full px-3 py-1 text-sm font-semibold ${
          selected === null
            ? "bg-[var(--mp-navy)] text-white"
            : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
        }`}
      >
        All
      </button>
      {codes.map((row) => (
        <button
          key={row.id}
          type="button"
          onClick={() => onSelect(row.code)}
          className={`rounded-full px-3 py-1 text-sm font-semibold ${
            selected === row.code
              ? "bg-[var(--mp-orange)] text-white"
              : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          {friendlyName(row)}
        </button>
      ))}
    </div>
  );
}
