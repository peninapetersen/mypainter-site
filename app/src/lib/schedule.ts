import { combineDateAndTime, defaultEndTime, endOfMonth, endOfWeek, isoDate, startOfMonth, startOfWeek } from "@/lib/schedule-dates";
import { listScheduleEventsInRange } from "@/lib/schedule-events";
import { listJobs } from "@/lib/jobs";
import { listRequests } from "@/lib/requests";
import { getWorkSettings } from "@/lib/work-settings";
import { renderVisitTitle } from "@/lib/visit-title";
import { clientDisplayName } from "@/lib/client-display";
import { listClients } from "@/lib/clients";
import type { CalendarEvent, CalendarEventKind, Job, JobVisit, Request } from "@/types/entities";

function visitToEvent(
  job: Job,
  visit: JobVisit,
  idx: number,
  clientName: string,
  template: string,
): CalendarEvent | null {
  if (visit.scheduleLater || !visit.date) return null;
  const start = visit.anytime
    ? combineDateAndTime(visit.date, "09:00")
    : combineDateAndTime(visit.date, visit.startTime || "09:00");
  const end = visit.anytime
    ? combineDateAndTime(visit.date, "17:00")
    : combineDateAndTime(visit.date, visit.endTime || defaultEndTime(visit.startTime || "09:00"));
  const title =
    visit.title.trim() ||
    renderVisitTitle(template, {
      clientName,
      jobTitle: job.title,
      jobNumber: job.number,
    });
  return {
    id: `job:${job.id}:visit:${idx}`,
    kind: "job_visit",
    title,
    start,
    end,
    allDay: visit.anytime,
    personal: false,
    assignedTo: visit.assignedTo,
    clientId: job.client_id,
    href: `/leads/${job.id}`,
  };
}

function requestToEvent(req: Request, clientName: string): CalendarEvent | null {
  if (!req.assessment_at) return null;
  const start = new Date(req.assessment_at);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return {
    id: `request:${req.id}`,
    kind: "request",
    title: req.title || `Assessment — ${clientName || "Request"}`,
    start,
    end,
    allDay: false,
    personal: false,
    clientId: req.client_id,
    href: `/requests/${req.id}`,
  };
}

export function eventColor(kind: CalendarEventKind, personal: boolean): string {
  if (personal) return "bg-violet-600 border-violet-700";
  switch (kind) {
    case "job_visit":
      return "bg-[var(--mp-navy)] border-[var(--mp-navy)]";
    case "request":
      return "bg-sky-600 border-sky-700";
    case "task":
      return "bg-slate-600 border-slate-700";
    default:
      return "bg-violet-600 border-violet-700";
  }
}

export function rangeForView(view: "week" | "day" | "month", anchor: Date): { start: Date; end: Date } {
  if (view === "day") {
    const start = new Date(anchor);
    start.setHours(0, 0, 0, 0);
    const end = new Date(anchor);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }
  if (view === "month") {
    const gridStart = startOfWeek(startOfMonth(anchor));
    const gridEnd = endOfWeek(endOfMonth(anchor));
    gridEnd.setHours(23, 59, 59, 999);
    return { start: gridStart, end: gridEnd };
  }
  const start = startOfWeek(anchor);
  start.setHours(0, 0, 0, 0);
  const end = endOfWeek(anchor);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export async function fetchCalendarEvents(rangeStart: Date, rangeEnd: Date): Promise<CalendarEvent[]> {
  const [jobs, requests, clients, settings, stored] = await Promise.all([
    listJobs(),
    listRequests(),
    listClients(),
    getWorkSettings().catch(() => null),
    listScheduleEventsInRange(rangeStart.toISOString(), rangeEnd.toISOString()).catch(() => []),
  ]);

  const clientMap = new Map(clients.map((c) => [c.id, clientDisplayName(c)]));
  const template = settings?.visit_title_template ?? "{{CLIENT_NAME}} - {{JOB_TITLE}}";
  const events: CalendarEvent[] = [];

  for (const job of jobs) {
    const clientName = job.client_id ? clientMap.get(job.client_id) ?? "" : "";
    job.visits.forEach((visit, idx) => {
      const ev = visitToEvent(job, visit, idx, clientName, template);
      if (ev && ev.end >= rangeStart && ev.start <= rangeEnd) events.push(ev);
    });
  }

  for (const req of requests) {
    const clientName = req.client_id ? clientMap.get(req.client_id) ?? "" : "";
    const ev = requestToEvent(req, clientName);
    if (ev && ev.end >= rangeStart && ev.start <= rangeEnd) events.push(ev);
  }

  for (const row of stored) {
    const start = new Date(row.starts_at);
    const end = row.ends_at ? new Date(row.ends_at) : new Date(start.getTime() + 60 * 60 * 1000);
    if (end < rangeStart || start > rangeEnd) continue;
    const kind: CalendarEventKind = row.kind === "personal" ? "personal" : "task";
    events.push({
      id: `schedule:${row.id}`,
      kind,
      title: row.title,
      start,
      end,
      allDay: row.all_day,
      personal: row.kind === "personal",
      assignedTo: row.assigned_to,
      clientId: row.client_id,
    });
  }

  return events.sort((a, b) => a.start.getTime() - b.start.getTime());
}

export function filterEvents(events: CalendarEvent[], typeFilter: string): CalendarEvent[] {
  if (typeFilter === "all") return events;
  if (typeFilter === "job") return events.filter((e) => e.kind === "job_visit");
  if (typeFilter === "request") return events.filter((e) => e.kind === "request");
  if (typeFilter === "task") return events.filter((e) => e.kind === "task");
  if (typeFilter === "personal") return events.filter((e) => e.personal);
  return events;
}

export function eventsOnDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  const key = isoDate(day);
  return events.filter((e) => isoDate(e.start) === key || (e.start <= day && e.end >= day));
}
