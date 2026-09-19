import { Plus, Trash2 } from "lucide-react";
import type { CustomField } from "@/types/entities";

export function CustomFieldsEditor({
  fields,
  onChange,
}: {
  fields: CustomField[];
  onChange: (fields: CustomField[]) => void;
}) {
  function update(i: number, patch: Partial<CustomField>) {
    onChange(fields.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500">Create custom fields to track additional details.</p>
      {fields.map((f, i) => (
        <div key={i} className="flex gap-2">
          <input
            placeholder="Field name"
            value={f.label}
            onChange={(e) => update(i, { label: e.target.value })}
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            placeholder="Value"
            value={f.value}
            onChange={(e) => update(i, { value: e.target.value })}
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button type="button" onClick={() => onChange(fields.filter((_, idx) => idx !== i))} className="rounded p-2 text-red-500 hover:bg-red-50">
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...fields, { label: "", value: "" }])}
        className="rounded-lg border border-[var(--mp-orange)] px-4 py-2 text-sm font-semibold text-[var(--mp-orange)]"
      >
        <Plus size={14} className="mr-1 inline" />
        Add Custom Field
      </button>
    </div>
  );
}
