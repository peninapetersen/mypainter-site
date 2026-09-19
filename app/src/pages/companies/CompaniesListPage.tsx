import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ContactDataTable } from "@/components/contacts/ContactDataTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { useErrorBanner } from "@/context/ErrorBannerContext";
import { clientDisplayName } from "@/lib/client-display";
import { loadContactListColumns, visibleColumnsForList } from "@/lib/contact-list-columns";
import { deleteClient, listCompanies, patchClient } from "@/lib/clients";
import { formatSupabaseError } from "@/lib/supabase-errors";
import type { Client } from "@/types/entities";

function companyValues(c: Client): Record<string, string> {
  return {
    company_name: c.company_name ?? "",
    website: c.website ?? "",
    address: c.address ?? "",
    phone: c.phone ?? "",
    email: c.email ?? "",
    status: c.status,
  };
}

export function CompaniesListPage() {
  const { showError } = useErrorBanner();
  const [rows, setRows] = useState<Client[]>([]);
  const [columns, setColumns] = useState(visibleColumnsForList("companies", { customers: { visible: [] }, companies: { visible: [] }, suppliers: { visible: [] }, contractors: { visible: [] } }));
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const rowsRef = useRef(rows);
  rowsRef.current = rows;

  const reload = useCallback(() => {
    return Promise.all([listCompanies(), loadContactListColumns()])
      .then(([list, colConfig]) => {
        setRows(list);
        setColumns(visibleColumnsForList("companies", colConfig));
      })
      .catch((e) => showError(e.message));
  }, [showError]);

  useEffect(() => {
    reload().finally(() => setLoading(false));
  }, [reload]);

  function updateLocal(id: string, patch: Partial<Client>) {
    setRows((list) => list.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  async function saveCell(id: string, columnId: string) {
    const row = rowsRef.current.find((c) => c.id === id);
    if (!row) return;
    if (columnId === "company_name" && !row.company_name?.trim()) {
      showError("Company name is required.");
      await reload();
      return;
    }

    const patch: Partial<Client> = {};
    if (columnId === "company_name") patch.company_name = row.company_name;
    if (columnId === "website") patch.website = row.website;
    if (columnId === "address") patch.address = row.address;
    if (columnId === "phone") patch.phone = row.phone;
    if (columnId === "email") patch.email = row.email;

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
    const row = rowsRef.current.find((c) => c.id === id);
    if (!row) return;
    setDeletingId(id);
    try {
      await deleteClient(id);
      setRows((list) => list.filter((c) => c.id !== id));
    } catch (e) {
      showError(formatSupabaseError(e));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Companies"
        subtitle="Organisation records — link from customer contacts."
        backTo="/clients"
        actions={
          <Link to="/companies/new" className="rounded-lg bg-[var(--mp-orange)] px-4 py-2 text-sm font-bold text-white">
            + New company
          </Link>
        }
      />
      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : rows.length === 0 ? (
        <EmptyState message="No companies yet." actionLabel="Add first company" actionTo="/companies/new" />
      ) : (
        <ContactDataTable
          columns={columns}
          rows={rows.map((c) => ({
            id: c.id,
            editHref: `/companies/${c.id}`,
            deleteLabel: clientDisplayName(c),
            avatarName: clientDisplayName(c),
            photoPath: c.photo_path,
            avatarRounded: "lg" as const,
            values: companyValues(c),
            status: c.status,
          }))}
          savingId={savingId}
          deletingId={deletingId}
          onCellChange={(id, columnId, value) => updateLocal(id, { [columnId]: value } as Partial<Client>)}
          onCellSave={saveCell}
          onDelete={onDelete}
          onCancelRow={() => reload()}
        />
      )}
    </div>
  );
}
