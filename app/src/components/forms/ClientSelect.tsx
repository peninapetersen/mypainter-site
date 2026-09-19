import { clientDisplayName } from "@/lib/client-display";
import type { Client } from "@/types/entities";

export function ClientSelect({
  clients,
  value,
  onChange,
  required,
}: {
  clients: Client[];
  value: string;
  onChange: (id: string) => void;
  required?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
    >
      <option value="">— Select client —</option>
      {clients.map((c) => (
        <option key={c.id} value={c.id}>
          {clientDisplayName(c)}
        </option>
      ))}
    </select>
  );
}
