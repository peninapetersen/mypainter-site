import { FormEvent, useEffect, useState } from "react";
import { SettingsLayout } from "@/components/layout/SettingsLayout";
import { AccountCodesAccordion } from "@/components/settings/AccountCodesAccordion";
import { useErrorBanner } from "@/context/ErrorBannerContext";
import { listAccountCodes } from "@/lib/account-codes";
import { formatSupabaseError } from "@/lib/supabase-errors";
import { gstRatePercent } from "@/lib/tax";
import { getWorkSettings, saveWorkSettings } from "@/lib/work-settings";
import type { AccountCode, WorkSettings } from "@/types/entities";

export function TaxAccountingPage() {
  const { showError } = useErrorBanner();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<WorkSettings | null>(null);
  const [codes, setCodes] = useState<AccountCode[]>([]);

  useEffect(() => {
    Promise.all([getWorkSettings(), listAccountCodes({ activeOnly: false })])
      .then(([ws, c]) => {
        setSettings(ws);
        setCodes(c);
      })
      .catch((e) => showError(formatSupabaseError(e)))
      .finally(() => setLoading(false));
  }, [showError]);

  async function onSaveSettings(e?: FormEvent) {
    e?.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      const saved = await saveWorkSettings(settings);
      setSettings(saved);
    } catch (err) {
      showError(formatSupabaseError(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading || !settings) return <p className="text-slate-500">Loading…</p>;

  const gstPct = gstRatePercent(settings);

  return (
    <SettingsLayout>
      <div className="max-w-3xl space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--mp-navy)]">Tax &amp; accounting</h1>
          <p className="mt-1 text-sm text-slate-500">
            GST settings plus one account-code chart wired through products, quotes, invoices, expenses and tax return.
          </p>
        </div>

        <form onSubmit={onSaveSettings} className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold text-[var(--mp-navy)]">GST settings</h2>
          <p className="mt-1 text-sm text-slate-500">Richard is GST-registered — 15% is added on top of line items (exclusive).</p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-bold uppercase text-slate-400">GST rate (%)</span>
              <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={Math.round(settings.gst_rate * 1000) / 10}
                onChange={(e) =>
                  setSettings({ ...settings, gst_rate: (parseFloat(e.target.value) || 0) / 100 })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-bold uppercase text-slate-400">Tax on documents</span>
              <select
                value={settings.default_tax_mode}
                onChange={(e) =>
                  setSettings({ ...settings, default_tax_mode: e.target.value as WorkSettings["default_tax_mode"] })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="exclusive">Exclusive — GST added on top</option>
                <option value="inclusive">Inclusive — GST included in prices</option>
              </select>
            </label>
          </div>

          <div className="mt-4 space-y-3 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.gst_default_on_quotes}
                onChange={(e) => setSettings({ ...settings, gst_default_on_quotes: e.target.checked })}
              />
              Add GST ({gstPct}%) to new quotes by default
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.gst_default_on_invoices}
                onChange={(e) => setSettings({ ...settings, gst_default_on_invoices: e.target.checked })}
              />
              Add GST ({gstPct}%) to new invoices by default
            </label>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-6 rounded-lg bg-[var(--mp-orange)] px-5 py-2 text-sm font-bold text-white disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save GST settings"}
          </button>
        </form>

        <AccountCodesAccordion codes={codes} onChange={setCodes} onError={showError} />
      </div>
    </SettingsLayout>
  );
}
