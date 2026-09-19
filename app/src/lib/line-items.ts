import { GST_RATE } from "@/lib/nz";
import type { LineItem } from "@/types/entities";

export function calcLineSubtotal(items: LineItem[]): number {
  return items.reduce((sum, item) => {
    if (item.isText || item.optional) return sum;
    return sum + item.qty * item.unitPrice;
  }, 0);
}

export function calcLineCost(items: LineItem[]): number {
  return items.reduce((sum, item) => sum + item.qty * (item.unitCost ?? 0), 0);
}

export function calcQuoteTotals(
  subtotal: number,
  discount: number,
  gstRegistered: boolean,
  gstRate: number = GST_RATE,
) {
  const afterDiscount = Math.max(0, subtotal - discount);
  const rate = Number.isFinite(gstRate) && gstRate >= 0 ? gstRate : GST_RATE;
  const gst = gstRegistered ? afterDiscount * rate : 0;
  const total = afterDiscount + gst;
  return { subtotal, discount, gst, total };
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysIsoDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export const DEFAULT_QUOTE_TERMS =
  "This quote is valid for the next 30 days, after which values may be subject to change.";

export const EMPTY_LINE_ITEM: LineItem = { name: "", qty: 1, unitPrice: 0 };
