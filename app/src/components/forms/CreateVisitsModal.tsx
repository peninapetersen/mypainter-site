import { useState } from "react";
import { X } from "lucide-react";
import { todayIsoDate } from "@/lib/line-items";
import { datesBetween } from "@/lib/visit-title";

export function CreateVisitsModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (dates: string[], scheduleLater: boolean) => void;
}) {
  const [mode, setMode] = useState<"range" | "single">("single");
  const [singleDate, setSingleDate] = useState(todayIsoDate());
  const [rangeStart, setRangeStart] = useState(todayIsoDate());
  const [rangeEnd, setRangeEnd] = useState(todayIsoDate());
  const [scheduleLater, setScheduleLater] = useState(false);

  if (!open) return null;

  function handleCreate() {
    const dates =
      mode === "single"
        ? [singleDate]
        : datesBetween(rangeStart, rangeEnd);
    if (!dates.length) return;
    onCreate(dates, scheduleLater);
    onClose();
  }

  const count = mode === "single" ? 1 : datesBetween(rangeStart, rangeEnd).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-bold text-[var(--mp-navy)]">Create Visits</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4 p-5">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode("single")}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                mode === "single" ? "bg-[var(--mp-orange)] text-white" : "border border-slate-300 text-slate-600"
              }`}
            >
              Single date
            </button>
            <button
              type="button"
              onClick={() => setMode("range")}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                mode === "range" ? "bg-[var(--mp-orange)] text-white" : "border border-slate-300 text-slate-600"
              }`}
            >
              Select range
            </button>
            <span className="ml-auto text-xs text-slate-500">{count}/20 selected</span>
          </div>

          {mode === "single" ? (
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-semibold text-slate-500">Select date</span>
              <input
                type="date"
                value={singleDate}
                onChange={(e) => setSingleDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block text-xs font-semibold text-slate-500">From</span>
                <input
                  type="date"
                  value={rangeStart}
                  onChange={(e) => setRangeStart(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-xs font-semibold text-slate-500">To</span>
                <input
                  type="date"
                  value={rangeEnd}
                  onChange={(e) => setRangeEnd(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
            </div>
          )}

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={scheduleLater} onChange={(e) => setScheduleLater(e.target.checked)} />
            Schedule later
          </label>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={count === 0}
            className="rounded-lg bg-[var(--mp-orange)] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
