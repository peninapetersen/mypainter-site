import { Eye } from "lucide-react";
import { formatCurrency } from "@/lib/nz";

export function QuoteTotalsPanel({
  subtotal,
  discount,
  gst,
  total,
  gstRegistered,
  showDiscount,
  showTax,
  onToggleDiscount,
  onToggleTax,
  onDiscountChange,
}: {
  subtotal: number;
  discount: number;
  gst: number;
  total: number;
  gstRegistered: boolean;
  showDiscount: boolean;
  showTax: boolean;
  onToggleDiscount: () => void;
  onToggleTax: () => void;
  onDiscountChange: (n: number) => void;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="flex items-start gap-2 text-sm text-slate-600">
        <Eye size={16} className="mt-0.5 shrink-0" />
        <span>
          Client view{" "}
          <button type="button" className="font-semibold text-[var(--mp-orange)] underline">
            Change
          </button>
        </span>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between font-semibold text-[var(--mp-navy)]">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
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
            <span>GST (15%)</span>
            <span>{formatCurrency(gst)}</span>
          </div>
        ) : (
          <button type="button" onClick={onToggleTax} className="font-semibold text-[var(--mp-orange)] underline">
            Add Tax
          </button>
        )}
        <div className="flex justify-between border-t border-slate-200 pt-2 text-lg font-bold text-[var(--mp-navy)]">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
        <button type="button" className="block w-full text-right text-sm font-semibold text-[var(--mp-orange)] underline">
          Add Deposit or Payment Schedule
        </button>
      </div>
    </div>
  );
}
