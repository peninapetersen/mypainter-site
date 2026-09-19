import { Link } from "react-router-dom";
import {
  HOUR_END,
  HOUR_HEIGHT_PX,
  HOUR_START,
  eventHeightPx,
  eventTopPx,
  formatDayLabel,
  isSameDay,
  isToday,
  weekDays,
} from "@/lib/schedule-dates";
import { eventColor } from "@/lib/schedule";
import type { CalendarEvent } from "@/types/entities";

export function ScheduleWeekView({
  anchor,
  events,
  onSlotClick,
}: {
  anchor: Date;
  events: CalendarEvent[];
  onSlotClick?: (day: Date, hour: number) => void;
}) {
  const days = weekDays(anchor);
  const hours = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i);

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <div className="min-w-[720px]">
        <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-slate-200">
          <div />
          {days.map((d) => (
            <div
              key={d.toISOString()}
              className={`border-l border-slate-100 px-2 py-2 text-center text-sm ${
                isToday(d) ? "bg-orange-50 font-bold text-[var(--mp-orange)]" : "text-slate-700"
              }`}
            >
              {formatDayLabel(d)}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-[56px_repeat(7,1fr)]">
          <div className="relative">
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

          {days.map((day) => {
            const dayEvents = events.filter((e) => isSameDay(e.start, day));
            return (
              <div key={day.toISOString()} className="relative border-l border-slate-100">
                {hours.map((h) => (
                  <button
                    key={h}
                    type="button"
                    style={{ height: HOUR_HEIGHT_PX }}
                    className="block w-full border-b border-slate-50 hover:bg-orange-50/40"
                    onClick={() => onSlotClick?.(day, h)}
                    aria-label={`Create at ${formatDayLabel(day)} ${h}:00`}
                  />
                ))}
                {dayEvents.map((ev) => {
                  const inner = (
                    <div
                      className={`absolute left-0.5 right-0.5 overflow-hidden rounded border px-1 py-0.5 text-[10px] font-semibold leading-tight text-white shadow-sm ${eventColor(ev.kind, ev.personal)}`}
                      style={{
                        top: eventTopPx(ev.start),
                        height: eventHeightPx(ev.start, ev.end),
                        zIndex: 10,
                      }}
                      title={ev.title}
                    >
                      {!ev.allDay && (
                        <span className="opacity-80">
                          {ev.start.toLocaleTimeString("en-NZ", { hour: "numeric", minute: "2-digit" })}{" "}
                        </span>
                      )}
                      {ev.title}
                      {ev.personal && <span className="ml-1 opacity-75">· Personal</span>}
                    </div>
                  );
                  return ev.href ? (
                    <Link key={ev.id} to={ev.href}>
                      {inner}
                    </Link>
                  ) : (
                    <div key={ev.id}>{inner}</div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
