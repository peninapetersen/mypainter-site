import { Plus, Trash2, X } from "lucide-react";
import { newChecklistItem } from "@/lib/job-defaults";
import type { JobChecklist } from "@/types/entities";

export function JobChecklistModal({
  open,
  checklist,
  onChange,
  onClose,
  onDelete,
}: {
  open: boolean;
  checklist: JobChecklist | null;
  onChange: (checklist: JobChecklist) => void;
  onClose: () => void;
  onDelete?: () => void;
}) {
  if (!open || !checklist) return null;

  function update(patch: Partial<JobChecklist>) {
    onChange({ ...checklist!, ...patch });
  }

  function updateItem(itemId: string, patch: Partial<JobChecklist["items"][0]>) {
    update({
      items: checklist!.items.map((item) => (item.id === itemId ? { ...item, ...patch } : item)),
    });
  }

  function addItem() {
    update({ items: [...checklist!.items, newChecklistItem()] });
  }

  function removeItem(itemId: string) {
    const next = checklist!.items.filter((i) => i.id !== itemId);
    update({ items: next.length ? next : [newChecklistItem()] });
  }

  const doneCount = checklist.items.filter((i) => i.checked && i.label.trim()).length;
  const totalFilled = checklist.items.filter((i) => i.label.trim()).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="checklist-modal-title"
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 id="checklist-modal-title" className="text-lg font-bold text-[var(--mp-navy)]">
              Site checklist
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Changes save to this job as you type — safe to close anytime.
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-semibold text-slate-500">Checklist name</span>
            <input
              value={checklist.title}
              onChange={(e) => update({ title: e.target.value })}
              placeholder="e.g. Measure-up — interior prep"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Items</p>
              {totalFilled > 0 && (
                <p className="text-xs text-slate-500">
                  {doneCount}/{totalFilled} done
                </p>
              )}
            </div>

            {checklist.items.map((item, idx) => (
              <div key={item.id} className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={(e) => updateItem(item.id, { checked: e.target.checked })}
                    className="mt-2.5"
                    aria-label={`Mark item ${idx + 1} done`}
                  />
                  <div className="min-w-0 flex-1 space-y-2">
                    <input
                      value={item.label}
                      onChange={(e) => updateItem(item.id, { label: e.target.value })}
                      placeholder={`Item ${idx + 1} — e.g. Room sizes, surface condition`}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                    />
                    <input
                      value={item.notes}
                      onChange={(e) => updateItem(item.id, { notes: e.target.value })}
                      placeholder="Notes (optional)"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="mt-1 text-slate-400 hover:text-red-600"
                    aria-label="Remove item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addItem}
              className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 py-2 text-sm font-semibold text-[var(--mp-orange)] hover:bg-orange-50"
            >
              <Plus size={16} />
              Add item
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-5 py-4">
          {onDelete ? (
            <button type="button" onClick={onDelete} className="text-sm font-semibold text-red-600 hover:underline">
              Delete checklist
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-[var(--mp-orange)] px-5 py-2 text-sm font-bold text-white"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
