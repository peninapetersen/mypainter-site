import { ImageIcon, Plus } from "lucide-react";
import { formatCurrency } from "@/lib/nz";
import { EMPTY_LINE_ITEM } from "@/lib/line-items";
import type { LineItem } from "@/types/entities";

export function QuoteLineItemsCard({
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
    <div className="space-y-4">
      {items.map((item, idx) =>
        item.isText ? (
          <div key={idx} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="mb-2 text-xs font-bold uppercase text-slate-400">Text</p>
            <textarea
              value={item.name}
              onChange={(e) => update(idx, { name: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <button type="button" onClick={() => onChange(items.filter((_, j) => j !== idx))} className="mt-2 text-xs text-red-600 hover:underline">
              Remove text
            </button>
          </div>
        ) : (
          <div key={idx} className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="mb-3 text-sm font-bold text-[var(--mp-navy)]">Product / Service</p>
            <div className="grid gap-3 sm:grid-cols-12">
              <input
                placeholder="Name"
                value={item.name}
                onChange={(e) => update(idx, { name: e.target.value })}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-4"
              />
              <input
                type="number"
                min={0}
                step={0.01}
                value={item.qty}
                onChange={(e) => update(idx, { qty: parseFloat(e.target.value) || 0 })}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
              />
              <input
                type="number"
                min={0}
                step={0.01}
                value={item.unitPrice}
                onChange={(e) => update(idx, { unitPrice: parseFloat(e.target.value) || 0 })}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-3"
              />
              <div className="flex items-center justify-end text-sm font-semibold sm:col-span-3">
                {formatCurrency(item.qty * item.unitPrice)}
              </div>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_80px]">
              <textarea
                placeholder="Description"
                value={item.description ?? ""}
                onChange={(e) => update(idx, { description: e.target.value })}
                rows={3}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <div className="flex h-20 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-400">
                <ImageIcon size={24} />
              </div>
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={!!item.optional} onChange={(e) => update(idx, { optional: e.target.checked })} />
              Mark as optional
            </label>
            <button type="button" onClick={() => onChange(items.filter((_, j) => j !== idx))} className="mt-2 text-xs text-red-600 hover:underline">
              Remove line
            </button>
          </div>
        ),
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChange([...items, { ...EMPTY_LINE_ITEM }])}
          className="rounded-lg bg-[var(--mp-orange)] px-4 py-2 text-sm font-bold text-white"
        >
          <Plus size={14} className="mr-1 inline" />
          Add Line Item
        </button>
        <button
          type="button"
          onClick={() => onChange([...items, { name: "", qty: 0, unitPrice: 0, isText: true }])}
          className="rounded-lg border border-[var(--mp-orange)] px-4 py-2 text-sm font-bold text-[var(--mp-orange)]"
        >
          Add Text
        </button>
      </div>
    </div>
  );
}
