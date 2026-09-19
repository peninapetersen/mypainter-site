import { Plus, Trash2 } from "lucide-react";
import type { ClientContactInput } from "@/types/entities";

const TITLES = ["", "Mr", "Mrs", "Ms", "Miss", "Dr"];

const EMPTY: ClientContactInput = {
  property_id: null,
  title: "",
  first_name: "",
  last_name: "",
  phone: "",
  email: "",
  notes: "",
  sort_order: 0,
};

export function ContactsEditor({
  contacts,
  onChange,
  hint,
}: {
  contacts: ClientContactInput[];
  onChange: (contacts: ClientContactInput[]) => void;
  hint: string;
}) {
  function update(i: number, patch: Partial<ClientContactInput>) {
    onChange(contacts.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">{hint}</p>
      {contacts.map((c, i) => (
        <div key={i} className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <select value={c.title} onChange={(e) => update(i, { title: e.target.value })} className="rounded-lg border px-3 py-2 text-sm">
              <option value="">No title</option>
              {TITLES.filter(Boolean).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <input placeholder="First name" value={c.first_name} onChange={(e) => update(i, { first_name: e.target.value })} className="rounded-lg border px-3 py-2 text-sm" />
            <input placeholder="Last name" value={c.last_name} onChange={(e) => update(i, { last_name: e.target.value })} className="rounded-lg border px-3 py-2 text-sm" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input placeholder="Phone" value={c.phone} onChange={(e) => update(i, { phone: e.target.value })} className="rounded-lg border px-3 py-2 text-sm" />
            <input placeholder="Email" type="email" value={c.email} onChange={(e) => update(i, { email: e.target.value })} className="rounded-lg border px-3 py-2 text-sm" />
          </div>
          <div className="flex justify-end">
            <button type="button" onClick={() => onChange(contacts.filter((_, idx) => idx !== i))} className="text-sm text-red-600 hover:underline">
              <Trash2 size={14} className="mr-1 inline" /> Remove
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...contacts, { ...EMPTY }])}
        className="rounded-lg border border-[var(--mp-orange)] px-4 py-2 text-sm font-semibold text-[var(--mp-orange)]"
      >
        <Plus size={14} className="mr-1 inline" />
        Add Contact
      </button>
    </div>
  );
}
