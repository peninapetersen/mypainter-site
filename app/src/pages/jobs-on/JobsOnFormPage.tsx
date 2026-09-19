import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Clock, FileText, HardHat, MapPin, Plus, Receipt, Wallet } from "lucide-react";
import { EntityWorkflowBar } from "@/components/workflow/EntityWorkflowBar";
import { FormSaveBar } from "@/components/ui/FormSaveBar";
import { useErrorBanner } from "@/context/ErrorBannerContext";
import { useClientsMap } from "@/hooks/useClientsMap";
import { contractorDisplayName, estimateContractorCost, listContractors } from "@/lib/contractors";
import { listExpensesForJobsOn } from "@/lib/expenses";
import { resolveJobsOnSiteAddress } from "@/lib/jobs-on-address";
import { getJobsOn, jobsOnDealValue, listJobsOn, updateJobsOn } from "@/lib/jobs-on";
import { formatCurrency } from "@/lib/nz";
import { upsertPipelineForWorkflow } from "@/lib/pipeline";
import { formatDuration, listTimesheetsForJobsOn } from "@/lib/timesheets";
import type { Contractor, CrewTimesheet, Expense, JobOn } from "@/types/entities";

function statusLabel(status: JobOn["status"]): { text: string; className: string } {
  if (status === "completed") return { text: "Completed", className: "bg-slate-100 text-slate-700" };
  if (status === "draft") return { text: "Draft", className: "bg-amber-100 text-amber-800" };
  return { text: "In progress", className: "bg-emerald-100 text-emerald-800" };
}

function formatWhen(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-NZ", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function JobsOnFormPage() {
  const { id } = useParams();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const { showError } = useErrorBanner();
  const { map: clientNames } = useClientsMap();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [row, setRow] = useState<JobOn | null>(null);
  const [timesheets, setTimesheets] = useState<CrewTimesheet[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [form, setForm] = useState({
    title: "",
    site_address: "",
    notes: "",
    status: "active" as JobOn["status"],
    number: "",
    quote_id: "" as string | null,
    lead_id: "" as string | null,
    client_id: "" as string | null,
  });

  useEffect(() => {
    async function load() {
      try {
        const quoteParam = search.get("quote");
        if (quoteParam && !id) {
          const rows = await listJobsOn();
          const match = rows.find((r) => r.quote_id === quoteParam);
          if (match) {
            navigate(`/jobs-on/${match.id}`, { replace: true });
            return;
          }
        }
        if (!id || id === "new") {
          setLoading(false);
          return;
        }
        const jobRow = await getJobsOn(id);
        if (!jobRow) throw new Error("Jobs On record not found");

        let site_address = jobRow.site_address;
        if (!site_address?.trim()) {
          const resolved = await resolveJobsOnSiteAddress({
            client_id: jobRow.client_id,
            lead_id: jobRow.lead_id,
          });
          if (resolved) site_address = resolved;
        }

        setRow(jobRow);
        setForm({
          title: jobRow.title,
          site_address,
          notes: jobRow.notes,
          status: jobRow.status,
          number: jobRow.number,
          quote_id: jobRow.quote_id,
          lead_id: jobRow.lead_id,
          client_id: jobRow.client_id,
        });

        const [ts, ex, cons] = await Promise.all([
          listTimesheetsForJobsOn(id).catch(() => [] as CrewTimesheet[]),
          listExpensesForJobsOn(id).catch(() => [] as Expense[]),
          listContractors().catch(() => [] as Contractor[]),
        ]);
        setTimesheets(ts);
        setExpenses(ex);
        setContractors(cons);
      } catch (e) {
        showError(e instanceof Error ? e.message : "Load failed");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, search, navigate, showError]);

  const contractorMap = useMemo(() => new Map(contractors.map((c) => [c.id, c])), [contractors]);

  const revenue = row ? jobsOnDealValue(row) : 0;
  const expenseTotal = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const labourEstimate = timesheets.reduce((sum, t) => {
    const contractor = t.contractor_id ? contractorMap.get(t.contractor_id) ?? null : null;
    return sum + estimateContractorCost(contractor, t.duration_seconds ?? 0);
  }, 0);
  const workedSeconds = timesheets.reduce((sum, t) => sum + (t.duration_seconds ?? 0), 0);

  async function persist(e?: FormEvent) {
    e?.preventDefault();
    if (!id || id === "new") return;
    setSaving(true);
    try {
      const updated = await updateJobsOn(id, {
        title: form.title,
        site_address: form.site_address,
        notes: form.notes,
        status: form.status,
      });
      setRow(updated);
      await upsertPipelineForWorkflow({
        jobs_on_id: updated.id,
        job_id: updated.lead_id,
        quote_id: updated.quote_id,
        request_id: updated.request_id,
        client_id: updated.client_id,
        title: updated.title || updated.number,
        stage: updated.status === "completed" ? "invoiced" : "jobs_on",
        deal_value: jobsOnDealValue(updated),
        address: updated.site_address,
      }).catch(() => {});
    } catch (err) {
      showError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-slate-500">Loading…</p>;
  if (!id || id === "new") {
    return (
      <p className="text-slate-500">
        Jobs On records are created when a quote is approved.{" "}
        <Link to="/jobs-on/list" className="text-[var(--mp-orange)] hover:underline">
          View all jobs
        </Link>
      </p>
    );
  }

  const badge = statusLabel(form.status);
  const clientName = form.client_id ? clientNames.get(form.client_id) ?? "Customer" : "—";

  return (
    <div className="pb-24">
      <Link to="/jobs-on/list" className="mb-4 inline-block text-sm text-slate-500 hover:text-slate-800">
        ← All jobs on
      </Link>

      <EntityWorkflowBar
        anchor={{ jobsOnId: id, quoteId: form.quote_id ?? undefined, leadId: form.lead_id ?? undefined }}
        current="jobs_on"
      />

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
            <HardHat size={24} />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{form.number}</p>
            <h1 className="text-2xl font-bold text-[var(--mp-navy)]">{form.title || "Jobs On"}</h1>
            <p className="text-sm text-slate-500">{clientName}</p>
          </div>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${badge.className}`}>{badge.text}</span>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Job overview */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">Job overview</h2>
          <form className="space-y-4" onSubmit={persist}>
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-semibold text-slate-500">Title</span>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-500">
                <MapPin size={12} /> Site address
              </span>
              <input
                value={form.site_address}
                onChange={(e) => setForm({ ...form, site_address: e.target.value })}
                placeholder="Filled from customer when quote is approved"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
              />
            </label>
            {form.client_id && (
              <p className="text-sm">
                <span className="text-slate-500">Customer: </span>
                <Link to={`/clients/${form.client_id}`} className="font-medium text-[var(--mp-orange)] hover:underline">
                  {clientName}
                </Link>
              </p>
            )}
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-semibold text-slate-500">Job notes</span>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={5}
                placeholder="Access, colours confirmed, prep done, crew notes…"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-semibold text-slate-500">Status</span>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as JobOn["status"] })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
              >
                <option value="draft">Draft</option>
                <option value="active">Active — work in progress</option>
                <option value="completed">Completed — ready to invoice</option>
              </select>
            </label>
          </form>
        </section>

        {/* Staff & time */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Time & crew</h2>
            <Link
              to={`/timesheets/new?fromJobsOn=${id}`}
              className="inline-flex items-center gap-1 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-sky-700"
            >
              <Plus size={14} /> New timesheet
            </Link>
          </div>
          <div className="mb-4 grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3 text-sm">
            <div>
              <p className="text-xs text-slate-500">Worked</p>
              <p className="font-bold text-[var(--mp-navy)]">{formatDuration(workedSeconds)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Labour estimate</p>
              <p className="font-bold text-[var(--mp-navy)]">{formatCurrency(labourEstimate)}</p>
            </div>
          </div>
          {timesheets.length === 0 ? (
            <p className="text-sm text-slate-500">No time logged yet. Add crew or contractor hours.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {timesheets.map((t) => {
                const contractor = t.contractor_id ? contractorMap.get(t.contractor_id) : null;
                const est = estimateContractorCost(contractor ?? null, t.duration_seconds ?? 0);
                return (
                  <li key={t.id} className="flex items-center justify-between gap-2 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{t.crew_member}</p>
                      <p className="text-xs text-slate-500">
                        {formatWhen(t.check_in_time)}
                        {contractor ? ` · ${contractorDisplayName(contractor)}` : ""}
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-semibold">{formatDuration(t.duration_seconds)}</p>
                      {est > 0 && <p className="text-xs text-slate-500">{formatCurrency(est)}</p>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <Link to="/contractors/list" className="mt-3 inline-block text-xs text-[var(--mp-orange)] hover:underline">
            Manage contractors & rates →
          </Link>
        </section>

        {/* Documents */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">Documents</h2>
          <ul className="space-y-2">
            {form.quote_id ? (
              <li>
                <Link
                  to={`/quotes/${form.quote_id}`}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-sm hover:border-[var(--mp-orange)]"
                >
                  <FileText size={16} className="text-slate-400" />
                  <span className="font-medium">Accepted quote</span>
                </Link>
              </li>
            ) : (
              <li className="text-sm text-slate-500">No linked quote</li>
            )}
            <li>
              <Link
                to={`/invoices/new?fromJobsOn=${id}${form.quote_id ? `&fromQuote=${form.quote_id}` : ""}`}
                className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2.5 text-sm hover:border-[var(--mp-orange)]"
              >
                <Receipt size={16} className="text-slate-400" />
                <span className="font-medium">Create invoice</span>
              </Link>
            </li>
          </ul>
        </section>

        {/* Expenses */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Expenses</h2>
            <Link
              to={`/expenses/new?fromJobsOn=${id}${form.quote_id ? `&fromQuote=${form.quote_id}` : ""}`}
              className="inline-flex items-center gap-1 rounded-lg border border-[var(--mp-orange)] px-3 py-1.5 text-xs font-bold text-[var(--mp-orange)] hover:bg-orange-50"
            >
              <Plus size={14} /> Add expense
            </Link>
          </div>
          {expenses.length === 0 ? (
            <p className="text-sm text-slate-500">No expenses linked to this job yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {expenses.map((ex) => (
                <li key={ex.id}>
                  <Link to={`/expenses/${ex.id}`} className="flex items-center justify-between py-2.5 text-sm hover:text-[var(--mp-orange)]">
                    <span className="truncate">{ex.item_name || ex.description || ex.merchant || "Expense"}</span>
                    <span className="shrink-0 font-semibold">{formatCurrency(Number(ex.amount || 0))}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Costs summary */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500">
            <Wallet size={14} /> Costs & profitability
          </h2>
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="rounded-lg bg-emerald-50 p-4">
              <p className="text-xs font-semibold text-emerald-800">Quoted value</p>
              <p className="text-xl font-bold text-emerald-900">{formatCurrency(revenue)}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-600">Materials & expenses</p>
              <p className="text-xl font-bold text-[var(--mp-navy)]">{formatCurrency(expenseTotal)}</p>
            </div>
            <div className="rounded-lg bg-sky-50 p-4">
              <p className="text-xs font-semibold text-sky-800">Labour (estimated)</p>
              <p className="text-xl font-bold text-sky-900">{formatCurrency(labourEstimate)}</p>
            </div>
            <div className="rounded-lg bg-amber-50 p-4">
              <p className="text-xs font-semibold text-amber-800">Margin (rough)</p>
              <p className="text-xl font-bold text-amber-900">{formatCurrency(revenue - expenseTotal - labourEstimate)}</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Labour uses contractor hourly/day rates where linked.{" "}
            <Clock size={12} className="inline" /> {formatDuration(workedSeconds)} logged on this job.
          </p>
        </section>
      </div>

      <FormSaveBar saving={saving} saveLabel="Save job" onSave={() => persist()} cancelTo="/jobs-on/list" />
    </div>
  );
}
