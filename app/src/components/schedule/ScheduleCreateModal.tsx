import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { ClientSelect } from "@/components/forms/ClientSelect";
import { useErrorBanner } from "@/context/ErrorBannerContext";
import { useClientsMap } from "@/hooks/useClientsMap";
import { defaultJobVisit } from "@/lib/job-defaults";
import { createJob } from "@/lib/jobs";
import { todayIsoDate } from "@/lib/line-items";
import { createRequest } from "@/lib/requests";
import { combineDateAndTime, defaultEndTime, isoDate, toTimeInputValue } from "@/lib/schedule-dates";
import { createScheduleEvent } from "@/lib/schedule-events";
import { getWorkSettings } from "@/lib/work-settings";

type Tab = "job" | "request" | "task" | "event";

export function ScheduleCreateModal({
  open,
  onClose,
  onSaved,
  defaultDate,
  defaultStartTime,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  defaultDate?: Date;
  defaultStartTime?: string;
}) {
  const { clients } = useClientsMap();
  const { showError } = useErrorBanner();
  const [tab, setTab] = useState<Tab>("job");
  const [saving, setSaving] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [assignedDefault, setAssignedDefault] = useState("Richo Petersen");

  const [clientId, setClientId] = useState("");
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [date, setDate] = useState(todayIsoDate());
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [anytime, setAnytime] = useState(false);
  const [assignedTo, setAssignedTo] = useState("Richo Petersen");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!open) return;
    getWorkSettings()
      .then((ws) => {
        setAssignedDefault(ws.invoice_reminder_assigned_to);
        setAssignedTo(ws.invoice_reminder_assigned_to);
      })
      .catch(() => {});
    if (defaultDate) setDate(isoDate(defaultDate));
    if (defaultStartTime) {
      setStartTime(defaultStartTime);
      setEndTime(defaultEndTime(defaultStartTime));
    }
  }, [open, defaultDate, defaultStartTime]);

  if (!open) return null;

  const tabs: { id: Tab; label: string }[] = [
    { id: "job", label: "Job" },
    { id: "request", label: "Request" },
    { id: "task", label: "Task" },
    { id: "event", label: "Event" },
  ];

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const startsAt = combineDateAndTime(date, anytime ? "09:00" : startTime).toISOString();
      const endsAt = combineDateAndTime(date, anytime ? "17:00" : endTime).toISOString();

      if (tab === "job") {
        await createJob({
          client_id: clientId || null,
          title,
          visits: [
            {
              ...defaultJobVisit(),
              title,
              date,
              startTime: anytime ? "" : startTime,
              endTime: anytime ? "" : endTime,
              anytime,
              assignedTo,
              instructions,
              scheduleLater: false,
            },
          ],
          notes: instructions,
        });
      } else if (tab === "request") {
        await createRequest({
          client_id: clientId || null,
          title,
          assessment_at: startsAt,
          service_details: instructions,
        });
      } else if (tab === "task") {
        await createScheduleEvent({
          kind: "task",
          title,
          description: instructions || description,
          starts_at: startsAt,
          ends_at: endsAt,
          all_day: anytime,
          assigned_to: assignedTo,
          client_id: clientId || null,
        });
      } else {
        await createScheduleEvent({
          kind: "personal",
          title,
          description,
          starts_at: startsAt,
          ends_at: endsAt,
          all_day: anytime,
          assigned_to: assignedTo,
        });
      }
      onSaved();
      onClose();
      setTitle("");
      setInstructions("");
      setDescription("");
      setClientId("");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-16">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex border-b border-slate-200">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex-1 border-b-2 px-2 py-3 text-sm font-bold ${
                tab === t.id
                  ? "border-[var(--mp-orange)] text-[var(--mp-orange)]"
                  : "border-transparent text-slate-500"
              }`}
            >
              {t.label}
            </button>
          ))}
          <button type="button" onClick={onClose} className="px-3 text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3 p-4">
          {tab === "event" && (
            <p className="rounded-lg bg-violet-50 px-3 py-2 text-xs text-violet-800">
              Personal events — e.g. lunch with wife, school pickup, appointments.
            </p>
          )}

          {tab !== "event" && (
            <ClientSelect clients={clients} value={clientId} onChange={setClientId} />
          )}

          <input
            placeholder={tab === "event" ? "Title — e.g. Lunch with wife" : "Title"}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />

          {tab === "event" ? (
            <textarea
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          ) : (
            <>
              {!showInstructions ? (
                <button
                  type="button"
                  onClick={() => setShowInstructions(true)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-600"
                >
                  + Add Instructions
                </button>
              ) : (
                <textarea
                  placeholder="Instructions"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              )}
            </>
          )}

          {tab !== "event" && (
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-semibold text-slate-500">Assigned</span>
              <input
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                placeholder={assignedDefault}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
          )}

          <div className="grid grid-cols-3 gap-2">
            <label className="col-span-3 block text-sm sm:col-span-1">
              <span className="mb-1 block text-xs font-semibold text-slate-500">Date</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-semibold text-slate-500">Start</span>
              <input
                type="time"
                value={startTime}
                disabled={anytime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                  setEndTime(defaultEndTime(e.target.value));
                }}
                className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm disabled:bg-slate-50"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-semibold text-slate-500">End</span>
              <input
                type="time"
                value={endTime}
                disabled={anytime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm disabled:bg-slate-50"
              />
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={anytime} onChange={(e) => setAnytime(e.target.checked)} />
            Anytime
          </label>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 p-4">
          <Link
            to={
              tab === "job"
                ? "/jobs/new"
                : tab === "request"
                  ? "/requests/new"
                  : tab === "task"
                    ? "/schedule"
                    : "/schedule"
            }
            className="text-sm font-semibold text-slate-600 underline"
            onClick={onClose}
          >
            More options
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[var(--mp-orange)] px-6 py-2 text-sm font-bold text-white disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}

export function slotTimeFromClick(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

export { toTimeInputValue };
