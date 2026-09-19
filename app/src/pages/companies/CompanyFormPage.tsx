import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ExternalLink, RefreshCw } from "lucide-react";
import { ImageCropUpload } from "@/components/forms/ImageCropUpload";
import { Avatar } from "@/components/ui/Avatar";
import { FormSaveBar } from "@/components/ui/FormSaveBar";
import { useErrorBanner } from "@/context/ErrorBannerContext";
import { fetchLogoFromWebsite } from "@/lib/app-images";
import { deleteClient, emptyProperty, getClient, patchClient, saveClientBundle } from "@/lib/clients";
import { formatSupabaseError } from "@/lib/supabase-errors";

export function CompanyFormPage() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const { showError } = useErrorBanner();
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [fetchingLogo, setFetchingLogo] = useState(false);
  const [photoPath, setPhotoPath] = useState("");
  const uploadFolderId = useMemo(() => (isNew ? crypto.randomUUID() : id!), [isNew, id]);
  const [form, setForm] = useState({
    company_name: "",
    website: "",
    address: "",
    phone: "",
    email: "",
    notes: "",
    status: "active" as "lead" | "active" | "inactive",
  });

  useEffect(() => {
    if (isNew) return;
    getClient(id!)
      .then((row) => {
        if (!row) throw new Error("Company not found");
        setForm({
          company_name: row.company_name ?? "",
          website: row.website ?? "",
          address: row.address ?? "",
          phone: row.phone ?? "",
          email: row.email ?? "",
          notes: row.notes ?? "",
          status: row.status,
        });
        setPhotoPath(row.photo_path ?? "");
      })
      .catch((e) => showError(e.message))
      .finally(() => setLoading(false));
  }, [id, isNew, showError]);

  async function pullLogo() {
    if (!form.website.trim()) {
      showError("Enter a website URL first.");
      return;
    }
    setFetchingLogo(true);
    try {
      const { path } = await fetchLogoFromWebsite(form.website.trim());
      setPhotoPath(path);
      if (!isNew && id) {
        await patchClient(id, { photo_path: path });
      }
    } catch (e) {
      showError(e instanceof Error ? e.message : "Could not fetch logo");
    } finally {
      setFetchingLogo(false);
    }
  }

  async function persist(e?: FormEvent) {
    e?.preventDefault();
    if (!form.company_name.trim()) {
      showError("Enter a company name.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        company_name: form.company_name.trim(),
        website: form.website,
        address: form.address,
        phone: form.phone,
        email: form.email,
        notes: form.notes,
        status: form.status,
        client_type: "company" as const,
        photo_path: photoPath,
        first_name: "",
        last_name: "",
      };
      if (isNew) {
        const { client } = await saveClientBundle({
          client: payload,
          properties: form.address.trim() ? [emptyProperty({ street_1: form.address, is_primary: true, is_billing: true })] : [emptyProperty()],
          contacts: [],
        });
        navigate(`/companies/${client.id}`);
      } else {
        await patchClient(id!, payload);
        navigate("/companies/list");
      }
    } catch (err) {
      showError(formatSupabaseError(err));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!confirm("Delete this company?")) return;
    try {
      await deleteClient(id!);
      navigate("/companies/list");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  if (loading) return <p className="text-slate-500">Loading…</p>;

  const displayName = form.company_name || "Company";

  return (
    <div className="pb-24">
      <div className="mb-6 flex items-start justify-between">
        <Link to="/companies/list" className="text-sm text-slate-500 hover:text-slate-800">
          ← Companies
        </Link>
        {!isNew && (
          <button type="button" onClick={onDelete} className="text-sm text-red-600 hover:underline">
            Delete
          </button>
        )}
      </div>

      <div className="mb-6 flex items-center gap-3">
        <Avatar photoPath={photoPath} name={displayName} size={40} rounded="lg" />
        <h1 className="text-2xl font-bold text-[var(--mp-navy)]">{isNew ? "New company" : displayName}</h1>
      </div>

      <form onSubmit={persist} className="mx-auto max-w-lg space-y-4 rounded-xl border border-slate-200 bg-white p-6">
        <ImageCropUpload
          label="Logo"
          photoPath={photoPath}
          folder="contacts"
          folderId={uploadFolderId}
          displayName={displayName}
          onChange={setPhotoPath}
          onUploaded={isNew ? undefined : (path) => patchClient(id!, { photo_path: path }).catch((e) => showError(e.message))}
          onError={showError}
          round={false}
        />

        <label className="block text-sm">
          <span className="mb-1 block font-semibold text-slate-700">Company name *</span>
          <input
            required
            value={form.company_name}
            onChange={(e) => setForm({ ...form, company_name: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>

        <div>
          <p className="mb-2 text-sm font-semibold text-slate-700">Website &amp; logo</p>
          <div className="flex flex-wrap items-end gap-3">
            <label className="block min-w-[200px] flex-1 text-sm">
              <span className="mb-1 block text-xs font-semibold text-slate-500">Website</span>
              <input
                type="url"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="https://bunnings.co.nz"
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
        </div>

        <label className="block text-sm">
          <span className="mb-1 block font-semibold text-slate-700">Address</span>
          <input
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Street, city"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-slate-700">Phone</span>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-slate-700">Email</span>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          </label>
        </div>
        <label className="block text-sm">
          <span className="mb-1 block font-semibold text-slate-700">Notes</span>
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-semibold text-slate-700">Status</span>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as typeof form.status })} className="w-full rounded-lg border border-slate-300 px-3 py-2">
            <option value="lead">Lead</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
      </form>

      <FormSaveBar saving={saving} saveLabel="Save company" onSave={() => persist()} cancelTo="/companies/list" />
    </div>
  );
}
