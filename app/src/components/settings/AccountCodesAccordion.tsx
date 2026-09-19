import { FormEvent, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  ACCOUNT_CODE_SECTIONS,
  ACCOUNT_GST_TYPE_LABELS,
  ACCOUNT_TYPE_LABELS,
  createAccountCode,
  friendlyName,
  updateAccountCode,
} from "@/lib/account-codes";
import { formatSupabaseError } from "@/lib/supabase-errors";
import type { AccountCode, AccountCodeSection } from "@/types/entities";

export function AccountCodesAccordion({
  codes,
  onChange,
  onError,
}: {
  codes: AccountCode[];
  onChange: (next: AccountCode[]) => void;
  onError: (msg: string) => void;
}) {
  const [openId, setOpenId] = useState<string | null>(codes[0]?.id ?? null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [newCode, setNewCode] = useState({ code: "", name: "", friendly_name: "" });

  async function patch(id: string, patch: Parameters<typeof updateAccountCode>[1]) {
    setSavingId(id);
    try {
      const updated = await updateAccountCode(id, patch);
      onChange(codes.map((c) => (c.id === id ? updated : c)));
    } catch (e) {
      onError(formatSupabaseError(e));
    } finally {
      setSavingId(null);
    }
  }

  async function toggleSection(row: AccountCode, section: AccountCodeSection) {
    const current = row.applies_to ?? [];
    const next = current.includes(section) ? current.filter((s) => s !== section) : [...current, section];
    await patch(row.id, { applies_to: next });
  }

  async function onAdd(e: FormEvent) {
    e.preventDefault();
    if (!newCode.code.trim() || !newCode.name.trim()) return;
    try {
      const row = await createAccountCode(newCode);
      onChange([...codes, row].sort((a, b) => a.sort_order - b.sort_order || a.code.localeCompare(b.code)));
      setOpenId(row.id);
      setNewCode({ code: "", name: "", friendly_name: "" });
    } catch (err) {
      onError(formatSupabaseError(err));
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-bold text-[var(--mp-navy)]">Account codes</h2>
      <p className="mt-1 text-sm text-slate-500">
        One chart for the whole workflow. Set a <strong>friendly name</strong> for pills, then tick where each code applies.
      </p>

      <div className="mt-4 divide-y divide-slate-100 rounded-lg border border-slate-200">
        {codes.map((row) => {
          const open = openId === row.id;
          return (
            <div key={row.id}>
              <button
                type="button"
                onClick={() => setOpenId(open ? null : row.id)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50"
              >
                {open ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
                <span className="font-mono text-sm font-bold text-[var(--mp-navy)]">{row.code}</span>
                <span className="min-w-0 flex-1 truncate text-sm text-slate-700">{row.name}</span>
                <span className="hidden rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 sm:inline">
                  {friendlyName(row)}
                </span>
                <span className="text-xs text-slate-400">{ACCOUNT_TYPE_LABELS[row.account_type]}</span>
              </button>

              {open && (
                <div className="space-y-4 border-t border-slate-100 bg-slate-50 px-4 py-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm">
                      <span className="mb-1 block text-xs font-semibold text-slate-500">Official name (Xero / IRD)</span>
                      <input
                        defaultValue={row.name}
                        disabled={savingId === row.id}
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          if (v && v !== row.name) patch(row.id, { name: v });
                        }}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1 block text-xs font-semibold text-slate-500">Friendly name (pills &amp; pickers)</span>
                      <input
                        defaultValue={friendlyName(row)}
                        disabled={savingId === row.id}
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          if (v && v !== friendlyName(row)) patch(row.id, { friendly_name: v });
                        }}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                      />
                    </label>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-bold uppercase text-slate-400">Applies to</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {ACCOUNT_CODE_SECTIONS.map((sec) => (
                        <label key={sec.key} className="flex cursor-pointer items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm">
                          <input
                            type="checkbox"
                            checked={(row.applies_to ?? []).includes(sec.key)}
                            disabled={savingId === row.id}
                            onChange={() => toggleSection(row, sec.key)}
                          />
                          {sec.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                    <span>GST: {ACCOUNT_GST_TYPE_LABELS[row.gst_type]}</span>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={row.is_active}
                        disabled={savingId === row.id}
                        onChange={() => patch(row.id, { is_active: !row.is_active })}
                      />
                      Active
                    </label>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <form onSubmit={onAdd} className="mt-6 flex flex-wrap items-end gap-3 border-t border-slate-100 pt-4">
        <label className="text-sm">
          <span className="mb-1 block text-xs font-semibold text-slate-500">Code</span>
          <input
            value={newCode.code}
            onChange={(e) => setNewCode({ ...newCode, code: e.target.value })}
            placeholder="6500"
            className="w-24 rounded-lg border border-slate-300 px-2 py-1.5 font-mono"
          />
        </label>
        <label className="min-w-[140px] flex-1 text-sm">
          <span className="mb-1 block text-xs font-semibold text-slate-500">Official name</span>
          <input
            value={newCode.name}
            onChange={(e) => setNewCode({ ...newCode, name: e.target.value })}
            placeholder="Account name"
            className="w-full rounded-lg border border-slate-300 px-3 py-1.5"
          />
        </label>
        <label className="min-w-[140px] flex-1 text-sm">
          <span className="mb-1 block text-xs font-semibold text-slate-500">Friendly name</span>
          <input
            value={newCode.friendly_name}
            onChange={(e) => setNewCode({ ...newCode, friendly_name: e.target.value })}
            placeholder="Short label"
            className="w-full rounded-lg border border-slate-300 px-3 py-1.5"
          />
        </label>
        <button type="submit" className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm font-semibold hover:bg-slate-50">
          Add code
        </button>
      </form>
    </section>
  );
}
