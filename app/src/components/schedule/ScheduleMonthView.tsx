import { isSameDay, isToday, monthGridDays, startOfMonth } from "@/lib/schedule-dates";
import { eventColor } from "@/lib/schedule";
import type { CalendarEvent } from "@/types/entities";

export function ScheduleMonthView({
  anchor,
  events,
  onDayClick,
}: {
  anchor: Date;
  events: CalendarEvent[];
  onDayClick?: (day: Date) => void;
}) {
  const days = monthGridDays(anchor);
  const month = startOfMonth(anchor).getMonth();

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <div className="grid min-w-[640px] grid-cols-7 border-b border-slate-200 text-center text-xs font-bold text-slate-500">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="py-2">
            {d}
          </div>
        ))}
      </div>
      <div className="grid min-w-[640px] grid-cols-7">
        {days.map((day) => {
          const inMonth = day.getMonth() === month;
          const dayEvents = events.filter((e) => isSameDay(e.start, day));
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onDayClick?.(day)}
              className={`min-h-[88px] border border-slate-100 p-1 text-left hover:bg-orange-50/30 ${
                !inMonth ? "bg-slate-50/80 text-slate-400" : ""
              }`}
            >
              <span
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                  isToday(day) ? "bg-[var(--mp-orange)] text-white" : ""
                }`}
              >
                {day.getDate()}
              </span>
              <div className="mt-1 space-y-0.5">
                {dayEvents.slice(0, 3).map((ev) => (
                  <div
                    key={ev.id}
                    className={`truncate rounded px-1 text-[9px] font-semibold text-white ${eventColor(ev.kind, ev.personal)}`}
                  >
                    {ev.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <p className="text-[9px] text-slate-500">+{dayEvents.length - 3} more</p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
