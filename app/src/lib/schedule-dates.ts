export const HOUR_START = 6;
export const HOUR_END = 19;
export const HOUR_HEIGHT_PX = 52;

export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function startOfWeek(d: Date): Date {
  const out = new Date(d);
  out.setHours(12, 0, 0, 0);
  out.setDate(out.getDate() - out.getDay());
  return out;
}

export function endOfWeek(d: Date): Date {
  const out = startOfWeek(d);
  out.setDate(out.getDate() + 6);
  return out;
}

export function weekDays(anchor: Date): Date[] {
  const start = startOfWeek(anchor);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

export function addWeeks(d: Date, n: number): Date {
  return addDays(d, n * 7);
}

export function addMonths(d: Date, n: number): Date {
  const out = new Date(d);
  out.setMonth(out.getMonth() + n);
  return out;
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1, 12);
}

export function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 12);
}

export function monthGridDays(anchor: Date): Date[] {
  const first = startOfMonth(anchor);
  const gridStart = startOfWeek(first);
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
}

export function formatWeekRange(anchor: Date): string {
  const start = startOfWeek(anchor);
  const end = endOfWeek(anchor);
  const fmt = new Intl.DateTimeFormat("en-NZ", { month: "short", day: "numeric" });
  const year = end.getFullYear();
  if (start.getMonth() === end.getMonth()) {
    return `${fmt.format(start)} – ${end.getDate()}, ${year}`;
  }
  return `${fmt.format(start)} – ${fmt.format(end)}, ${year}`;
}

export function formatDayLabel(d: Date): string {
  return new Intl.DateTimeFormat("en-NZ", { weekday: "short", day: "numeric" }).format(d);
}

export function combineDateAndTime(date: string, time: string, fallbackHour = 9): Date {
  if (!date) return new Date();
  if (!time) return new Date(`${date}T${String(fallbackHour).padStart(2, "0")}:00:00`);
  const [h, m] = time.split(":").map(Number);
  const out = new Date(`${date}T12:00:00`);
  out.setHours(h || fallbackHour, m || 0, 0, 0);
  return out;
}

export function toTimeInputValue(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function defaultEndTime(startTime: string, minutes = 60): string {
  const [h, m] = (startTime || "09:00").split(":").map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export function minutesFromMidnight(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

export function eventTopPx(start: Date): number {
  const mins = minutesFromMidnight(start) - HOUR_START * 60;
  return Math.max(0, (mins / 60) * HOUR_HEIGHT_PX);
}

export function eventHeightPx(start: Date, end: Date, minPx = 28): number {
  const mins = Math.max(15, (end.getTime() - start.getTime()) / 60000);
  return Math.max(minPx, (mins / 60) * HOUR_HEIGHT_PX);
}

export function isSameDay(a: Date, b: Date): boolean {
  return isoDate(a) === isoDate(b);
}

export function isToday(d: Date): boolean {
  return isSameDay(d, new Date());
}
