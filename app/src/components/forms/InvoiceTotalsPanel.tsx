import { Eye } from "lucide-react";
import { formatCurrency } from "@/lib/nz";

export function InvoiceTotalsPanel({
  subtotal,
  discount,
  gst,
  total,
  balance,
  gstRegistered,
  showDiscount,
  showTax,
  onToggleDiscount,
  onToggleTax,
  onDiscountChange,
  gstLabel = "GST (15%)",
}: {
  subtotal: number;
  discount: number;
  gst: number;
  total: number;
  balance: number;
  gstRegistered: boolean;
  showDiscount: boolean;
  showTax: boolean;
  onToggleDiscount: () => void;
  onToggleTax: () => void;
  onDiscountChange: (n: number) => void;
  gstLabel?: string;
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
            <span>{gstLabel}</span>
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
        <div className="flex justify-between rounded-lg bg-[#faf8f5] px-3 py-2 font-bold text-[var(--mp-navy)]">
          <span>Invoice balance</span>
          <span>{formatCurrency(balance)}</span>
        </div>
      </div>
    </div>
  );
}
