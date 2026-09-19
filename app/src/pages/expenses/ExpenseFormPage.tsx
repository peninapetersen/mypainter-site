import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Wallet } from "lucide-react";
import { ExpenseMaterialPicker } from "@/components/forms/ExpenseMaterialPicker";
import { ExpenseReceiptScan } from "@/components/forms/ExpenseReceiptScan";
import { EntityWorkflowBar } from "@/components/workflow/EntityWorkflowBar";
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
import { accountCodeLabel, listAccountCodes } from "@/lib/account-codes";
import {
  EXPENSE_CATEGORY_CODES,
  EXPENSE_MATERIAL_PRESETS,
  findMaterialPreset,
  type ExpenseMaterialPreset,
} from "@/lib/expense-materials";
import { getInvoice, listInvoices } from "@/lib/invoices";
import { getJob, listJobs } from "@/lib/jobs";
import { getQuote, listQuotes } from "@/lib/quotes";
import { todayIsoDate } from "@/lib/line-items";
import { formatCurrency } from "@/lib/nz";
import { getReceiptImageUrl, uploadReceiptImage } from "@/lib/receipt-images";
import type { AccountCode, Expense, ExpenseCategory, Invoice, Job, Quote, ReceiptScanResult } from "@/types/entities";

export function ExpenseFormPage() {
  const { id } = useParams();
  const [search] = useSearchParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const { showError } = useErrorBanner();
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const hasLink = !!(search.get("fromJob") || search.get("fromQuote") || search.get("fromJobsOn") || search.get("fromInvoice"));
  const [manualEntry, setManualEntry] = useState(hasLink);
  const [scanned, setScanned] = useState(hasLink);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenseCodes, setExpenseCodes] = useState<AccountCode[]>([]);
  const [form, setForm] = useState({
    job_id: search.get("fromJob") ?? "",
    quote_id: search.get("fromQuote") ?? "",
    jobs_on_id: search.get("fromJobsOn") ?? "",
    invoice_id: search.get("fromInvoice") ?? "",
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
    Promise.all([listJobs(), listQuotes(), listInvoices(), listAccountCodes({ section: "expenses" })])
      .then(([j, q, inv, codes]) => {
        setJobs(j);
        setQuotes(q);
        setInvoices(inv);
        setExpenseCodes(codes);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isNew) return;
    const fromInvoice = search.get("fromInvoice");
    const fromQuote = search.get("fromQuote");
    const fromJob = search.get("fromJob");

    if (fromInvoice) {
      getInvoice(fromInvoice)
        .then((inv) => {
          if (!inv) return;
          setForm((f) => ({
            ...f,
            invoice_id: inv.id,
            job_id: inv.job_id ?? f.job_id,
            jobs_on_id: inv.jobs_on_id ?? f.jobs_on_id,
            quote_id: inv.quote_id ?? f.quote_id,
          }));
        })
        .catch(() => {});
      return;
    }

    if (fromQuote) {
      getQuote(fromQuote)
        .then(async (q) => {
          if (!q) return;
          const jobs = await listJobs().catch(() => [] as Job[]);
          const linkedJob = jobs.find((j) => j.quote_id === q.id) ?? null;
          setForm((f) => ({
            ...f,
            quote_id: q.id,
            job_id: linkedJob?.id ?? f.job_id,
          }));
        })
        .catch(() => {});
      return;
    }

    if (fromJob) {
      getJob(fromJob)
        .then((j) => {
          if (!j) return;
          setForm((f) => ({
            ...f,
            job_id: j.id,
            quote_id: j.quote_id ?? f.quote_id,
          }));
        })
        .catch(() => {});
    }
  }, [isNew, search]);

  useEffect(() => {
    if (isNew) return;
    getExpense(id!)
      .then(async (e) => {
        if (!e) throw new Error("Expense not found");
        setForm({
          job_id: e.job_id ?? "",
          quote_id: e.quote_id ?? "",
          invoice_id: e.invoice_id ?? "",
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
    setManualEntry(false);
    setForm((f) => ({
      ...f,
      ...expenseFromScan(scan, f.receipt_path, raw),
      job_id: f.job_id,
      quote_id: f.quote_id,
      invoice_id: f.invoice_id,
    }));
  }

  function applyMaterialPreset(preset: ExpenseMaterialPreset) {
    setScanned(true);
    setManualEntry(true);
    setForm((f) => ({
      ...f,
      item_name: preset.item_name,
      description: preset.description,
      category: preset.category,
      accounting_code: preset.accounting_code,
    }));
  }

  function onItemNameChange(item_name: string) {
    const preset = findMaterialPreset(item_name);
    setForm((f) => ({
      ...f,
      item_name,
      ...(preset
        ? {
            description: preset.description,
            category: preset.category,
            accounting_code: preset.accounting_code,
          }
        : {}),
    }));
  }

  function onCategoryChange(category: ExpenseCategory) {
    setForm((f) => ({
      ...f,
      category,
      accounting_code: f.accounting_code.trim() || EXPENSE_CATEGORY_CODES[category],
    }));
  }

  async function persist(e?: FormEvent) {
    e?.preventDefault();
    if (!form.item_name.trim()) {
      showError("Add an item name — tap a material above or type one in.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        job_id: form.job_id || null,
        quote_id: form.quote_id || null,
        jobs_on_id: form.jobs_on_id || null,
        invoice_id: form.invoice_id || null,
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
      const needsMigration =
        /item_name|ai_extracted|quote_id|invoice_id|accounting_code|merchant|gst_amount|column|invalid input syntax for type date/i.test(
          msg,
        );
      showError(
        needsMigration
          ? `${msg} — run migrations 004 and 011 in Supabase SQL editor, then retry.`
          : msg,
      );
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

      {(form.job_id || form.quote_id || form.invoice_id) && (
        <EntityWorkflowBar
          anchor={{
            jobId: form.job_id || undefined,
            quoteId: form.quote_id || undefined,
            invoiceId: form.invoice_id || undefined,
          }}
          current="expense"
        />
      )}

      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
          <Wallet size={22} />
        </span>
        <h1 className="text-2xl font-bold text-[var(--mp-navy)]">{isNew ? "New expense" : "Edit expense"}</h1>
      </div>

      <form onSubmit={persist} className="mx-auto max-w-lg space-y-5">
        {isNew && !scanned && (
          <>
            {hasLink && (
              <>
                <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
                  Linked to this job — pick a material below or scan a receipt.
                </div>
                <ExpenseMaterialPicker onPick={applyMaterialPreset} />
                <button
                  type="button"
                  className="text-sm font-semibold text-[var(--mp-orange)] underline"
                  onClick={() => {
                    setScanned(true);
                    setManualEntry(true);
                  }}
                >
                  Enter expense manually (no receipt)
                </button>
              </>
            )}
            {!hasLink && <ExpenseReceiptScan onScanned={applyScan} onError={showError} disabled={saving} />}
          </>
        )}

        {scanned && (
          <>
            {isNew && manualEntry && !receiptPreview && (
              <>
                <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
                  Pick a material or fill in the details below, then save.
                </div>
                <ExpenseMaterialPicker onPick={applyMaterialPreset} />
              </>
            )}
            {isNew && receiptPreview && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                Receipt read — check the details below, then save.
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
                list="expense-materials"
                value={form.item_name}
                onChange={(e) => onItemNameChange(e.target.value)}
                placeholder="e.g. Charcoal Paint"
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
              <datalist id="expense-materials">
                {EXPENSE_MATERIAL_PRESETS.map((p) => (
                  <option key={p.item_name} value={p.item_name} />
                ))}
              </datalist>
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
              <span className="mb-1 block text-xs font-semibold text-slate-500">Link to job</span>
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
              <span className="mb-1 block text-xs font-semibold text-slate-500">Link to quote</span>
              <select
                value={form.quote_id}
                onChange={(e) => setForm({ ...form, quote_id: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="">— No quote —</option>
                {quotes.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.number} — {q.title || "Untitled quote"}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="mb-1 block text-xs font-semibold text-slate-500">Link to invoice</span>
              <select
                value={form.invoice_id}
                onChange={(e) => setForm({ ...form, invoice_id: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="">— No invoice —</option>
                {invoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.number} — {inv.subject || "Untitled invoice"}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="mb-1 block text-xs font-semibold text-slate-500">Accounting code</span>
              {expenseCodes.length > 0 ? (
                <select
                  value={form.accounting_code || expenseCodes[0]?.code || "3100"}
                  onChange={(e) => setForm({ ...form, accounting_code: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                >
                  {expenseCodes.map((c) => (
                    <option key={c.id} value={c.code}>
                      {accountCodeLabel(c)}
                    </option>
                  ))}
                  {form.accounting_code && !expenseCodes.some((c) => c.code === form.accounting_code) && (
                    <option value={form.accounting_code}>{form.accounting_code}</option>
                  )}
                </select>
              ) : (
                <input
                  value={form.accounting_code}
                  onChange={(e) => setForm({ ...form, accounting_code: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              )}
            </label>

            <label className="block text-sm">
              <span className="mb-1 block text-xs font-semibold text-slate-500">Category</span>
              <select
                value={form.category}
                onChange={(e) => onCategoryChange(e.target.value as ExpenseCategory)}
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
