import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ContactDataTable } from "@/components/contacts/ContactDataTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { useErrorBanner } from "@/context/ErrorBannerContext";
import { loadContactListColumns, visibleColumnsForList } from "@/lib/contact-list-columns";
import { contractorDisplayName, deleteContractor, listContractors, patchContractor } from "@/lib/contractors";
import { formatSupabaseError } from "@/lib/supabase-errors";
import type { Contractor } from "@/types/entities";

function contractorValues(c: Contractor): Record<string, string> {
  return {
    company_name: c.company_name ?? "",
    name: c.name ?? "",
    trade: c.trade ?? "",
    phone: c.phone ?? "",
    email: c.email ?? "",
    hourly_rate: c.hourly_rate ? String(c.hourly_rate) : "",
    day_rate: c.day_rate ? String(c.day_rate) : "",
  };
}

export function ContractorsListPage() {
  const { showError } = useErrorBanner();
  const [rows, setRows] = useState<Contractor[]>([]);
  const [columns, setColumns] = useState(visibleColumnsForList("contractors", { customers: { visible: [] }, companies: { visible: [] }, suppliers: { visible: [] }, contractors: { visible: [] } }));
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const rowsRef = useRef(rows);
  rowsRef.current = rows;

  const reload = useCallback(() => {
    return Promise.all([listContractors(), loadContactListColumns()])
      .then(([list, colConfig]) => {
        setRows(list);
        setColumns(visibleColumnsForList("contractors", colConfig));
      })
      .catch((e) => showError(e.message));
  }, [showError]);

  useEffect(() => {
    reload().finally(() => setLoading(false));
  }, [reload]);

  function updateLocal(id: string, patch: Partial<Contractor>) {
    setRows((list) => list.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  async function saveCell(id: string, columnId: string) {
    const row = rowsRef.current.find((r) => r.id === id);
    if (!row) return;

    const patch: Partial<Contractor> = {};
    if (columnId === "company_name") patch.company_name = row.company_name;
    if (columnId === "name") patch.name = row.name;
    if (columnId === "trade") patch.trade = row.trade;
    if (columnId === "phone") patch.phone = row.phone;
    if (columnId === "email") patch.email = row.email;
    if (columnId === "hourly_rate") patch.hourly_rate = Number(row.hourly_rate) || 0;
    if (columnId === "day_rate") patch.day_rate = Number(row.day_rate) || 0;

    setSavingId(id);
    try {
      const saved = await patchContractor(id, patch);
      updateLocal(id, saved);
    } catch (e) {
      showError(formatSupabaseError(e));
      await reload();
    } finally {
      setSavingId(null);
    }
  }

  async function onDelete(id: string) {
    const row = rowsRef.current.find((r) => r.id === id);
    if (!row) return;
    setDeletingId(id);
    try {
      await deleteContractor(id);
      setRows((list) => list.filter((r) => r.id !== id));
    } catch (e) {
      showError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Contractors"
        subtitle="Subcontractors and crew — hourly or day rates for time estimates."
        actions={
          <Link to="/contractors/new" className="rounded-lg bg-[var(--mp-orange)] px-4 py-2 text-sm font-bold text-white hover:opacity-90">
            New contractor
          </Link>
        }
      />

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : rows.length === 0 ? (
        <EmptyState message="No contractors yet." actionLabel="Add contractor" actionTo="/contractors/new" />
      ) : (
        <ContactDataTable
          columns={columns}
          rows={rows.map((r) => ({
            id: r.id,
            editHref: `/contractors/${r.id}`,
            deleteLabel: contractorDisplayName(r),
            values: contractorValues(r),
          }))}
          savingId={savingId}
          deletingId={deletingId}
          onCellChange={(id, columnId, value) => {
            if (columnId === "hourly_rate" || columnId === "day_rate") {
              updateLocal(id, { [columnId]: Number(value) || 0 } as Partial<Contractor>);
              return;
            }
            updateLocal(id, { [columnId]: value } as Partial<Contractor>);
          }}
          onCellSave={saveCell}
          onDelete={onDelete}
          onCancelRow={() => reload()}
        />
      )}
    </div>
  );
}
