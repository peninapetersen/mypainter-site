import { Trash2 } from "lucide-react";

export function InvoiceClientMessageSection({
  message,
  onChange,
  onRemove,
}: {
  message: string;
  onChange: (message: string) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-[var(--mp-navy)]">Client Message</h2>
        <button type="button" onClick={onRemove} className="text-slate-400 hover:text-red-600" aria-label="Remove section">
          <Trash2 size={18} />
        </button>
      </div>
      <textarea
        value={message}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        placeholder="Message"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
    </div>
  );
}
