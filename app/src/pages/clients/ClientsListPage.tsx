import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ContactDataTable } from "@/components/contacts/ContactDataTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { useErrorBanner } from "@/context/ErrorBannerContext";
import { clientDisplayName } from "@/lib/client-display";
import { loadContactListColumns, visibleColumnsForList } from "@/lib/contact-list-columns";
import { deleteClient, listCompanies, listCustomers, patchClient } from "@/lib/clients";
import { formatSupabaseError } from "@/lib/supabase-errors";
import type { Client } from "@/types/entities";

function customerValues(c: Client, companyNames: Map<string, string>): Record<string, string> {
  const linked = c.company_client_id ? companyNames.get(c.company_client_id) : "";
  return {
    first_name: c.first_name ?? "",
    last_name: c.last_name ?? "",
    company: linked || c.company_name?.trim() || "",
    phone: c.phone ?? "",
    email: c.email ?? "",
    website: c.website ?? "",
    lead_source: c.lead_source ?? "",
    status: c.status,
  };
}

export function ClientsListPage() {
  const { showError } = useErrorBanner();
  const [search, setSearch] = useSearchParams();
  const [clients, setClients] = useState<Client[]>([]);
  const [companyNames, setCompanyNames] = useState<Map<string, string>>(new Map());
  const [columns, setColumns] = useState(visibleColumnsForList("customers", { customers: { visible: [] }, companies: { visible: [] }, suppliers: { visible: [] }, contractors: { visible: [] } }));
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const clientsRef = useRef(clients);
  clientsRef.current = clients;
  const savedName = search.get("saved") === "1" ? search.get("name") : null;
  const propsWarn = search.get("warn") === "properties";

  const reload = useCallback(() => {
    return Promise.all([listCustomers(), listCompanies(), loadContactListColumns()])
      .then(([rows, companies, colConfig]) => {
        setClients(rows);
        setCompanyNames(new Map(companies.map((c) => [c.id, clientDisplayName(c)])));
        setColumns(visibleColumnsForList("customers", colConfig));
      })
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

  async function saveCell(id: string, columnId: string) {
    const client = clientsRef.current.find((c) => c.id === id);
    if (!client) return;

    if (columnId === "first_name" || columnId === "last_name") {
      const first_name = client.first_name?.trim() ?? "";
      const last_name = client.last_name?.trim() ?? "";
      if (!first_name && !last_name && !client.company_name?.trim()) {
        showError("Enter a first name, last name, or company name.");
        await reload();
        return;
      }
    }

    const patch: Partial<Client> = {};
    if (columnId === "first_name") patch.first_name = client.first_name;
    if (columnId === "last_name") patch.last_name = client.last_name;
    if (columnId === "phone") patch.phone = client.phone;
    if (columnId === "email") patch.email = client.email;
    if (columnId === "website") patch.website = client.website;
    if (columnId === "lead_source") patch.lead_source = client.lead_source;

    setSavingId(id);
    try {
      const saved = await patchClient(id, patch);
      updateLocal(id, saved);
    } catch (e) {
      showError(formatSupabaseError(e));
      await reload();
    } finally {
      setSavingId(null);
    }
  }

  async function onDelete(id: string) {
    const client = clientsRef.current.find((c) => c.id === id);
    if (!client) return;
    setDeletingId(id);
    try {
      await deleteClient(id);
      setClients((rows) => rows.filter((c) => c.id !== id));
    } catch (e) {
      showError(formatSupabaseError(e));
    } finally {
      setDeletingId(null);
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
        title="Customers"
        backTo="/clients"
        actions={
          <Link to="/clients/new" className="rounded-lg bg-[var(--mp-orange)] px-4 py-2 text-sm font-bold text-white">
            + New customer
          </Link>
        }
      />
      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : clients.length === 0 ? (
        <EmptyState message="No customers yet." actionLabel="Add first customer" actionTo="/clients/new" />
      ) : (
        <ContactDataTable
          columns={columns}
          rows={clients.map((c) => ({
            id: c.id,
            editHref: `/clients/${c.id}`,
            deleteLabel: clientDisplayName(c),
            values: customerValues(c, companyNames),
            status: c.status,
          }))}
          savingId={savingId}
          deletingId={deletingId}
          onCellChange={(id, columnId, value) => {
            const key = columnId as keyof Client;
            updateLocal(id, { [key]: value } as Partial<Client>);
          }}
          onCellSave={saveCell}
          onDelete={onDelete}
          onCancelRow={() => reload()}
        />
      )}
    </div>
  );
}
