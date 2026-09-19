import { useState } from "react";
import { Plus } from "lucide-react";

export function RequestNotesCard({
  notes,
  onChange,
}: {
  notes: string;
  onChange: (notes: string) => void;
}) {
  const hasNotes = notes.trim().length > 0;
  const [editing, setEditing] = useState(hasNotes);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-bold text-[var(--mp-navy)]">Notes</h2>
      {!editing ? (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-4 flex w-full flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-[#faf8f5] px-6 py-10 text-center"
        >
          <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--mp-orange)] text-white">
            <Plus size={20} />
          </span>
          <span className="text-sm text-slate-500">Leave an internal note for yourself or a team member</span>
        </button>
      ) : (
        <textarea
          autoFocus={!hasNotes}
          value={notes}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          placeholder="Internal note…"
          className="mt-4 w-full rounded-lg border border-slate-200 bg-[#faf8f5] px-3 py-2 text-sm"
        />
      )}
    </div>
  );
}
