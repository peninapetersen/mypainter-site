import { Trash2 } from "lucide-react";

type Props = {
  label: string;
  deleting?: boolean;
  onDelete: () => Promise<void>;
};

export function ListDeleteButton({ label, deleting, onDelete }: Props) {
  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Delete ${label}? This cannot be undone.`)) return;
    await onDelete();
  }

  return (
    <button
      type="button"
      title={`Delete ${label}`}
      disabled={deleting}
      onClick={(e) => void handleClick(e)}
      className="inline-flex rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
    >
      <Trash2 size={16} />
    </button>
  );
}
