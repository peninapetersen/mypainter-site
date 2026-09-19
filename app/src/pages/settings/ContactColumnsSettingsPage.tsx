import { useEffect, useState } from "react";
import { SettingsLayout } from "@/components/layout/SettingsLayout";
import { useErrorBanner } from "@/context/ErrorBannerContext";
import {
  CONTACT_COLUMN_CATALOG,
  CONTACT_LIST_LABELS,
  DEFAULT_CONTACT_LIST_COLUMNS,
  mergeContactListColumns,
  saveContactListColumns,
  type ContactListColumnsConfig,
  type ContactListKey,
} from "@/lib/contact-list-columns";
import { getWorkSettings } from "@/lib/work-settings";

const LIST_KEYS = Object.keys(CONTACT_LIST_LABELS) as ContactListKey[];

export function ContactColumnsSettingsPage() {
  const { showError } = useErrorBanner();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<ContactListColumnsConfig>(DEFAULT_CONTACT_LIST_COLUMNS);

  useEffect(() => {
    getWorkSettings()
      .then((s) => setConfig(mergeContactListColumns(s.contact_list_columns)))
      .catch((e) => showError(e.message))
      .finally(() => setLoading(false));
  }, [showError]);

  function toggle(listKey: ContactListKey, columnId: string) {
    setConfig((prev) => {
      const visible = new Set(prev[listKey].visible);
      if (visible.has(columnId)) {
        if (visible.size <= 1) return prev;
        visible.delete(columnId);
      } else {
        visible.add(columnId);
      }
      const order = CONTACT_COLUMN_CATALOG[listKey].map((c) => c.id);
      return { ...prev, [listKey]: { visible: order.filter((id) => visible.has(id)) } };
    });
  }

  async function onSave() {
    setSaving(true);
    try {
      await saveContactListColumns(config);
    } catch (e) {
      showError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <SettingsLayout><p className="text-slate-500">Loading…</p></SettingsLayout>;

  return (
    <SettingsLayout>
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--mp-navy)]">Contact lists</h1>
          <p className="mt-1 text-sm text-slate-500">
            Choose which columns show on each Contacts menu list. Inline editing works on editable columns.
          </p>
        </div>

        {LIST_KEYS.map((listKey) => (
          <section key={listKey} className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="mb-3 text-lg font-bold text-[var(--mp-navy)]">{CONTACT_LIST_LABELS[listKey]}</h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {CONTACT_COLUMN_CATALOG[listKey].map((col) => {
                const checked = config[listKey].visible.includes(col.id);
                return (
                  <li key={col.id}>
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(listKey, col.id)}
                        className="rounded border-slate-300 text-[var(--mp-orange)]"
                      />
                      <span>{col.label}</span>
                      {col.editable && <span className="text-xs text-slate-400">· inline edit</span>}
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

        <button
          type="button"
          disabled={saving}
          onClick={onSave}
          className="rounded-lg bg-[var(--mp-orange)] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save column settings"}
        </button>
      </div>
    </SettingsLayout>
  );
}
