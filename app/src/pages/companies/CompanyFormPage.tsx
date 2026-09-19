import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ImageCropUpload } from "@/components/forms/ImageCropUpload";
import { FormSaveBar } from "@/components/ui/FormSaveBar";
import { useErrorBanner } from "@/context/ErrorBannerContext";
import { deleteClient, emptyProperty, getClient, patchClient, saveClientBundle } from "@/lib/clients";
import { formatSupabaseError } from "@/lib/supabase-errors";

export function CompanyFormPage() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const { showError } = useErrorBanner();
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [photoPath, setPhotoPath] = useState("");
  const uploadFolderId = useMemo(() => (isNew ? crypto.randomUUID() : id!), [isNew, id]);
  const [form, setForm] = useState({
    company_name: "",
    website: "",
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
          properties: [emptyProperty()],
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

      <h1 className="mb-6 text-2xl font-bold text-[var(--mp-navy)]">
        {isNew ? "New company" : form.company_name || "Edit company"}
      </h1>

      <form onSubmit={persist} className="mx-auto max-w-lg space-y-4 rounded-xl border border-slate-200 bg-white p-6">
        <ImageCropUpload
          label="Logo / photo"
          photoPath={photoPath}
          folder="contacts"
          folderId={uploadFolderId}
          displayName={form.company_name || "Company"}
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
        <label className="block text-sm">
          <span className="mb-1 block font-semibold text-slate-700">Website</span>
          <input
            type="url"
            value={form.website}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
            placeholder="https://"
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
