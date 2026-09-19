import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { ScheduleCreateModal, slotTimeFromClick } from "@/components/schedule/ScheduleCreateModal";
import { ScheduleDayView } from "@/components/schedule/ScheduleDayView";
import { ScheduleMonthView } from "@/components/schedule/ScheduleMonthView";
import { ScheduleWeekView } from "@/components/schedule/ScheduleWeekView";
import { useErrorBanner } from "@/context/ErrorBannerContext";
import { addDays, addMonths, addWeeks, formatWeekRange } from "@/lib/schedule-dates";
import { fetchCalendarEvents, filterEvents, rangeForView } from "@/lib/schedule";
import type { CalendarEvent } from "@/types/entities";

type View = "week" | "day" | "month";

const TYPE_FILTERS = [
  { id: "all", label: "All" },
  { id: "job", label: "Jobs" },
  { id: "request", label: "Requests" },
  { id: "task", label: "Tasks" },
  { id: "personal", label: "Personal" },
];

export function SchedulePage() {
  const { showError } = useErrorBanner();
  const [view, setView] = useState<View>("week");
  const [anchor, setAnchor] = useState(() => new Date());
  const [typeFilter, setTypeFilter] = useState("all");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [createDate, setCreateDate] = useState<Date | undefined>();
  const [createTime, setCreateTime] = useState<string | undefined>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { start, end } = rangeForView(view, anchor);
      const raw = await fetchCalendarEvents(start, end);
      setEvents(filterEvents(raw, typeFilter));
    } catch (e) {
      showError(e instanceof Error ? e.message : "Could not load schedule");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [anchor, view, typeFilter, showError]);

  useEffect(() => {
    load();
  }, [load]);

  function goToday() {
    setAnchor(new Date());
  }

  function goPrev() {
    if (view === "week") setAnchor((d) => addWeeks(d, -1));
    else if (view === "day") setAnchor((d) => addDays(d, -1));
    else setAnchor((d) => addMonths(d, -1));
  }

  function goNext() {
    if (view === "week") setAnchor((d) => addWeeks(d, 1));
    else if (view === "day") setAnchor((d) => addDays(d, 1));
    else setAnchor((d) => addMonths(d, 1));
  }

  function openCreate(day?: Date, hour?: number) {
    setCreateDate(day ?? anchor);
    setCreateTime(hour !== undefined ? slotTimeFromClick(hour) : undefined);
    setCreateOpen(true);
  }

  const titleLabel =
    view === "week"
      ? formatWeekRange(anchor)
      : view === "day"
        ? new Intl.DateTimeFormat("en-NZ", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(
            anchor,
          )
        : new Intl.DateTimeFormat("en-NZ", { month: "long", year: "numeric" }).format(anchor);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--mp-navy)]">Schedule</h1>
          <p className="text-sm text-slate-500">Jobs, requests, tasks, and personal time.</p>
        </div>
        <button
          type="button"
          onClick={() => openCreate()}
          className="flex items-center gap-1 rounded-lg bg-[var(--mp-orange)] px-4 py-2 text-sm font-bold text-white"
        >
          <Plus size={16} />
          New
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white p-2">
        <button type="button" onClick={goToday} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold">
          Today
        </button>
        <button type="button" onClick={goPrev} className="rounded p-1 text-slate-600 hover:bg-slate-100" aria-label="Previous">
          <ChevronLeft size={20} />
        </button>
        <button type="button" onClick={goNext} className="rounded p-1 text-slate-600 hover:bg-slate-100" aria-label="Next">
          <ChevronRight size={20} />
        </button>
        <span className="min-w-[140px] text-sm font-bold text-slate-800">{titleLabel}</span>

        <select
          value={view}
          onChange={(e) => setView(e.target.value as View)}
          className="ml-auto rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
        >
          <option value="week">Week</option>
          <option value="day">Day</option>
          <option value="month">Month</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
        >
          {TYPE_FILTERS.map((f) => (
            <option key={f.id} value={f.id}>
              Type · {f.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-slate-500">Loading schedule…</p>
      ) : view === "week" ? (
        <ScheduleWeekView anchor={anchor} events={events} onSlotClick={(day, hour) => openCreate(day, hour)} />
      ) : view === "day" ? (
        <ScheduleDayView anchor={anchor} events={events} onSlotClick={(day, hour) => openCreate(day, hour)} />
      ) : (
        <ScheduleMonthView
          anchor={anchor}
          events={events}
          onDayClick={(day) => {
            setAnchor(day);
            setView("day");
          }}
        />
      )}

      <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-[var(--mp-navy)]" /> Job visit
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-sky-600" /> Request assessment
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-slate-600" /> Task
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-violet-600" /> Personal
        </span>
      </div>

      <ScheduleCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSaved={load}
        defaultDate={createDate}
        defaultStartTime={createTime}
      />
    </div>
  );
}
