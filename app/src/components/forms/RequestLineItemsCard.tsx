import { Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/nz";
import { calcLineSubtotal, EMPTY_LINE_ITEM } from "@/lib/line-items";
import type { LineItem } from "@/types/entities";

export function RequestLineItemsCard({
  items,
  onChange,
}: {
  items: LineItem[];
  onChange: (items: LineItem[]) => void;
}) {
  function update(i: number, patch: Partial<LineItem>) {
    onChange(items.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }

  const subtotal = calcLineSubtotal(items);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-bold text-[var(--mp-navy)]">Product / Service</h2>
      <p className="mt-1 text-sm text-slate-500">Keep everything on track by adding products and services.</p>

      <button
        type="button"
        onClick={() => onChange([...items, { ...EMPTY_LINE_ITEM }])}
        className="mt-4 rounded-lg bg-[var(--mp-orange)] px-4 py-2 text-sm font-bold text-white"
      >
        <Plus size={14} className="mr-1 inline" />
        Add Line Item
      </button>

      {items.length > 0 && (
        <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
          {items.map((item, i) => (
            <div key={i} className="grid gap-2 rounded-lg border border-slate-100 bg-slate-50 p-3 sm:grid-cols-12">
              <input
                placeholder="Product or service"
                value={item.name}
                onChange={(e) => update(i, { name: e.target.value })}
                className="rounded border border-slate-200 px-2 py-1.5 text-sm sm:col-span-5"
              />
              <input
                type="number"
                min={0}
                step={0.01}
                placeholder="Qty"
                value={item.qty || ""}
                onChange={(e) => update(i, { qty: parseFloat(e.target.value) || 0 })}
                className="rounded border border-slate-200 px-2 py-1.5 text-sm sm:col-span-2"
              />
              <input
                type="number"
                min={0}
                step={0.01}
                placeholder="Unit price"
                value={item.unitPrice || ""}
                onChange={(e) => update(i, { unitPrice: parseFloat(e.target.value) || 0 })}
                className="rounded border border-slate-200 px-2 py-1.5 text-sm sm:col-span-3"
              />
              <div className="flex items-center justify-between sm:col-span-2">
                <span className="text-sm font-medium">{formatCurrency(item.qty * item.unitPrice)}</span>
                <button type="button" onClick={() => onChange(items.filter((_, idx) => idx !== i))} className="text-red-500">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 border-t border-slate-200 pt-4">
        <div className="ml-auto max-w-xs space-y-2 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-[var(--mp-navy)]">
            <span>Total</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
