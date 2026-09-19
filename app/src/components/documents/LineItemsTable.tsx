import { formatCurrency } from "@/lib/nz";
import type { LineItem } from "@/types/entities";

export function LineItemsTable({ items }: { items: LineItem[] }) {
  const billable = items.filter((li) => !li.isText);
  const textBlocks = items.filter((li) => li.isText);

  return (
    <div className="space-y-4">
      {billable.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-right w-16">Qty</th>
                <th className="px-4 py-3 text-right w-24">Rate</th>
                <th className="px-4 py-3 text-right w-28">Amount</th>
              </tr>
            </thead>
            <tbody>
              {billable.map((item, i) => (
                <tr key={i} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800">{item.name || "—"}</p>
                    {item.description && <p className="mt-0.5 text-xs text-slate-500">{item.description}</p>}
                    {item.optional && <p className="mt-0.5 text-xs italic text-slate-400">Optional</p>}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{item.qty}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(item.unitPrice)}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-[var(--mp-navy)]">
                    {formatCurrency(item.qty * item.unitPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {textBlocks.map((block, i) => (
        <p key={`text-${i}`} className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
          {block.name}
        </p>
      ))}
    </div>
  );
}
