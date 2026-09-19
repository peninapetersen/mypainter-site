export const GST_RATE = 0.15;

export function formatCurrency(amount: number | string): string {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
  }).format(Number.isFinite(n) ? n : 0);
}

function parseNzDate(d: Date | string): Date {
  if (d instanceof Date) return d;
  const trimmed = d.trim();
  if (!trimmed) return new Date(Number.NaN);
  // Date-only (YYYY-MM-DD) — noon local avoids DST edge cases
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return new Date(`${trimmed}T12:00:00`);
  return new Date(trimmed);
}

function formatNzDate(d: Date | string | null | undefined, options: Intl.DateTimeFormatOptions): string {
  if (!d) return "";
  const date = typeof d === "string" ? parseNzDate(d) : d;
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-NZ", options).format(date);
}

export function formatDate(d: Date | string | null | undefined): string {
  return formatNzDate(d, { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatDateLong(d: Date | string | null | undefined): string {
  return formatNzDate(d, { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateShort(d: Date | string | null | undefined): { month: string; day: string } {
  if (!d) return { month: "", day: "" };
  const date = typeof d === "string" ? parseNzDate(d) : d;
  if (Number.isNaN(date.getTime())) return { month: "", day: "" };
  const parts = new Intl.DateTimeFormat("en-NZ", { month: "short", day: "numeric" }).formatToParts(date);
  return {
    month: parts.find((p) => p.type === "month")?.value ?? "",
    day: parts.find((p) => p.type === "day")?.value ?? "",
  };
}
