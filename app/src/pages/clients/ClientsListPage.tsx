import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { useErrorBanner } from "@/context/ErrorBannerContext";
import { clientDisplayName } from "@/lib/client-display";
import { listClients } from "@/lib/clients";
import type { Client } from "@/types/entities";

export function ClientsListPage() {
  const { showError } = useErrorBanner();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listClients()
      .then(setClients)
      .catch((e) => showError(e.message))
      .finally(() => setLoading(false));
  }, [showError]);

  return (
    <div>
      <PageHeader
        title="Clients"
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
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="hidden px-4 py-3 sm:table-cell">Phone</th>
                <th className="hidden px-4 py-3 md:table-cell">Email</th>
                <th className="hidden px-4 py-3 lg:table-cell">Lead source</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link to={`/clients/${c.id}`} className="font-semibold text-[var(--mp-navy)] hover:underline">
                      {clientDisplayName(c)}
                    </Link>
                    {c.company_name && (c.first_name || c.last_name) && (
                      <p className="text-xs text-slate-400">{[c.first_name, c.last_name].filter(Boolean).join(" ")}</p>
                    )}
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">{c.phone || "—"}</td>
                  <td className="hidden px-4 py-3 md:table-cell">{c.email || "—"}</td>
                  <td className="hidden px-4 py-3 lg:table-cell">{c.lead_source || "—"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={c.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
