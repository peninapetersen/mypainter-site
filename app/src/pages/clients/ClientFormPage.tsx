import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/ui/PageHeader";
import { useErrorBanner } from "@/context/ErrorBannerContext";
import { createClient, deleteClient, getClient, updateClient } from "@/lib/clients";

export function ClientFormPage() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const { showError } = useErrorBanner();
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    status: "lead" as "lead" | "active" | "inactive",
    notes: "",
  });

  useEffect(() => {
    if (isNew) return;
    getClient(id!)
      .then((c) => {
        if (!c) throw new Error("Client not found");
        setForm({ name: c.name, email: c.email, phone: c.phone, address: c.address, status: c.status, notes: c.notes });
      })
      .catch((e) => showError(e.message))
      .finally(() => setLoading(false));
  }, [id, isNew, showError]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (isNew) {
        const c = await createClient(form);
        navigate(`/clients/${c.id}`);
      } else {
        await updateClient(id!, form);
        navigate("/clients");
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!confirm("Delete this client?")) return;
    try {
      await deleteClient(id!);
      navigate("/clients");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  if (loading) return <p className="text-slate-500">Loading…</p>;

  return (
    <div>
      <PageHeader title={isNew ? "New client" : "Edit client"} backTo="/clients" />
      <form onSubmit={onSubmit} className="max-w-xl space-y-4 rounded-xl border border-slate-200 bg-white p-6">
        <label className="block text-sm font-semibold">
          Name *
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" />
        </label>
        <label className="block text-sm font-semibold">
          Email
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" />
        </label>
        <label className="block text-sm font-semibold">
          Phone
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" />
        </label>
        <label className="block text-sm font-semibold">
          Address
          <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} className="mt-1 w-full rounded-lg border px-3 py-2" />
        </label>
        <label className="block text-sm font-semibold">
          Status
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as typeof form.status })} className="mt-1 w-full rounded-lg border px-3 py-2">
            <option value="lead">Lead</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
        <label className="block text-sm font-semibold">
          Notes
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="mt-1 w-full rounded-lg border px-3 py-2" />
        </label>
        <div className="flex flex-wrap gap-3 pt-2">
          <button type="submit" disabled={saving} className="rounded-lg bg-[var(--mp-orange)] px-5 py-2 font-bold text-white disabled:opacity-60">
            {saving ? "Saving…" : "Save"}
          </button>
          <Link to="/clients" className="rounded-lg border px-5 py-2 font-semibold">
            Cancel
          </Link>
          {!isNew && (
            <button type="button" onClick={onDelete} className="ml-auto text-sm text-red-600 hover:underline">
              Delete client
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
