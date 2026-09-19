import { GripVertical, MoreHorizontal, Plus } from "lucide-react";
import { formatCurrency } from "@/lib/nz";
import { EMPTY_LINE_ITEM } from "@/lib/line-items";
import type { LineItem } from "@/types/entities";

export function JobLineItemsCard({
  items,
  onChange,
}: {
  items: LineItem[];
  onChange: (items: LineItem[]) => void;
}) {
  function update(i: number, patch: Partial<LineItem>) {
    onChange(items.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      {items.length === 0 ? (
        <p className="mb-4 text-sm font-bold text-[var(--mp-navy)]">Product / Service</p>
      ) : null}
      <div className="space-y-6">
        {items.map((item, idx) => (
          <div key={idx}>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-bold text-[var(--mp-navy)]">Product / Service</p>
              <button type="button" className="text-slate-400">
                <MoreHorizontal size={18} />
              </button>
            </div>
            <div className="flex gap-2">
              <span className="mt-2 cursor-grab text-slate-300">
                <GripVertical size={18} />
              </span>
              <div className="min-w-0 flex-1 space-y-3">
                <div className="grid gap-3 sm:grid-cols-12">
                  <input
                    placeholder="Name"
                    value={item.name}
                    onChange={(e) => update(idx, { name: e.target.value })}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-4"
                  />
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-semibold text-slate-500">Quantity</label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={item.qty}
                      onChange={(e) => update(idx, { qty: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-semibold text-slate-500">Unit cost</label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={item.unitCost ?? 0}
                      onChange={(e) => update(idx, { unitCost: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-semibold text-slate-500">Unit price</label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={item.unitPrice}
                      onChange={(e) => update(idx, { unitPrice: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-semibold text-slate-500">Total</label>
                    <div className="flex h-[42px] items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold">
                      {formatCurrency(item.qty * item.unitPrice)}
                    </div>
                  </div>
                </div>
                <textarea
                  placeholder="Description"
                  value={item.description ?? ""}
                  onChange={(e) => update(idx, { description: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => onChange(items.filter((_, j) => j !== idx))}
                  className="text-xs text-red-600 hover:underline"
                >
                  Remove line
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...items, { ...EMPTY_LINE_ITEM, unitCost: 0 }])}
        className="mt-4 rounded-lg bg-[var(--mp-orange)] px-4 py-2 text-sm font-bold text-white"
      >
        <Plus size={14} className="mr-1 inline" />
        Add Line Item
      </button>
    </div>
  );
}
