import { Trash2 } from "lucide-react";
import { DEFAULT_QUOTE_TERMS } from "@/lib/line-items";

export function QuoteContractSection({
  terms,
  onChange,
  onRemove,
  applyDefault,
  onApplyDefaultChange,
}: {
  terms: string;
  onChange: (terms: string) => void;
  onRemove: () => void;
  applyDefault: boolean;
  onApplyDefaultChange: (v: boolean) => void;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-[var(--mp-navy)]">Contract / Disclaimer</h2>
        <button type="button" onClick={onRemove} className="text-slate-400 hover:text-red-600" aria-label="Remove section">
          <Trash2 size={18} />
        </button>
      </div>
      <label className="block text-sm">
        <span className="mb-1 block text-xs text-slate-400">Description</span>
        <textarea
          value={terms}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </label>
      <label className="mt-3 flex items-center gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          checked={applyDefault}
          onChange={(e) => {
            onApplyDefaultChange(e.target.checked);
            if (e.target.checked) onChange(DEFAULT_QUOTE_TERMS);
          }}
        />
        Apply to all future quotes
      </label>
    </div>
  );
}
