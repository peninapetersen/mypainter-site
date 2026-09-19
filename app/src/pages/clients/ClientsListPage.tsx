import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Pencil } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { ListDeleteButton } from "@/components/ui/ListDeleteButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { useErrorBanner } from "@/context/ErrorBannerContext";
import { clientDisplayName } from "@/lib/client-display";
import { deleteClient, listClients, patchClient } from "@/lib/clients";
import { formatSupabaseError } from "@/lib/supabase-errors";
import type { Client } from "@/types/entities";

export function ClientsListPage() {
  const { showError } = useErrorBanner();
  const [search, setSearch] = useSearchParams();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const clientsRef = useRef(clients);
  clientsRef.current = clients;
  const savedName = search.get("saved") === "1" ? search.get("name") : null;
  const propsWarn = search.get("warn") === "properties";

  const reload = useCallback(() => {
    return listClients()
      .then(setClients)
      .catch((e) => showError(e.message));
  }, [showError]);

  useEffect(() => {
    reload().finally(() => setLoading(false));
  }, [reload]);

  useEffect(() => {
    if (savedName) {
      const t = setTimeout(() => setSearch({}, { replace: true }), 8000);
      return () => clearTimeout(t);
    }
  }, [savedName, setSearch]);

  function updateLocal(id: string, patch: Partial<Client>) {
    setClients((rows) => rows.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  async function saveName(id: string) {
    const client = clientsRef.current.find((c) => c.id === id);
    if (!client) return;
    const first_name = client.first_name?.trim() ?? "";
    const last_name = client.last_name?.trim() ?? "";
    if (!first_name && !last_name && !client.company_name?.trim()) {
      showError("Enter a first name, last name, or company name.");
      await reload();
      return;
    }
    setSavingId(id);
    try {
      const saved = await patchClient(id, { first_name, last_name });
      updateLocal(id, saved);
    } catch (e) {
      showError(formatSupabaseError(e));
      await reload();
    } finally {
      setSavingId(null);
    }
  }

  async function onDelete(client: Client) {
    setDeletingId(client.id);
    try {
      await deleteClient(client.id);
      setClients((rows) => rows.filter((c) => c.id !== client.id));
    } catch (e) {
      showError(formatSupabaseError(e));
    } finally {
      setDeletingId(null);
    }
  }

  function onNameKeyDown(e: React.KeyboardEvent, id: string) {
    if (e.key === "Enter") {
      e.preventDefault();
      (e.target as HTMLInputElement).blur();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      void reload();
    }
  }

  return (
    <div>
      {savedName && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <strong>{savedName}</strong> saved.
          {propsWarn && (
            <span className="mt-1 block text-amber-800">
              Property address not saved — run migration 002 in Supabase for full Jobber client fields.
            </span>
          )}
        </div>
      )}
      <PageHeader
        title="Clients"
        backTo="/clients"
        actions={
          <Link to="/clients/new" className="rounded-lg bg-[var(--mp-orange)] px-4 py-2 text-sm font-bold text-white">
            + New client
          </Link>
        }
      />
      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : clients.length === 0 ? (
        <EmptyState message="No clients yet." actionLabel="Add first client" actionTo="/clients/new" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-3">First name</th>
                <th className="px-3 py-3">Last name</th>
                <th className="hidden px-3 py-3 md:table-cell">Company</th>
                <th className="hidden px-3 py-3 lg:table-cell">Phone</th>
                <th className="hidden px-3 py-3 xl:table-cell">Email</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-slate-50/80">
                  <td className="px-3 py-2">
                    <input
                      value={c.first_name ?? ""}
                      placeholder="First name"
                      disabled={savingId === c.id || deletingId === c.id}
                      onChange={(e) => updateLocal(c.id, { first_name: e.target.value })}
                      onBlur={() => void saveName(c.id)}
                      onKeyDown={(e) => onNameKeyDown(e, c.id)}
                      className="w-full min-w-[7rem] rounded border border-slate-200 bg-white px-2 py-1.5 text-sm font-medium text-[var(--mp-navy)] focus:border-[var(--mp-orange)] focus:outline-none focus:ring-1 focus:ring-[var(--mp-orange)]"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={c.last_name ?? ""}
                      placeholder="Last name"
                      disabled={savingId === c.id || deletingId === c.id}
                      onChange={(e) => updateLocal(c.id, { last_name: e.target.value })}
                      onBlur={() => void saveName(c.id)}
                      onKeyDown={(e) => onNameKeyDown(e, c.id)}
                      className="w-full min-w-[7rem] rounded border border-slate-200 bg-white px-2 py-1.5 text-sm focus:border-[var(--mp-orange)] focus:outline-none focus:ring-1 focus:ring-[var(--mp-orange)]"
                    />
                  </td>
                  <td className="hidden px-3 py-3 md:table-cell">{c.company_name?.trim() || "—"}</td>
                  <td className="hidden px-3 py-3 lg:table-cell">{c.phone || "—"}</td>
                  <td className="hidden px-3 py-3 xl:table-cell">{c.email || "—"}</td>
                  <td className="px-3 py-3">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {savingId === c.id && <span className="text-xs text-slate-400">Saving…</span>}
                      <Link
                        to={`/clients/${c.id}`}
                        title="Full edit"
                        className="inline-flex rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-[var(--mp-navy)]"
                      >
                        <Pencil size={16} />
                      </Link>
                      <ListDeleteButton
                        label={clientDisplayName(c)}
                        deleting={deletingId === c.id}
                        onDelete={() => onDelete(c)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-400">
            Edit first or last name inline — saves when you click away. Press Enter to save, Esc to undo.
          </p>
        </div>
      )}
    </div>
  );
}
