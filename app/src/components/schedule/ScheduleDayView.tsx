import { Link } from "react-router-dom";
import {
  HOUR_END,
  HOUR_HEIGHT_PX,
  HOUR_START,
  eventHeightPx,
  eventTopPx,
  formatDayLabel,
  isSameDay,
} from "@/lib/schedule-dates";
import { eventColor } from "@/lib/schedule";
import type { CalendarEvent } from "@/types/entities";

export function ScheduleDayView({
  anchor,
  events,
  onSlotClick,
}: {
  anchor: Date;
  events: CalendarEvent[];
  onSlotClick?: (day: Date, hour: number) => void;
}) {
  const hours = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i);
  const dayEvents = events.filter((e) => isSameDay(e.start, anchor));

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-2 text-sm font-bold text-slate-700">{formatDayLabel(anchor)}</div>
      <div className="grid grid-cols-[56px_1fr]">
        <div>
          {hours.map((h) => (
            <div
              key={h}
              style={{ height: HOUR_HEIGHT_PX }}
              className="border-b border-slate-100 pr-1 text-right text-[10px] text-slate-400"
            >
              {h}:00
            </div>
          ))}
        </div>
        <div className="relative border-l border-slate-100">
          {hours.map((h) => (
            <button
              key={h}
              type="button"
              style={{ height: HOUR_HEIGHT_PX }}
              className="block w-full border-b border-slate-50 hover:bg-orange-50/40"
              onClick={() => onSlotClick?.(anchor, h)}
            />
          ))}
          {dayEvents.map((ev) => {
            const block = (
              <div
                className={`absolute left-1 right-1 overflow-hidden rounded border px-2 py-1 text-xs font-semibold text-white shadow ${eventColor(ev.kind, ev.personal)}`}
                style={{ top: eventTopPx(ev.start), height: eventHeightPx(ev.start, ev.end), zIndex: 10 }}
              >
                {ev.title}
                {ev.personal && " · Personal"}
              </div>
            );
            return ev.href ? (
              <Link key={ev.id} to={ev.href}>
                {block}
              </Link>
            ) : (
              <div key={ev.id}>{block}</div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
