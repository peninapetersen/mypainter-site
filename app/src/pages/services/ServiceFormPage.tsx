import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Package } from "lucide-react";
import { FormSaveBar } from "@/components/ui/FormSaveBar";
import { useErrorBanner } from "@/context/ErrorBannerContext";
import { accountCodeLabel, friendlyName, listAccountCodes, resolveServiceAccountCode } from "@/lib/account-codes";
import { createService, deleteService, getService, updateService } from "@/lib/services";
import { formatSupabaseError } from "@/lib/supabase-errors";
import type { AccountCode } from "@/types/entities";
import type { MpService } from "@/types/services";

const MEASURE_TYPES = [
  { value: "fixed", label: "Fixed price" },
  { value: "sqm", label: "Per sqm" },
  { value: "lm", label: "Per linear metre" },
  { value: "room_walls", label: "Room walls (calculator)" },
  { value: "on_site", label: "On-site quote only" },
];

export function ServiceFormPage() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const { showError } = useErrorBanner();
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [productCodes, setProductCodes] = useState<AccountCode[]>([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    account_code: "2000",
    measure_type: "fixed" as MpService["measure_type"],
    rate_per_unit: 0,
    min_charge: 0,
    unit_label: "job",
    active: true,
    show_estimate: true,
  });

  useEffect(() => {
    listAccountCodes({ section: "products_services" })
      .then((codes) => {
        setProductCodes(codes);
        if (isNew && codes.length > 0) {
          setForm((prev) => ({ ...prev, account_code: codes[0].code }));
        }
      })
      .catch(() => setProductCodes([]));
  }, [isNew]);

  useEffect(() => {
    if (isNew) return;
    getService(id!)
      .then((row) => {
        if (!row) throw new Error("Service not found");
        setForm({
          name: row.name,
          description: row.description,
          account_code: resolveServiceAccountCode(row),
          measure_type: row.measure_type,
          rate_per_unit: Number(row.rate_per_unit) || 0,
          min_charge: Number(row.min_charge) || 0,
          unit_label: row.unit_label || "job",
          active: row.active,
          show_estimate: row.show_estimate,
        });
      })
      .catch((e) => showError(formatSupabaseError(e)))
      .finally(() => setLoading(false));
  }, [id, isNew, showError]);

  async function persist(e?: FormEvent) {
    e?.preventDefault();
    if (!form.name.trim()) {
      showError("Enter a name.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        category: form.account_code,
      };
      if (isNew) {
        const row = await createService(payload);
        navigate(`/services/${row.id}`);
      } else {
        await updateService(id!, payload);
        navigate("/services/list");
      }
    } catch (err) {
      showError(formatSupabaseError(err));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!confirm("Delete this product/service?")) return;
    try {
      await deleteService(id!);
      navigate("/services/list");
    } catch (err) {
      showError(formatSupabaseError(err));
    }
  }

  if (loading) return <p className="text-slate-500">Loading…</p>;

  const codeOptions =
    productCodes.length > 0
      ? productCodes
      : [{ code: "2000", name: "Painting services", friendly_name: "Painting" } as AccountCode];

  return (
    <div className="pb-24">
      <div className="mb-6 flex items-start justify-between">
        <Link to="/services/list" className="text-sm text-slate-500 hover:text-slate-800">
          ← Products & services
        </Link>
        {!isNew && (
          <button type="button" onClick={onDelete} className="text-sm text-red-600 hover:underline">
            Delete
          </button>
        )}
      </div>

      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
          <Package size={22} />
        </span>
        <h1 className="text-2xl font-bold text-[var(--mp-navy)]">{isNew ? "New product / service" : form.name}</h1>
      </div>

      <form onSubmit={persist} className="mx-auto max-w-lg space-y-4">
        <label className="block text-sm">
          <span className="mb-1 block text-xs font-semibold text-slate-500">Name *</span>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Interior painting" />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs font-semibold text-slate-500">Description</span>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Walls, ceilings, trim — one coat" />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-semibold text-slate-500">Category / income code</span>
            <select
              value={form.account_code}
              onChange={(e) => setForm({ ...form, account_code: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              {codeOptions.map((c) => (
                <option key={c.code} value={c.code}>
                  {friendlyName(c)} ({c.code})
                </option>
              ))}
              {!codeOptions.some((c) => c.code === form.account_code) && (
                <option value={form.account_code}>{form.account_code}</option>
              )}
            </select>
            <span className="mt-1 block text-xs text-slate-400">
              {accountCodeLabel(codeOptions.find((c) => c.code === form.account_code) ?? codeOptions[0])}. Manage in{" "}
              <Link to="/settings/tax" className="text-[var(--mp-orange)] hover:underline">Tax &amp; accounting</Link>.
            </span>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-semibold text-slate-500">Pricing type</span>
            <select value={form.measure_type} onChange={(e) => setForm({ ...form, measure_type: e.target.value as MpService["measure_type"] })} className="w-full rounded-lg border border-slate-300 px-3 py-2">
              {MEASURE_TYPES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-semibold text-slate-500">Rate ($)</span>
            <input type="number" min={0} step={0.01} value={form.rate_per_unit || ""} onChange={(e) => setForm({ ...form, rate_per_unit: Number(e.target.value) || 0 })} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-semibold text-slate-500">Min charge</span>
            <input type="number" min={0} step={0.01} value={form.min_charge || ""} onChange={(e) => setForm({ ...form, min_charge: Number(e.target.value) || 0 })} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-semibold text-slate-500">Unit</span>
            <input value={form.unit_label} onChange={(e) => setForm({ ...form, unit_label: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="sqm, job, hr" />
          </label>
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            Active on website & picker
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.show_estimate} onChange={(e) => setForm({ ...form, show_estimate: e.target.checked })} />
            Show calculator estimate
          </label>
        </div>
      </form>

      <FormSaveBar saving={saving} saveLabel="Save" onSave={() => persist()} cancelTo="/services/list" />
    </div>
  );
}
