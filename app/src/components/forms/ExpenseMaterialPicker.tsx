import { EXPENSE_MATERIAL_PRESETS, type ExpenseMaterialPreset } from "@/lib/expense-materials";

export function ExpenseMaterialPicker({ onPick }: { onPick: (preset: ExpenseMaterialPreset) => void }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="mb-2 text-sm font-bold text-[var(--mp-navy)]">Quick add material</p>
      <p className="mb-3 text-xs text-slate-500">Tap a common item — fills name, category, and accounting code.</p>
      <div className="flex flex-wrap gap-2">
        {EXPENSE_MATERIAL_PRESETS.map((preset) => (
          <button
            key={preset.item_name}
            type="button"
            onClick={() => onPick(preset)}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:border-[var(--mp-orange)] hover:text-[var(--mp-navy)]"
          >
            {preset.item_name}
          </button>
        ))}
      </div>
    </div>
  );
}
