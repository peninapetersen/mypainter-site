import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ExternalLink, RefreshCw } from "lucide-react";
import { ImageCropUpload } from "@/components/forms/ImageCropUpload";
import { Avatar } from "@/components/ui/Avatar";
import { FormSaveBar } from "@/components/ui/FormSaveBar";
import { contractorDisplayName, createContractor, deleteContractor, getContractor, patchContractor, updateContractor } from "@/lib/contractors";
import { fetchLogoFromWebsite } from "@/lib/app-images";
import { useErrorBanner } from "@/context/ErrorBannerContext";
import { formatSupabaseError } from "@/lib/supabase-errors";

export function ContractorFormPage() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const { showError } = useErrorBanner();
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [fetchingLogo, setFetchingLogo] = useState(false);
  const [form, setForm] = useState({
    name: "",
    company_name: "",
    email: "",
    phone: "",
    website: "",
    trade: "",
    hourly_rate: 0,
    day_rate: 0,
    notes: "",
    photo_path: "",
  });
  const uploadFolderId = useMemo(() => (isNew ? crypto.randomUUID() : id!), [isNew, id]);

  useEffect(() => {
    if (isNew) return;
    getContractor(id!)
      .then((row) => {
        if (!row) throw new Error("Contractor not found");
        setForm({
          name: row.name,
          company_name: row.company_name,
          email: row.email,
          phone: row.phone,
          website: row.website ?? "",
          trade: row.trade,
          hourly_rate: Number(row.hourly_rate) || 0,
          day_rate: Number(row.day_rate) || 0,
          notes: row.notes,
          photo_path: row.photo_path ?? "",
        });
      })
      .catch((e) => showError(formatSupabaseError(e)))
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
      setForm((f) => ({ ...f, photo_path: path }));
      if (!isNew && id) {
        await patchContractor(id, { photo_path: path });
      }
    } catch (e) {
      showError(e instanceof Error ? e.message : "Could not fetch logo");
    } finally {
      setFetchingLogo(false);
    }
  }

  async function persist(e?: FormEvent) {
    e?.preventDefault();
    setSaving(true);
    try {
      if (isNew) {
        const row = await createContractor(form);
        navigate(`/contractors/${row.id}`);
      } else {
        await updateContractor(id!, form);
        navigate("/contractors/list");
      }
    } catch (err) {
      showError(formatSupabaseError(err));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!confirm("Delete this contractor?")) return;
    try {
      await deleteContractor(id!);
      navigate("/contractors/list");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  if (loading) return <p className="text-slate-500">Loading…</p>;

  const displayName = contractorDisplayName(form);

  return (
    <div className="pb-24">
      <div className="mb-6 flex items-start justify-between">
        <Link to="/contractors/list" className="text-sm text-slate-500 hover:text-slate-800">
          ← Contractors
        </Link>
        {!isNew && (
          <button type="button" onClick={onDelete} className="text-sm text-red-600 hover:underline">
            Delete
          </button>
        )}
      </div>

      <div className="mb-6 flex items-center gap-3">
        <Avatar photoPath={form.photo_path} name={displayName} size={40} />
        <h1 className="text-2xl font-bold text-[var(--mp-navy)]">{isNew ? "New contractor" : displayName}</h1>
      </div>

      <form onSubmit={persist} className="mx-auto max-w-lg space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <ImageCropUpload
            label="Photo"
            photoPath={form.photo_path}
            folder="contractors"
            folderId={uploadFolderId}
            displayName={displayName || "Crew photo"}
            onChange={(photo_path) => setForm({ ...form, photo_path })}
            onUploaded={isNew ? undefined : (path) => patchContractor(id!, { photo_path: path }).catch((e) => showError(e.message))}
            onError={showError}
          />
          <p className="mt-2 text-xs text-slate-500">Upload a headshot, or pull a logo from their website below.</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-700">Website &amp; logo</p>
            <div className="flex flex-wrap items-end gap-3">
              <label className="block min-w-[200px] flex-1 text-sm">
                <span className="mb-1 block text-xs font-semibold text-slate-500">Website</span>
                <input
                  type="url"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  placeholder="https://"
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
        </div>

        <label className="block text-sm">
          <span className="mb-1 block text-xs font-semibold text-slate-500">Company / trading name</span>
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
        <label className="block text-sm">
          <span className="mb-1 block text-xs font-semibold text-slate-500">Trade</span>
          <input
            value={form.trade}
            onChange={(e) => setForm({ ...form, trade: e.target.value })}
            placeholder="e.g. Painter, Plasterer, Scaffolder"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-semibold text-slate-500">Phone</span>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-semibold text-slate-500">Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-semibold text-slate-500">Hourly rate ($)</span>
            <input
              type="number"
              min={0}
              step={0.01}
              value={form.hourly_rate || ""}
              onChange={(e) => setForm({ ...form, hourly_rate: Number(e.target.value) || 0 })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-semibold text-slate-500">Day rate ($)</span>
            <input
              type="number"
              min={0}
              step={0.01}
              value={form.day_rate || ""}
              onChange={(e) => setForm({ ...form, day_rate: Number(e.target.value) || 0 })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
        </div>
        <p className="text-xs text-slate-500">Hourly rate is used first for time estimates; day rate applies if hourly is blank.</p>
        <label className="block text-sm">
          <span className="mb-1 block text-xs font-semibold text-slate-500">Notes</span>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={4}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
      </form>

      <FormSaveBar saving={saving} saveLabel="Save contractor" onSave={() => persist()} cancelTo="/contractors/list" />
    </div>
  );
}
