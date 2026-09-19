import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Wallet } from "lucide-react";
import { ExpenseReceiptScan } from "@/components/forms/ExpenseReceiptScan";
import { useErrorBanner } from "@/context/ErrorBannerContext";
import {
  EXPENSE_CATEGORIES,
  REIMBURSE_OPTIONS,
  createExpense,
  deleteExpense,
  expenseFromScan,
  getExpense,
  updateExpense,
} from "@/lib/expenses";
import { listJobs } from "@/lib/jobs";
import { todayIsoDate } from "@/lib/line-items";
import { formatCurrency } from "@/lib/nz";
import { getReceiptImageUrl, uploadReceiptImage } from "@/lib/receipt-images";
import type { Expense, ExpenseCategory, Job, ReceiptScanResult } from "@/types/entities";

export function ExpenseFormPage() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const { showError } = useErrorBanner();
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [form, setForm] = useState({
    job_id: "",
    item_name: "",
    description: "",
    merchant: "",
    amount: 0,
    gst_amount: 0,
    gst_inclusive: true,
    category: "COGS_Materials" as ExpenseCategory,
    accounting_code: "",
    reimburse_to: REIMBURSE_OPTIONS[0],
    expense_date: todayIsoDate(),
    receipt_path: "",
    ai_extracted: {} as Record<string, unknown>,
  });

  useEffect(() => {
    listJobs().then(setJobs).catch(() => setJobs([]));
  }, []);

  useEffect(() => {
    if (isNew) return;
    getExpense(id!)
      .then(async (e) => {
        if (!e) throw new Error("Expense not found");
        setForm({
          job_id: e.job_id ?? "",
          item_name: e.item_name,
          description: e.description,
          merchant: e.merchant,
          amount: Number(e.amount),
          gst_amount: Number(e.gst_amount),
          gst_inclusive: e.gst_inclusive,
          category: e.category,
          accounting_code: e.accounting_code,
          reimburse_to: e.reimburse_to,
          expense_date: e.expense_date ?? todayIsoDate(),
          receipt_path: e.receipt_path,
          ai_extracted: e.ai_extracted ?? {},
        });
        setScanned(true);
        if (e.receipt_path) {
          getReceiptImageUrl(e.receipt_path)
            .then(setReceiptPreview)
            .catch(() => {});
        }
      })
      .catch((e) => showError(e.message))
      .finally(() => setLoading(false));
  }, [id, isNew, showError]);

  function applyScan(file: File, scan: ReceiptScanResult, raw: Record<string, unknown>) {
    setReceiptFile(file);
    setReceiptPreview(URL.createObjectURL(file));
    setScanned(true);
    setForm((f) => ({
      ...f,
      ...expenseFromScan(scan, f.receipt_path, raw),
      job_id: f.job_id,
    }));
  }

  async function persist(e?: FormEvent) {
    e?.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        job_id: form.job_id || null,
        amount: Number(form.amount),
        gst_amount: Number(form.gst_amount),
      };
      if (isNew) {
        const draft = await createExpense({ ...payload, receipt_path: "" });
        let receipt_path = form.receipt_path;
        if (receiptFile) {
          receipt_path = await uploadReceiptImage(receiptFile, draft.id);
          await updateExpense(draft.id, { receipt_path });
        }
        navigate(`/expenses/${draft.id}`);
      } else {
        if (receiptFile) {
          const receipt_path = await uploadReceiptImage(receiptFile, id!);
          payload.receipt_path = receipt_path;
        }
        await updateExpense(id!, payload);
        navigate("/expenses/list");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Save failed";
      showError(msg.includes("item_name") || msg.includes("ai_extracted") ? `${msg} — run migration 004 in Supabase first.` : msg);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!confirm("Delete this expense?")) return;
    try {
      await deleteExpense(id!);
      navigate("/expenses");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  if (loading) return <p className="text-slate-500">Loading…</p>;

  return (
    <div className="pb-24">
      <div className="mb-6 flex items-start justify-between">
        <Link to="/expenses" className="text-sm text-slate-500 hover:text-slate-800">
          ← Back
        </Link>
        {!isNew && (
          <button type="button" onClick={onDelete} className="text-sm text-red-600 hover:underline">
            Delete
          </button>
        )}
      </div>

      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
          <Wallet size={22} />
        </span>
        <h1 className="text-2xl font-bold text-[var(--mp-navy)]">{isNew ? "New expense" : "Edit expense"}</h1>
      </div>

      <form onSubmit={persist} className="mx-auto max-w-lg space-y-5">
        {isNew && !scanned && <ExpenseReceiptScan onScanned={applyScan} onError={showError} disabled={saving} />}

        {scanned && (
          <>
            {isNew && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                Receipt read — check the details below, then save. No typing required unless something looks wrong.
              </div>
            )}

            {receiptPreview && (
              <img src={receiptPreview} alt="Receipt" className="max-h-40 rounded-lg border border-slate-200" />
            )}

            {isNew && (
              <button
                type="button"
                className="text-sm font-semibold text-[var(--mp-orange)] underline"
                onClick={() => {
                  setScanned(false);
                  setReceiptFile(null);
                  setReceiptPreview(null);
                }}
              >
                Retake receipt photo
              </button>
            )}

            <label className="block text-sm">
              <span className="mb-1 block text-xs font-semibold text-slate-500">Date</span>
              <input
                type="date"
                value={form.expense_date}
                onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block text-xs font-semibold text-slate-500">Item name</span>
              <input
                value={form.item_name}
                onChange={(e) => setForm({ ...form, item_name: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block text-xs font-semibold text-slate-500">Description</span>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block text-xs font-semibold text-slate-500">Total</span>
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
              {form.gst_amount > 0 && (
                <p className="mt-1 text-xs text-slate-500">Includes GST {formatCurrency(form.gst_amount)}</p>
              )}
            </label>

            <label className="block text-sm">
              <span className="mb-1 block text-xs font-semibold text-slate-500">Search jobs</span>
              <select
                value={form.job_id}
                onChange={(e) => setForm({ ...form, job_id: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="">— No job —</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.number} — {j.title || "Untitled job"}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="mb-1 block text-xs font-semibold text-slate-500">Accounting code</span>
              <input
                value={form.accounting_code}
                onChange={(e) => setForm({ ...form, accounting_code: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block text-xs font-semibold text-slate-500">Category</span>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as ExpenseCategory })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="mb-1 block text-xs font-semibold text-slate-500">Reimburse to</span>
              <select
                value={form.reimburse_to}
                onChange={(e) => setForm({ ...form, reimburse_to: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                {REIMBURSE_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </label>

            {form.merchant && <p className="text-xs text-slate-500">Merchant: {form.merchant}</p>}
          </>
        )}
      </form>

      {scanned && (
        <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-slate-200 bg-white px-4 py-3 md:left-56">
          <div className="mx-auto flex max-w-lg items-center justify-end gap-3">
            <Link to="/expenses" className="rounded-lg border border-[var(--mp-orange)] px-5 py-2 text-sm font-bold text-[var(--mp-orange)]">
              Cancel
            </Link>
            <button
              type="button"
              disabled={saving}
              onClick={() => persist()}
              className="rounded-lg bg-[var(--mp-orange)] px-5 py-2 text-sm font-bold text-white disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save expense"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
