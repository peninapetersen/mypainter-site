import { FormEvent } from "react";
import { MapPin, X } from "lucide-react";
import type { JobOn } from "@/types/entities";

export function JobsOnDetailsModal({
  open,
  form,
  onChange,
  onClose,
  onSave,
  saving,
}: {
  open: boolean;
  form: {
    title: string;
    site_address: string;
    notes: string;
    status: JobOn["status"];
    number: string;
  };
  onChange: (patch: Partial<typeof form>) => void;
  onClose: () => void;
  onSave: (e?: FormEvent) => void;
  saving: boolean;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={onClose} role="presentation">
      <div
        className="flex max-h-[90vh] w-full max-w-md flex-col rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="jobs-on-details-title"
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{form.number}</p>
            <h2 id="jobs-on-details-title" className="text-lg font-bold text-[var(--mp-navy)]">
              Job details
            </h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form className="space-y-3 overflow-y-auto px-4 py-4" onSubmit={onSave}>
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-semibold text-slate-500">Title</span>
            <input
              value={form.title}
              onChange={(e) => onChange({ title: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-500">
              <MapPin size={12} /> Site address
            </span>
            <input
              value={form.site_address}
              onChange={(e) => onChange({ site_address: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-semibold text-slate-500">Job notes</span>
            <textarea
              value={form.notes}
              onChange={(e) => onChange({ notes: e.target.value })}
              rows={4}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-semibold text-slate-500">Status</span>
            <select
              value={form.status}
              onChange={(e) => onChange({ status: e.target.value as JobOn["status"] })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="draft">Draft</option>
              <option value="active">Active — work in progress</option>
              <option value="completed">Completed — ready to invoice</option>
            </select>
          </label>
        </form>

        <div className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => onSave()}
            className="rounded-lg bg-[var(--mp-orange)] px-4 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save details"}
          </button>
        </div>
      </div>
    </div>
  );
}
