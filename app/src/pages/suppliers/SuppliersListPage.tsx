import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ContactDataTable } from "@/components/contacts/ContactDataTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { useErrorBanner } from "@/context/ErrorBannerContext";
import { loadContactListColumns, visibleColumnsForList } from "@/lib/contact-list-columns";
import { deleteSupplier, listSuppliers, patchSupplier, supplierDisplayName } from "@/lib/suppliers";
import { formatSupabaseError } from "@/lib/supabase-errors";
import type { Supplier } from "@/types/entities";

function supplierValues(s: Supplier): Record<string, string> {
  return {
    company_name: s.company_name ?? "",
    name: s.name ?? "",
    phone: s.phone ?? "",
    email: s.email ?? "",
    website: s.website ?? "",
    account_code: s.default_account_code || s.account_code || "",
    gst_number: s.gst_number ?? "",
  };
}

export function SuppliersListPage() {
  const { showError } = useErrorBanner();
  const [rows, setRows] = useState<Supplier[]>([]);
  const [columns, setColumns] = useState(visibleColumnsForList("suppliers", { customers: { visible: [] }, companies: { visible: [] }, suppliers: { visible: [] }, contractors: { visible: [] } }));
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const rowsRef = useRef(rows);
  rowsRef.current = rows;

  const reload = useCallback(() => {
    return Promise.all([listSuppliers(), loadContactListColumns()])
      .then(([list, colConfig]) => {
        setRows(list);
        setColumns(visibleColumnsForList("suppliers", colConfig));
      })
      .catch((e) => showError(e.message));
  }, [showError]);

  useEffect(() => {
    reload().finally(() => setLoading(false));
  }, [reload]);

  function updateLocal(id: string, patch: Partial<Supplier>) {
    setRows((list) => list.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  async function saveCell(id: string, columnId: string) {
    const row = rowsRef.current.find((r) => r.id === id);
    if (!row) return;
    if (columnId === "company_name" && !row.company_name?.trim() && !row.name?.trim()) {
      showError("Enter a supplier or contact name.");
      await reload();
      return;
    }

    const patch: Partial<Supplier> = {};
    if (columnId === "company_name") patch.company_name = row.company_name;
    if (columnId === "name") patch.name = row.name;
    if (columnId === "phone") patch.phone = row.phone;
    if (columnId === "email") patch.email = row.email;
    if (columnId === "website") patch.website = row.website;
    if (columnId === "account_code") {
      patch.default_account_code = row.default_account_code || row.account_code;
      patch.account_code = patch.default_account_code;
    }
    if (columnId === "gst_number") patch.gst_number = row.gst_number;

    setSavingId(id);
    try {
      const saved = await patchSupplier(id, patch);
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
      await deleteSupplier(id);
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
        title="Suppliers"
        subtitle="Paint shops, hire companies, and material suppliers."
        actions={
          <Link to="/suppliers/new" className="rounded-lg bg-[var(--mp-orange)] px-4 py-2 text-sm font-bold text-white hover:opacity-90">
            New supplier
          </Link>
        }
      />

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : rows.length === 0 ? (
        <EmptyState message="No suppliers yet." actionLabel="Add supplier" actionTo="/suppliers/new" />
      ) : (
        <ContactDataTable
          columns={columns}
          rows={rows.map((r) => ({
            id: r.id,
            editHref: `/suppliers/${r.id}`,
            deleteLabel: supplierDisplayName(r),
            values: supplierValues(r),
          }))}
          savingId={savingId}
          deletingId={deletingId}
          onCellChange={(id, columnId, value) => {
            if (columnId === "account_code") {
              updateLocal(id, { default_account_code: value, account_code: value });
              return;
            }
            updateLocal(id, { [columnId]: value } as Partial<Supplier>);
          }}
          onCellSave={saveCell}
          onDelete={onDelete}
          onCancelRow={() => reload()}
        />
      )}
    </div>
  );
}
