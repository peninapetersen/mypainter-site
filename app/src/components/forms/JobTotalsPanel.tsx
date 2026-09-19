import { formatCurrency } from "@/lib/nz";
import { calcQuoteTotals } from "@/lib/line-items";

export function JobTotalsPanel({
  subtotalPrice,
  subtotalCost,
  discount,
  gstRegistered,
  showDiscount,
  showTax,
  onToggleDiscount,
  onToggleTax,
  onDiscountChange,
}: {
  subtotalPrice: number;
  subtotalCost: number;
  discount: number;
  gstRegistered: boolean;
  showDiscount: boolean;
  showTax: boolean;
  onToggleDiscount: () => void;
  onToggleTax: () => void;
  onDiscountChange: (n: number) => void;
}) {
  const { gst, total } = calcQuoteTotals(subtotalPrice, discount, gstRegistered);

  return (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between font-semibold text-[var(--mp-navy)]">
        <span>Subtotal</span>
        <span>{formatCurrency(subtotalPrice)}</span>
      </div>
      {showDiscount ? (
        <div className="flex items-center justify-between gap-2">
          <span>Discount</span>
          <input
            type="number"
            min={0}
            step={0.01}
            value={discount}
            onChange={(e) => onDiscountChange(parseFloat(e.target.value) || 0)}
            className="w-24 rounded border border-slate-300 px-2 py-1 text-right text-sm"
          />
        </div>
      ) : (
        <button type="button" onClick={onToggleDiscount} className="font-semibold text-[var(--mp-orange)] underline">
          Add Discount
        </button>
      )}
      {showTax || gstRegistered ? (
        <div className="flex justify-between">
          <span>Tax</span>
          <span>{formatCurrency(gst)}</span>
        </div>
      ) : (
        <button type="button" onClick={onToggleTax} className="font-semibold text-[var(--mp-orange)] underline">
          Add Tax
        </button>
      )}
      <div className="flex justify-between border-t border-slate-200 pt-2 text-lg font-bold text-[var(--mp-navy)]">
        <span>Total price</span>
        <span>{formatCurrency(total)}</span>
      </div>
      <div className="flex justify-between text-slate-600">
        <span>Total cost</span>
        <span>{formatCurrency(subtotalCost)}</span>
      </div>
    </div>
  );
}
