import { formatCurrency } from "@/lib/nz";

export function DocumentTotals({
  subtotal,
  discount,
  gst,
  total,
  balance,
  gstRegistered,
}: {
  subtotal: number;
  discount: number;
  gst: number;
  total: number;
  balance?: number;
  gstRegistered: boolean;
}) {
  return (
    <div className="ml-auto w-full max-w-xs space-y-2 text-sm">
      <div className="flex justify-between text-slate-600">
        <span>Subtotal</span>
        <span className="tabular-nums">{formatCurrency(subtotal)}</span>
      </div>
      {discount > 0 && (
        <div className="flex justify-between text-slate-600">
          <span>Discount</span>
          <span className="tabular-nums">−{formatCurrency(discount)}</span>
        </div>
      )}
      {gstRegistered && gst > 0 && (
        <div className="flex justify-between text-slate-600">
          <span>GST (15%)</span>
          <span className="tabular-nums">{formatCurrency(gst)}</span>
        </div>
      )}
      <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-[var(--mp-navy)]">
        <span>{balance !== undefined ? "Total" : "Total due"}</span>
        <span className="tabular-nums">{formatCurrency(total)}</span>
      </div>
      {balance !== undefined && balance !== total && (
        <div className="flex justify-between rounded-lg bg-amber-50 px-3 py-2 font-bold text-amber-900">
          <span>Balance due</span>
          <span className="tabular-nums">{formatCurrency(balance)}</span>
        </div>
      )}
    </div>
  );
}
