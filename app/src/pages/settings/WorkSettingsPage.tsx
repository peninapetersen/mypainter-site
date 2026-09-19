import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SettingsLayout } from "@/components/layout/SettingsLayout";
import { useErrorBanner } from "@/context/ErrorBannerContext";
import {
  ARRIVAL_WINDOWS,
  PAYMENT_TERMS_ALL,
  VISIT_TITLE_VARIABLES,
  getWorkSettings,
  saveWorkSettings,
} from "@/lib/work-settings";
import type { WorkSettings } from "@/types/entities";

export function WorkSettingsPage() {
  const { showError } = useErrorBanner();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<WorkSettings | null>(null);
  const [showVars, setShowVars] = useState(false);

  useEffect(() => {
    getWorkSettings()
      .then(setForm)
      .catch((e) => showError(e.message))
      .finally(() => setLoading(false));
  }, [showError]);

  async function onSave() {
    if (!form) return;
    setSaving(true);
    try {
      const saved = await saveWorkSettings(form);
      setForm(saved);
    } catch (e) {
      showError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !form) return <p className="text-slate-500">Loading…</p>;

  return (
    <SettingsLayout>
      <div className="max-w-2xl space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--mp-navy)]">Work settings</h1>
          <p className="mt-1 text-sm text-slate-500">Defaults for quotes, jobs, visits, and invoices.</p>
        </div>

        <section id="documents" className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold text-[var(--mp-navy)]">Quote &amp; invoice documents</h2>
          <p className="mt-1 text-sm text-slate-500">
            A4 templates — logo, footer contact, and default terms. Edit a quote/invoice then <strong>View</strong> to preview.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-bold uppercase text-slate-400">Phone on documents</span>
              <input
                value={form.document_phone}
                onChange={(e) => setForm({ ...form, document_phone: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-bold uppercase text-slate-400">Email on documents</span>
              <input
                value={form.document_email}
                onChange={(e) => setForm({ ...form, document_email: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
          </div>
          <label className="mt-4 block text-sm">
            <span className="mb-1 block text-xs font-bold uppercase text-slate-400">Tagline under logo</span>
            <input
              value={form.document_tagline}
              onChange={(e) => setForm({ ...form, document_tagline: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="mt-4 block text-sm">
            <span className="mb-1 block font-semibold text-slate-700">Default quote terms</span>
            <p className="mb-1 text-xs text-slate-500">Pre-filled on new quotes — appears at the bottom of the A4 quote.</p>
            <textarea
              value={form.quote_default_terms}
              onChange={(e) => setForm({ ...form, quote_default_terms: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="mt-4 block text-sm">
            <span className="mb-1 block font-semibold text-slate-700">Default invoice contract / payment note</span>
            <textarea
              value={form.invoice_default_contract}
              onChange={(e) => setForm({ ...form, invoice_default_contract: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold text-[var(--mp-navy)]">Quotes</h2>
          <label className="mt-4 flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={form.quote_reminder_enabled}
              onChange={(e) => setForm({ ...form, quote_reminder_enabled: e.target.checked })}
              className="mt-1"
            />
            <span>
              Add a reminder to your calendar to check in on quotes that haven&apos;t converted after{" "}
              <input
                type="number"
                min={1}
                max={90}
                value={form.quote_reminder_days}
                onChange={(e) => setForm({ ...form, quote_reminder_days: parseInt(e.target.value, 10) || 3 })}
                className="mx-1 w-14 rounded border border-slate-300 px-2 py-0.5 text-center"
              />{" "}
              days.
            </span>
          </label>
        </section>

        <section id="jobs" className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold text-[var(--mp-navy)]">Jobs</h2>
          <div className="mt-4 space-y-4">
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-700">Default arrival window</p>
              <div className="flex flex-wrap gap-2">
                {ARRIVAL_WINDOWS.map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setForm({ ...form, arrival_window: w })}
                    className={`rounded-full px-3 py-1 text-sm font-semibold ${
                      form.arrival_window === w
                        ? "bg-[var(--mp-navy)] text-white"
                        : "border border-slate-300 text-slate-600"
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-700">Arrival window style</p>
              <label className="mb-2 flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="windowStyle"
                  checked={form.arrival_window_style === "after"}
                  onChange={() => setForm({ ...form, arrival_window_style: "after" })}
                />
                Add window after start time (ex. 9:00 AM – 10:00 AM)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="windowStyle"
                  checked={form.arrival_window_style === "center"}
                  onChange={() => setForm({ ...form, arrival_window_style: "center" })}
                />
                Centre window on start time (ex. 8:30 AM – 9:30 AM)
              </label>
            </div>
            <div>
              <p className="mb-1 text-sm font-semibold text-slate-700">Visit titles</p>
              <p className="mb-2 text-xs text-slate-500">Visit titles display on your calendar and lists.</p>
              <input
                value={form.visit_title_template}
                onChange={(e) => setForm({ ...form, visit_title_template: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowVars(!showVars)}
                className="mt-2 text-sm font-semibold text-[var(--mp-orange)] underline"
              >
                Custom visit title variables {showVars ? "▲" : "▼"}
              </button>
              {showVars && (
                <p className="mt-2 text-xs text-slate-500">{VISIT_TITLE_VARIABLES.join(" · ")}</p>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold text-[var(--mp-navy)]">Invoices</h2>
          <div className="mt-4 space-y-4">
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-slate-700">Invoice subject</span>
              <input
                value={form.invoice_subject_default}
                onChange={(e) => setForm({ ...form, invoice_subject_default: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.invoice_use_job_title}
                onChange={(e) => setForm({ ...form, invoice_use_job_title: e.target.checked })}
              />
              Use quote or job title as invoice subject if available
            </label>
            <p className="text-sm text-slate-600">
              Set typical payment terms for residential and commercial clients. Override per client later.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block font-semibold text-slate-700">Default residential term</span>
                <select
                  value={form.payment_terms_residential}
                  onChange={(e) => setForm({ ...form, payment_terms_residential: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                >
                  {PAYMENT_TERMS_ALL.map((t) => (
                    <option key={t.name} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-semibold text-slate-700">Default commercial term</span>
                <select
                  value={form.payment_terms_commercial}
                  onChange={(e) => setForm({ ...form, payment_terms_commercial: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                >
                  {PAYMENT_TERMS_ALL.map((t) => (
                    <option key={t.name} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-slate-500">
                  <th className="py-2">Term name</th>
                  <th className="py-2">Number of days</th>
                </tr>
              </thead>
              <tbody>
                {PAYMENT_TERMS_ALL.map((t) => (
                  <tr key={t.name} className="border-b border-slate-100">
                    <td className="py-2">{t.name}</td>
                    <td className="py-2 text-slate-500">{t.days ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold text-[var(--mp-navy)]">Invoice reminders</h2>
          <p className="mt-1 text-sm text-slate-500">Scheduled reminders to invoice customers for recurring jobs.</p>
          <label className="mt-4 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.invoice_reminder_reassign}
              onChange={(e) => setForm({ ...form, invoice_reminder_reassign: e.target.checked })}
            />
            Reassign all incomplete invoice reminders
          </label>
          <label className="mt-3 block text-sm">
            <span className="mb-1 block text-xs font-bold uppercase text-slate-400">Assigned to</span>
            <input
              value={form.invoice_reminder_assigned_to}
              onChange={(e) => setForm({ ...form, invoice_reminder_assigned_to: e.target.value })}
              className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold text-[var(--mp-navy)]">Statements</h2>
          <label className="mt-4 block text-sm">
            <span className="mb-1 block font-semibold text-slate-700">Sort order of billing history</span>
            <select
              value={form.statement_sort_order}
              onChange={(e) =>
                setForm({ ...form, statement_sort_order: e.target.value as WorkSettings["statement_sort_order"] })
              }
              className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="newest_first">Newest first</option>
              <option value="oldest_first">Oldest first</option>
            </select>
          </label>
          <label className="mt-4 block text-sm">
            <span className="mb-1 block font-semibold text-slate-700">Contract / disclaimer</span>
            <p className="mb-1 text-xs italic text-slate-500">This message will appear at the bottom of every statement</p>
            <textarea
              value={form.statement_disclaimer}
              onChange={(e) => setForm({ ...form, statement_disclaimer: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
        </section>

        <div className="flex items-center justify-between pb-8">
          <Link to="/jobs" className="text-sm text-slate-500 hover:underline">
            ← Back to jobs
          </Link>
          <button
            type="button"
            disabled={saving}
            onClick={onSave}
            className="rounded-lg bg-[var(--mp-orange)] px-5 py-2 text-sm font-bold text-white disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save settings"}
          </button>
        </div>
      </div>
    </SettingsLayout>
  );
}
