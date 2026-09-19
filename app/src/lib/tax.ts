import { GST_RATE } from "@/lib/nz";
import type { WorkSettings } from "@/types/entities";

export type TaxMode = "exclusive" | "inclusive";

export function resolveGstRate(settings?: Pick<WorkSettings, "gst_rate"> | null): number {
  const rate = Number(settings?.gst_rate);
  return Number.isFinite(rate) && rate >= 0 ? rate : GST_RATE;
}

export function gstRatePercent(settings?: Pick<WorkSettings, "gst_rate"> | null): number {
  return Math.round(resolveGstRate(settings) * 1000) / 10;
}

export function formatGstLabel(settings?: Pick<WorkSettings, "gst_rate"> | null): string {
  const pct = gstRatePercent(settings);
  return Number.isInteger(pct) ? `GST (${pct}%)` : `GST (${pct.toFixed(1)}%)`;
}
