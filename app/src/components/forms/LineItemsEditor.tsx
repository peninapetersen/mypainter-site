import { Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/nz";
import { calcLineSubtotal, EMPTY_LINE_ITEM } from "@/lib/line-items";
import type { LineItem } from "@/types/entities";

export function LineItemsEditor({
  items,
  onChange,
  showCost,
}: {
  items: LineItem[];
  onChange: (items: LineItem[]) => void;
  showCost?: boolean;
}) {
  function update(i: number, patch: Partial<LineItem>) {
    onChange(items.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }

  function remove(i: number) {
    onChange(items.filter((_, idx) => idx !== i));
  }

  function add() {
    onChange([...items, { ...EMPTY_LINE_ITEM }]);
  }

  const subtotal = calcLineSubtotal(items);

  return (
    <div className="space-y-3">
      <div className="hidden gap-2 text-xs font-semibold uppercase text-slate-400 sm:grid sm:grid-cols-12">
        <span className="sm:col-span-4">Item</span>
        <span className="sm:col-span-2">Qty</span>
        <span className="sm:col-span-2">Price</span>
        {showCost && <span className="sm:col-span-2">Cost</span>}
        <span className="sm:col-span-2">Line</span>
      </div>
      {items.map((item, i) => (
        <div key={i} className="rounded-lg border border-slate-200 bg-white p-3 sm:grid sm:grid-cols-12 sm:gap-2 sm:p-2">
          <input
            placeholder="Description"
            value={item.name}
            onChange={(e) => update(i, { name: e.target.value })}
            className="mb-2 w-full rounded border border-slate-200 px-2 py-1.5 text-sm sm:col-span-4 sm:mb-0"
          />
          <input
            type="number"
            min={0}
            step={0.01}
            value={item.qty}
            onChange={(e) => update(i, { qty: parseFloat(e.target.value) || 0 })}
            className="mb-2 w-full rounded border border-slate-200 px-2 py-1.5 text-sm sm:col-span-2 sm:mb-0"
          />
          <input
            type="number"
            min={0}
            step={0.01}
            value={item.unitPrice}
            onChange={(e) => update(i, { unitPrice: parseFloat(e.target.value) || 0 })}
            className="mb-2 w-full rounded border border-slate-200 px-2 py-1.5 text-sm sm:col-span-2 sm:mb-0"
          />
          {showCost && (
            <input
              type="number"
              min={0}
              step={0.01}
              value={item.unitCost ?? 0}
              onChange={(e) => update(i, { unitCost: parseFloat(e.target.value) || 0 })}
              className="mb-2 w-full rounded border border-slate-200 px-2 py-1.5 text-sm sm:col-span-2 sm:mb-0"
            />
          )}
          <div className="flex items-center justify-between sm:col-span-2">
            <span className="text-sm font-medium">{formatCurrency(item.qty * item.unitPrice)}</span>
            <button type="button" onClick={() => remove(i)} className="rounded p-1 text-red-500 hover:bg-red-50">
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}
      <div className="flex items-center justify-between">
        <button type="button" onClick={add} className="flex items-center gap-1 text-sm font-semibold text-[var(--mp-navy)]">
          <Plus size={16} /> Add line
        </button>
        <p className="text-sm font-bold">Subtotal: {formatCurrency(subtotal)}</p>
      </div>
    </div>
  );
}
