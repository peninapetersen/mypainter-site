import { Link } from "react-router-dom";
import { Pencil } from "lucide-react";
import { ListDeleteButton } from "@/components/ui/ListDeleteButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { ContactColumnDef } from "@/lib/contact-list-columns";

const inputClass =
  "w-full min-w-[6rem] rounded border border-slate-200 bg-white px-2 py-1.5 text-sm focus:border-[var(--mp-orange)] focus:outline-none focus:ring-1 focus:ring-[var(--mp-orange)]";

export type ContactTableRow = {
  id: string;
  editHref: string;
  deleteLabel: string;
  values: Record<string, string>;
  status?: "lead" | "active" | "inactive";
};

type Props = {
  columns: ContactColumnDef[];
  rows: ContactTableRow[];
  savingId: string | null;
  deletingId: string | null;
  onCellChange: (rowId: string, columnId: string, value: string) => void;
  onCellSave: (rowId: string, columnId: string) => void | Promise<void>;
  onDelete: (rowId: string) => void | Promise<void>;
  onCancelRow?: (rowId: string) => void | Promise<void>;
  hint?: string;
};

function onEditKeyDown(
  e: React.KeyboardEvent,
  onCellSave: Props["onCellSave"],
  rowId: string,
  columnId: string,
  onCancel?: () => void,
) {
  if (e.key === "Enter") {
    e.preventDefault();
    (e.target as HTMLInputElement).blur();
  }
  if (e.key === "Escape") {
    e.preventDefault();
    onCancel();
  }
}

export function ContactDataTable({
  columns,
  rows,
  savingId,
  deletingId,
  onCellChange,
  onCellSave,
  onDelete,
  onCancelRow,
  hint = "Edit inline — saves when you click away. Press Enter to save, Esc to undo.",
}: Props) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="border-b bg-slate-50 text-left text-xs uppercase text-slate-500">
          <tr>
            {columns.map((col) => (
              <th key={col.id} className="px-3 py-3">
                {col.label}
              </th>
            ))}
            <th className="px-3 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b last:border-0 hover:bg-slate-50/80">
              {columns.map((col) => {
                const value = row.values[col.id] ?? "";
                if (col.id === "status" && row.status) {
                  return (
                    <td key={col.id} className="px-3 py-2">
                      <StatusBadge status={row.status} />
                    </td>
                  );
                }
                if (col.editable) {
                  return (
                    <td key={col.id} className="px-3 py-2">
                      <input
                        value={value}
                        disabled={savingId === row.id || deletingId === row.id}
                        onChange={(e) => onCellChange(row.id, col.id, e.target.value)}
                        onBlur={() => void onCellSave(row.id, col.id)}
                        onKeyDown={(e) =>
                          onEditKeyDown(e, onCellSave, row.id, col.id, () => {
                            void onCancelRow?.(row.id);
                          })
                        }
                        className={`${inputClass} ${col.id.includes("name") ? "font-medium text-[var(--mp-navy)]" : ""}`}
                      />
                    </td>
                  );
                }
                return (
                  <td key={col.id} className="px-3 py-3 text-slate-700">
                    {value || "—"}
                  </td>
                );
              })}
              <td className="px-3 py-3">
                <div className="flex items-center justify-end gap-1">
                  {savingId === row.id && <span className="text-xs text-slate-400">Saving…</span>}
                  <Link
                    to={row.editHref}
                    title="Full edit"
                    className="inline-flex rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-[var(--mp-navy)]"
                  >
                    <Pencil size={16} />
                  </Link>
                  <ListDeleteButton
                    label={row.deleteLabel}
                    deleting={deletingId === row.id}
                    onDelete={() => onDelete(row.id)}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-400">{hint}</p>
    </div>
  );
}
