import { FormEvent, useState } from "react";
import { accountCodeLabel } from "@/lib/account-codes";
import { createServiceCategory, updateServiceCategory } from "@/lib/service-categories";
import { formatSupabaseError } from "@/lib/supabase-errors";
import type { AccountCode } from "@/types/entities";
import type { ServiceCategory } from "@/types/service-categories";

export function ServiceCategorySettingsPanel({
  categories,
  incomeCodes,
  onChange,
  onError,
}: {
  categories: ServiceCategory[];
  incomeCodes: AccountCode[];
  onChange: (next: ServiceCategory[]) => void;
  onError: (msg: string) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(categories[0]?.id ?? null);
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("2000");
  const [savingId, setSavingId] = useState<string | null>(null);

  const selected = categories.find((c) => c.id === selectedId) ?? null;
  const codeOptions = incomeCodes.length ? incomeCodes : [{ code: "2000", name: "Painting services" } as AccountCode];

  async function patchCategory(id: string, patch: Parameters<typeof updateServiceCategory>[1]) {
    setSavingId(id);
    try {
      const updated = await updateServiceCategory(id, patch);
      onChange(categories.map((c) => (c.id === id ? updated : c)));
    } catch (e) {
      onError(formatSupabaseError(e));
    } finally {
      setSavingId(null);
    }
  }

  async function onAdd(e: FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      const row = await createServiceCategory(newName, newCode);
      const next = [...categories, row].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
      onChange(next);
      setSelectedId(row.id);
      setNewName("");
    } catch (err) {
      onError(formatSupabaseError(err));
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-bold text-[var(--mp-navy)]">Product &amp; service categories</h2>
      <p className="mt-1 text-sm text-slate-500">
        Business-friendly pills for your rate card. Each category maps to a default <strong>income</strong> tax code for new items.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedId(cat.id)}
            className={`rounded-full px-3 py-1 text-sm font-semibold ${
              selectedId === cat.id
                ? "bg-[var(--mp-orange)] text-white"
                : cat.active
                  ? "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  : "border border-dashed border-slate-300 bg-slate-50 text-slate-400"
            }`}
          >
            {cat.name}
            {!cat.active && <span className="ml-1 text-[10px] uppercase">hidden</span>}
          </button>
        ))}
      </div>

      {selected && (
        <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-semibold text-slate-500">Display name</span>
              <input
                value={selected.name}
                disabled={savingId === selected.id}
                onChange={(e) => onChange(categories.map((c) => (c.id === selected.id ? { ...c, name: e.target.value } : c)))}
                onBlur={() => {
                  const live = categories.find((c) => c.id === selected.id);
                  if (live && live.name.trim() && live.name !== selected.name) {
                    patchCategory(selected.id, { name: live.name.trim() });
                  }
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-semibold text-slate-500">Default income code</span>
              <select
                value={selected.default_account_code || "2000"}
                disabled={savingId === selected.id}
                onChange={(e) => patchCategory(selected.id, { default_account_code: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                {codeOptions.map((c) => (
                  <option key={c.code} value={c.code}>
                    {accountCodeLabel(c)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={selected.active}
              disabled={savingId === selected.id}
              onChange={() => patchCategory(selected.id, { active: !selected.active })}
            />
            Active — show on products list, website calculator &amp; catalogue picker
          </label>
          <p className="mt-2 font-mono text-xs text-slate-400">slug: {selected.slug}</p>
        </div>
      )}

      <form onSubmit={onAdd} className="mt-6 flex flex-wrap items-end gap-3 border-t border-slate-100 pt-4">
        <label className="min-w-[160px] flex-1 text-sm">
          <span className="mb-1 block text-xs font-semibold text-slate-500">New category</span>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Exterior"
            className="w-full rounded-lg border border-slate-300 px-3 py-1.5"
          />
        </label>
        <label className="min-w-[180px] text-sm">
          <span className="mb-1 block text-xs font-semibold text-slate-500">Default code</span>
          <select value={newCode} onChange={(e) => setNewCode(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-1.5">
            {codeOptions.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm font-semibold hover:bg-slate-50">
          Add category
        </button>
      </form>
    </section>
  );
}
