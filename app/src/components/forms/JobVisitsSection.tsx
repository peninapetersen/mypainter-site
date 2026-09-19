import { useState } from "react";
import { Calendar, ChevronDown, ClipboardList, MoreHorizontal, Pencil } from "lucide-react";
import { defaultJobVisit } from "@/lib/job-defaults";
import { formatDateShort } from "@/lib/nz";
import type { JobVisit } from "@/types/entities";

export function JobVisitsSection({
  visits,
  scheduleMode,
  onScheduleModeChange,
  onChange,
}: {
  visits: JobVisit[];
  scheduleMode: "one-off" | "recurring";
  onScheduleModeChange: (mode: "one-off" | "recurring") => void;
  onChange: (visits: JobVisit[]) => void;
}) {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({ 0: true });

  function updateVisit(i: number, patch: Partial<JobVisit>) {
    onChange(visits.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));
  }

  function addVisit() {
    onChange([...visits, defaultJobVisit()]);
    setExpanded((e) => ({ ...e, [visits.length]: true }));
  }

  function resetVisits() {
    onChange([defaultJobVisit()]);
    setExpanded({ 0: true });
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-lg font-bold text-[var(--mp-navy)]">Visits</h2>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 px-4 py-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Schedule</p>
          <div className="mt-1 flex rounded-lg border border-slate-300 p-0.5">
            <button
              type="button"
              onClick={() => onScheduleModeChange("one-off")}
              className={`rounded-md px-3 py-1 text-sm font-semibold ${
                scheduleMode === "one-off" ? "border border-[var(--mp-orange)] text-[var(--mp-orange)]" : "text-slate-600"
              }`}
            >
              One-off
            </button>
            <button
              type="button"
              onClick={() => onScheduleModeChange("recurring")}
              className={`rounded-md px-3 py-1 text-sm font-semibold ${
                scheduleMode === "recurring" ? "border border-[var(--mp-orange)] text-[var(--mp-orange)]" : "text-slate-600"
              }`}
            >
              Recurring
            </button>
          </div>
        </div>
        <p className="text-sm text-slate-600">
          {visits.length} visit{visits.length === 1 ? "" : "s"}
        </p>
        <button
          type="button"
          className="ml-auto flex items-center gap-1 rounded-lg bg-[var(--mp-orange)] px-3 py-2 text-sm font-bold text-white"
        >
          <Pencil size={14} />
          Create Visits
        </button>
      </div>

      <div className="space-y-4 p-4">
        {visits.map((visit, idx) => {
          const open = expanded[idx] !== false;
          const { month, day } = formatDateShort(visit.date);

          return (
            <div key={idx} className="flex gap-4">
              <div className="w-12 shrink-0 pt-2 text-center">
                <p className="text-xs font-semibold text-slate-500">{month}</p>
                <p className="text-2xl font-bold text-[var(--mp-navy)]">{day}</p>
              </div>
              <div className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white">
                <div className="flex items-start justify-between border-b border-slate-100 px-4 py-2">
                  <button
                    type="button"
                    onClick={() => setExpanded((e) => ({ ...e, [idx]: !open }))}
                    className="text-slate-400"
                  >
                    <ChevronDown size={18} className={open ? "" : "-rotate-90"} />
                  </button>
                  <button type="button" className="text-slate-400">
                    <MoreHorizontal size={18} />
                  </button>
                </div>
                {open && (
                  <div className="space-y-4 p-4">
                    <div>
                      <input
                        placeholder="Title"
                        value={visit.title}
                        onChange={(e) => updateVisit(idx, { title: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />
                      <p className="mt-1 text-xs text-slate-500">
                        Leave title blank to use default title from{" "}
                        <button type="button" className="font-semibold text-[var(--mp-orange)] underline">
                          Settings
                        </button>
                      </p>
                    </div>
                    <label className="block text-sm">
                      <span className="mb-1 block text-xs font-semibold text-slate-500">Date</span>
                      <div className="relative">
                        <input
                          type="date"
                          value={visit.date}
                          onChange={(e) => updateVisit(idx, { date: e.target.value })}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-10 text-sm"
                        />
                        <Calendar size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      </div>
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={visit.scheduleLater}
                        onChange={(e) => updateVisit(idx, { scheduleLater: e.target.checked })}
                      />
                      Schedule later
                    </label>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block text-sm">
                        <span className="mb-1 block text-xs font-semibold text-slate-500">Start time</span>
                        <input
                          type="time"
                          value={visit.startTime}
                          disabled={visit.anytime}
                          onChange={(e) => updateVisit(idx, { startTime: e.target.value })}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
                        />
                      </label>
                      <label className="block text-sm">
                        <span className="mb-1 block text-xs font-semibold text-slate-500">End time</span>
                        <input
                          type="time"
                          value={visit.endTime}
                          disabled={visit.anytime}
                          onChange={(e) => updateVisit(idx, { endTime: e.target.value })}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
                        />
                      </label>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={visit.anytime}
                        onChange={(e) => updateVisit(idx, { anytime: e.target.checked })}
                      />
                      Anytime
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1 block text-xs font-semibold text-slate-500">Assigned</span>
                      <input
                        value={visit.assignedTo}
                        onChange={(e) => updateVisit(idx, { assignedTo: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1 block text-xs font-semibold text-slate-500">Visit instructions</span>
                      <textarea
                        value={visit.instructions}
                        onChange={(e) => updateVisit(idx, { instructions: e.target.value })}
                        rows={3}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700">
              <ClipboardList size={20} />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--mp-navy)]">Capture on-site details</p>
              <p className="mt-1 text-sm text-slate-600">Attach custom-built checklists so that nothing gets missed</p>
              <button type="button" className="mt-2 text-sm font-semibold text-[var(--mp-orange)] underline">
                Create a Checklist
              </button>
            </div>
          </div>
          <label className="mt-4 flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={visits.some((v) => v.emailTeam)}
              onChange={(e) => onChange(visits.map((v) => ({ ...v, emailTeam: e.target.checked })))}
            />
            Email team about assignment
          </label>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={addVisit}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-[var(--mp-navy)]"
            >
              Add a Visit
            </button>
            <button
              type="button"
              onClick={resetVisits}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-[var(--mp-navy)]"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
