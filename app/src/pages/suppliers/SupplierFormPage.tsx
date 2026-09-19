import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ExternalLink, RefreshCw, Truck } from "lucide-react";
import { FormSaveBar } from "@/components/ui/FormSaveBar";
import { Avatar } from "@/components/ui/Avatar";
import { fetchSupplierLogoFromWebsite } from "@/lib/app-images";
import { useErrorBanner } from "@/context/ErrorBannerContext";
import { accountCodeLabel, listAccountCodes } from "@/lib/account-codes";
import {
  createSupplier,
  deleteSupplier,
  emptySupplierFields,
  getSupplier,
  supplierDisplayName,
  updateSupplier,
} from "@/lib/suppliers";
import { formatSupabaseError } from "@/lib/supabase-errors";
import type { AccountCode, Supplier } from "@/types/entities";

type Tab = "information" | "notes" | "orders" | "bills";

const TABS: { id: Tab; label: string }[] = [
  { id: "information", label: "Information" },
  { id: "notes", label: "Notes" },
  { id: "orders", label: "Purchase orders" },
  { id: "bills", label: "Bills" },
];

const DUE_OPTIONS = [
  { label: "Due on receipt", days: 0 },
  { label: "Net 7", days: 7 },
  { label: "Net 15", days: 15 },
  { label: "Net 30", days: 30 },
  { label: "Net 45", days: 45 },
  { label: "Net 60", days: 60 },
];

function supplierToForm(row: Supplier) {
  return {
    name: row.name,
    company_name: row.company_name,
    email: row.email,
    phone: row.phone,
    mobile: row.mobile ?? "",
    fax: row.fax ?? "",
    address: row.address,
    physical_street_1: row.physical_street_1 ?? "",
    physical_street_2: row.physical_street_2 ?? "",
    physical_city: row.physical_city ?? "",
    physical_region: row.physical_region ?? "",
    physical_postal_code: row.physical_postal_code ?? "",
    physical_country: row.physical_country || "New Zealand",
    postal_street_1: row.postal_street_1 ?? "",
    postal_street_2: row.postal_street_2 ?? "",
    postal_city: row.postal_city ?? "",
    postal_region: row.postal_region ?? "",
    postal_postal_code: row.postal_postal_code ?? "",
    postal_country: row.postal_country || "New Zealand",
    default_due_days: row.default_due_days ?? 30,
    tax_mode: row.tax_mode ?? "exclusive",
    default_account_code: row.default_account_code || row.account_code || "3100",
    gst_number: row.gst_number ?? "",
    account_code: row.account_code,
    website: row.website ?? "",
    logo_path: row.logo_path ?? "",
    notes: row.notes,
  };
}

export function SupplierFormPage() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const { showError } = useErrorBanner();
  const [tab, setTab] = useState<Tab>("information");
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [codes, setCodes] = useState<AccountCode[]>([]);
  const [form, setForm] = useState(supplierToForm({ ...emptySupplierFields(), id: "", user_id: "", created_at: "", updated_at: "" }));
  const [fetchingLogo, setFetchingLogo] = useState(false);

  useEffect(() => {
    listAccountCodes({ section: "suppliers" })
      .then(setCodes)
      .catch(() => setCodes([]));
  }, []);

  useEffect(() => {
    if (isNew) return;
    getSupplier(id!)
      .then((row) => {
        if (!row) throw new Error("Supplier not found");
        setForm(supplierToForm(row));
      })
      .catch((e) => showError(formatSupabaseError(e)))
      .finally(() => setLoading(false));
  }, [id, isNew, showError]);

  function copyPhysicalToPostal() {
    setForm((f) => ({
      ...f,
      postal_street_1: f.physical_street_1,
      postal_street_2: f.physical_street_2,
      postal_city: f.physical_city,
      postal_region: f.physical_region,
      postal_postal_code: f.physical_postal_code,
      postal_country: f.physical_country,
    }));
  }

  async function persist(e?: FormEvent) {
    e?.preventDefault();
    if (!form.company_name.trim() && !form.name.trim()) {
      showError("Enter a supplier name or contact name.");
      return;
    }
    setSaving(true);
    try {
      if (isNew) {
        const row = await createSupplier(form);
        navigate(`/suppliers/${row.id}`);
      } else {
        await updateSupplier(id!, form);
        navigate("/suppliers/list");
      }
    } catch (err) {
      showError(formatSupabaseError(err));
    } finally {
      setSaving(false);
    }
  }

  async function pullLogo() {
    if (!form.website.trim()) {
      showError("Enter a website URL first.");
      return;
    }
    setFetchingLogo(true);
    try {
      const { path } = await fetchSupplierLogoFromWebsite(form.website.trim());
      setForm((f) => ({ ...f, logo_path: path }));
    } catch (e) {
      showError(e instanceof Error ? e.message : "Could not fetch logo");
    } finally {
      setFetchingLogo(false);
    }
  }

  async function onDelete() {
    if (!confirm("Delete this supplier?")) return;
    try {
      await deleteSupplier(id!);
      navigate("/suppliers/list");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  if (loading) return <p className="text-slate-500">Loading…</p>;

  const expenseCodes = codes;

  return (
    <div className="pb-24">
      <div className="mb-6 flex items-start justify-between">
        <Link to="/suppliers/list" className="text-sm text-slate-500 hover:text-slate-800">
          ← Suppliers
        </Link>
        {!isNew && (
          <button type="button" onClick={onDelete} className="text-sm text-red-600 hover:underline">
            Delete
          </button>
        )}
      </div>

      <div className="mb-4 flex items-center gap-3">
        {form.logo_path ? (
          <Avatar photoPath={form.logo_path} name={supplierDisplayName(form)} size={40} rounded="lg" />
        ) : (
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            <Truck size={22} />
          </span>
        )}
        <h1 className="text-2xl font-bold text-[var(--mp-navy)]">
          {isNew ? "New supplier" : supplierDisplayName(form)}
        </h1>
      </div>

      <div className="mb-6 flex flex-wrap gap-1 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-t-lg px-4 py-2 text-sm font-semibold ${
              tab === t.id ? "border border-b-white border-slate-200 bg-white text-[var(--mp-navy)]" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={persist} className="mx-auto max-w-4xl">
        {tab === "information" && (
          <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block text-xs font-semibold text-slate-500">Supplier name *</span>
                <input
                  value={form.company_name}
                  onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-xs font-semibold text-slate-500">Contact name</span>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-bold text-slate-700">Website & logo</h3>
              <div className="mb-6 flex flex-wrap items-end gap-3">
                <label className="block min-w-[200px] flex-1 text-sm">
                  <span className="mb-1 block text-xs font-semibold text-slate-500">Website</span>
                  <input
                    type="url"
                    value={form.website}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                    placeholder="https://resene.co.nz"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </label>
                <button
                  type="button"
                  disabled={fetchingLogo || !form.website.trim()}
                  onClick={pullLogo}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  <RefreshCw size={14} className={fetchingLogo ? "animate-spin" : ""} />
                  {fetchingLogo ? "Fetching…" : "Pull logo"}
                </button>
                {form.website.trim() && (
                  <a
                    href={form.website.startsWith("http") ? form.website : `https://${form.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 py-2 text-sm text-[var(--mp-orange)] hover:underline"
                  >
                    <ExternalLink size={14} /> Visit site
                  </a>
                )}
              </div>
              {form.logo_path && (
                <div className="mb-6 flex items-center gap-3">
                  <Avatar photoPath={form.logo_path} name={supplierDisplayName(form)} size={48} rounded="lg" />
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, logo_path: "" })}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Remove logo
                  </button>
                </div>
              )}
            </div>

            <div>
              <h3 className="mb-3 text-sm font-bold text-slate-700">Contact information</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block text-sm">
                  <span className="mb-1 block text-xs font-semibold text-slate-500">Phone</span>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-xs font-semibold text-slate-500">Mobile</span>
                  <input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-xs font-semibold text-slate-500">Fax</span>
                  <input value={form.fax} onChange={(e) => setForm({ ...form, fax: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
                </label>
              </div>
              <label className="mt-4 block text-sm">
                <span className="mb-1 block text-xs font-semibold text-slate-500">Email address</span>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
                <span className="mt-1 block text-xs text-slate-400">Separate with commas for multiple</span>
              </label>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <h3 className="mb-3 text-sm font-bold text-slate-700">Physical address</h3>
                <div className="space-y-3">
                  <textarea
                    value={form.physical_street_1}
                    onChange={(e) => setForm({ ...form, physical_street_1: e.target.value })}
                    rows={2}
                    placeholder="Street address"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                  <input value={form.physical_street_2} onChange={(e) => setForm({ ...form, physical_street_2: e.target.value })} placeholder="Suburb / unit" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                  <div className="grid grid-cols-2 gap-3">
                    <input value={form.physical_city} onChange={(e) => setForm({ ...form, physical_city: e.target.value })} placeholder="Town / city" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                    <input value={form.physical_region} onChange={(e) => setForm({ ...form, physical_region: e.target.value })} placeholder="Region" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input value={form.physical_postal_code} onChange={(e) => setForm({ ...form, physical_postal_code: e.target.value })} placeholder="Postcode" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                    <input value={form.physical_country} onChange={(e) => setForm({ ...form, physical_country: e.target.value })} placeholder="Country" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-700">Postal address</h3>
                  <button type="button" onClick={copyPhysicalToPostal} className="rounded bg-slate-700 px-3 py-1 text-xs font-bold text-white hover:bg-slate-800">
                    Copy physical address
                  </button>
                </div>
                <div className="space-y-3">
                  <textarea
                    value={form.postal_street_1}
                    onChange={(e) => setForm({ ...form, postal_street_1: e.target.value })}
                    rows={2}
                    placeholder="Street / PO Box"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                  <input value={form.postal_street_2} onChange={(e) => setForm({ ...form, postal_street_2: e.target.value })} placeholder="Suburb" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                  <div className="grid grid-cols-2 gap-3">
                    <input value={form.postal_city} onChange={(e) => setForm({ ...form, postal_city: e.target.value })} placeholder="Town / city" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                    <input value={form.postal_region} onChange={(e) => setForm({ ...form, postal_region: e.target.value })} placeholder="Region" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input value={form.postal_postal_code} onChange={(e) => setForm({ ...form, postal_postal_code: e.target.value })} placeholder="Postcode" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                    <input value={form.postal_country} onChange={(e) => setForm({ ...form, postal_country: e.target.value })} placeholder="Country" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-bold text-slate-700">Financial information</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="mb-1 block text-xs font-semibold text-slate-500">Default invoice due</span>
                  <select
                    value={form.default_due_days}
                    onChange={(e) => setForm({ ...form, default_due_days: parseInt(e.target.value, 10) })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  >
                    {DUE_OPTIONS.map((o) => (
                      <option key={o.days} value={o.days}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-xs font-semibold text-slate-500">Tax on supplier bills</span>
                  <select
                    value={form.tax_mode}
                    onChange={(e) => setForm({ ...form, tax_mode: e.target.value as Supplier["tax_mode"] })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  >
                    <option value="exclusive">Exclusive — GST on top</option>
                    <option value="inclusive">Inclusive — GST in amount</option>
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-xs font-semibold text-slate-500">Default expense code</span>
                  <select
                    value={form.default_account_code}
                    onChange={(e) => setForm({ ...form, default_account_code: e.target.value, account_code: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  >
                    {expenseCodes.length === 0 ? (
                      <option value="3100">3100 — Materials</option>
                    ) : (
                      expenseCodes.map((c) => (
                        <option key={c.id} value={c.code}>
                          {accountCodeLabel(c)}
                        </option>
                      ))
                    )}
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-xs font-semibold text-slate-500">Supplier GST number</span>
                  <input
                    value={form.gst_number}
                    onChange={(e) => setForm({ ...form, gst_number: e.target.value })}
                    placeholder="If GST-registered"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {tab === "notes" && (
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-semibold text-slate-500">Supplier notes</span>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={10}
                placeholder="Account rep, opening hours, preferred products…"
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
          </div>
        )}

        {(tab === "orders" || tab === "bills") && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
            <p className="text-sm text-slate-600">
              {tab === "orders" ? "Purchase orders" : "Supplier bills"} — coming next for tax time.
            </p>
            <p className="mt-2 text-xs text-slate-400">Link material invoices to jobs and account codes from here later.</p>
          </div>
        )}
      </form>

      <FormSaveBar saving={saving} saveLabel="Save supplier" onSave={() => persist()} cancelTo="/suppliers/list" />
    </div>
  );
}
