import { FormEvent, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Building2,
  Calendar,
  Camera,
  Clock,
  FileText,
  HardHat,
  Pencil,
  Plus,
  Receipt,
  ScrollText,
  Wallet,
  Wrench,
  Zap,
} from "lucide-react";
import { JobSiteImages } from "@/components/forms/JobSiteImages";
import { JobsOnDetailsModal } from "@/components/jobs-on/JobsOnDetailsModal";
import { EntityWorkflowBar } from "@/components/workflow/EntityWorkflowBar";
import { Avatar } from "@/components/ui/Avatar";
import { CompactAccordion } from "@/components/ui/CompactAccordion";
import { useErrorBanner } from "@/context/ErrorBannerContext";
import { useClientsMap } from "@/hooks/useClientsMap";
import { getClient } from "@/lib/clients";
import { resolveCrewPhotoPath } from "@/lib/crew-avatars";
import { contractorDisplayName, estimateContractorCost, listContractors } from "@/lib/contractors";
import { listExpensesForJobsOn } from "@/lib/expenses";
import { resolveJobsOnSiteAddress } from "@/lib/jobs-on-address";
import { getJobsOn, jobsOnDealValue, listJobsOn, updateJobsOn } from "@/lib/jobs-on";
import { calcLineCost, calcLineSubtotal } from "@/lib/line-items";
import { formatCurrency, formatDateLong } from "@/lib/nz";
import { upsertPipelineForWorkflow } from "@/lib/pipeline";
import { fetchCalendarEvents } from "@/lib/schedule";
import { listSuppliers } from "@/lib/suppliers";
import { formatDuration, listTimesheetsForJob, listTimesheetsForJobsOn } from "@/lib/timesheets";
import { loadWorkflowChain, type WorkflowChain } from "@/lib/workflow";
import type { CalendarEvent, Client, Contractor, CrewTimesheet, Expense, GalleryImage, JobOn, LineItem, Supplier } from "@/types/entities";

function statusLabel(status: JobOn["status"]): { text: string; className: string } {
  if (status === "completed") return { text: "Completed", className: "bg-slate-100 text-slate-700" };
  if (status === "draft") return { text: "Draft", className: "bg-amber-100 text-amber-800" };
  return { text: "In progress", className: "bg-emerald-100 text-emerald-800" };
}

function formatWhen(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-NZ", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function formatEventTime(ev: CalendarEvent): string {
  if (ev.allDay) return "All day";
  return ev.start.toLocaleTimeString("en-NZ", { hour: "2-digit", minute: "2-digit" });
}

function mergeTimesheets(primary: CrewTimesheet[], secondary: CrewTimesheet[]): CrewTimesheet[] {
  const seen = new Set<string>();
  const out: CrewTimesheet[] = [];
  for (const row of [...primary, ...secondary]) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    out.push(row);
  }
  return out.sort((a, b) => (b.check_in_time ?? "").localeCompare(a.check_in_time ?? ""));
}

function asLineItems(value: unknown): LineItem[] {
  return Array.isArray(value) ? (value as LineItem[]) : [];
}

function mergeExpenses(primary: Expense[], secondary: Expense[]): Expense[] {
  const seen = new Set<string>();
  const out: Expense[] = [];
  for (const row of [...primary, ...secondary]) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    out.push(row);
  }
  return out.sort((a, b) => (b.expense_date ?? "").localeCompare(a.expense_date ?? ""));
}

function DashCard({
  title,
  icon: Icon,
  action,
  children,
  className = "",
}: {
  title: string;
  icon: typeof HardHat;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`flex min-h-[160px] flex-col rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm ${className}`}>
      <div className="mb-1.5 flex items-center justify-between gap-1">
        <h2 className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
          <Icon size={11} /> {title}
        </h2>
        {action}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </section>
  );
}

function CompactLineItems({ items }: { items: LineItem[] }) {
  const priced = items.filter((li) => !li.isText);
  if (priced.length === 0) return <p className="text-xs text-slate-500">No line items</p>;
  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="border-b border-slate-100 text-left text-[9px] uppercase tracking-wide text-slate-400">
          <th className="py-0.5 pr-1 font-semibold">Item</th>
          <th className="py-0.5 pr-1 font-semibold">Qty</th>
          <th className="py-0.5 text-right font-semibold">Total</th>
        </tr>
      </thead>
      <tbody>
        {priced.map((li, i) => (
          <tr key={`${li.name}-${i}`} className="border-b border-slate-50">
            <td className="max-w-[80px] truncate py-0.5 pr-1">{li.name || li.description || "—"}</td>
            <td className="py-0.5 pr-1 text-slate-500">{li.qty}</td>
            <td className="py-0.5 text-right font-medium">{formatCurrency(li.qty * li.unitPrice)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function JobsOnFormPage() {
  const { id } = useParams();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const { showError } = useErrorBanner();
  const { map: clientNames, clients } = useClientsMap();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [row, setRow] = useState<JobOn | null>(null);
  const [chain, setChain] = useState<WorkflowChain | null>(null);
  const [timesheets, setTimesheets] = useState<CrewTimesheet[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [jobClient, setJobClient] = useState<Client | null>(null);
  const [companyClient, setCompanyClient] = useState<Client | null>(null);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [todayEvents, setTodayEvents] = useState<CalendarEvent[]>([]);
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

        const [jobRow, workflow, cons, sups] = await Promise.all([
          getJobsOn(id),
          loadWorkflowChain({ jobsOnId: id }),
          listContractors().catch(() => [] as Contractor[]),
          listSuppliers().catch(() => [] as Supplier[]),
        ]);

        if (!jobRow) throw new Error("Jobs On record not found");

        let site_address = jobRow.site_address;
        if (!site_address?.trim()) {
          const resolved = await resolveJobsOnSiteAddress({
            client_id: jobRow.client_id,
            lead_id: jobRow.lead_id,
          });
          if (resolved) site_address = resolved;
        }

        const leadId = jobRow.lead_id ?? workflow.lead?.id ?? null;
        const [tsOn, tsLead, exDirect] = await Promise.all([
          listTimesheetsForJobsOn(id).catch(() => [] as CrewTimesheet[]),
          leadId ? listTimesheetsForJob(leadId).catch(() => [] as CrewTimesheet[]) : Promise.resolve([] as CrewTimesheet[]),
          listExpensesForJobsOn(id).catch(() => [] as Expense[]),
        ]);

        const mergedTs = mergeTimesheets(tsOn, [...workflow.timesheets, ...tsLead]);
        const mergedEx = mergeExpenses(exDirect, workflow.expenses);

        let clientRow: Client | null = null;
        let companyRow: Client | null = null;
        if (jobRow.client_id) {
          clientRow = await getClient(jobRow.client_id).catch(() => null);
          if (clientRow?.company_client_id) {
            companyRow = await getClient(clientRow.company_client_id).catch(() => null);
          }
        }

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
        const allToday = await fetchCalendarEvents(todayStart, todayEnd).catch(() => [] as CalendarEvent[]);
        const jobToday = allToday.filter((ev) => {
          if (jobRow.client_id && ev.clientId === jobRow.client_id) return true;
          if (leadId && ev.href === `/leads/${leadId}`) return true;
          if (ev.title.toLowerCase().includes((jobRow.title ?? "").toLowerCase()) && (jobRow.title ?? "").length > 3) return true;
          return false;
        });

        setRow(jobRow);
        setChain(workflow);
        setTimesheets(mergedTs);
        setExpenses(mergedEx);
        setContractors(cons);
        setSuppliers(sups);
        setJobClient(clientRow);
        setCompanyClient(companyRow);
        setImages(Array.isArray(jobRow.images) ? jobRow.images : []);
        setTodayEvents(jobToday);
        setForm({
          title: jobRow.title ?? "",
          site_address: site_address ?? "",
          notes: jobRow.notes ?? "",
          status: jobRow.status,
          number: jobRow.number ?? "",
          quote_id: jobRow.quote_id,
          lead_id: jobRow.lead_id,
          client_id: jobRow.client_id,
        });
      } catch (e) {
        showError(e instanceof Error ? e.message : "Load failed");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, search, navigate, showError]);

  const contractorMap = useMemo(() => new Map(contractors.map((c) => [c.id, c])), [contractors]);
  const supplierMap = useMemo(() => new Map(suppliers.map((s) => [s.id, s])), [suppliers]);
  const clientForCrew = useMemo(() => {
    if (jobClient) return jobClient;
    if (!form.client_id) return null;
    return clients.find((c) => c.id === form.client_id) ?? null;
  }, [jobClient, form.client_id, clients]);

  const rowItems = asLineItems(row?.line_items);
  const quoteItems = asLineItems(chain?.quote?.line_items);
  const lineItems = rowItems.length ? rowItems : quoteItems;
  const revenue = row ? jobsOnDealValue(row) : calcLineSubtotal(lineItems);
  const quotedCost = calcLineCost(lineItems);
  const expenseTotal = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const labourEstimate = timesheets.reduce((sum, t) => {
    const contractor = t.contractor_id ? contractorMap.get(t.contractor_id) ?? null : null;
    return sum + estimateContractorCost(contractor, t.duration_seconds ?? 0);
  }, 0);
  const workedSeconds = timesheets.reduce((sum, t) => sum + (t.duration_seconds ?? 0), 0);
  const margin = revenue - expenseTotal - labourEstimate;

  async function persist(e?: FormEvent, closeModal = false) {
    e?.preventDefault();
    if (!id || id === "new") return;
    setSaving(true);
    try {
      const updated = await updateJobsOn(id, {
        title: form.title,
        site_address: form.site_address,
        notes: form.notes,
        status: form.status,
        images,
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
      if (closeModal) setDetailsOpen(false);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function saveImages(next: GalleryImage[]) {
    setImages(next);
    if (!id || id === "new") return;
    try {
      const updated = await updateJobsOn(id, { images: next });
      setRow(updated);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Photo save failed");
    }
  }

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (id && id !== "new" && !row) {
    return (
      <p className="text-sm text-slate-500">
        Job not found.{" "}
        <Link to="/jobs-on/list" className="text-[var(--mp-orange)] hover:underline">
          Back to jobs
        </Link>
      </p>
    );
  }
  if (!id || id === "new") {
    return (
      <p className="text-sm text-slate-500">
        Jobs On records are created when a quote is approved.{" "}
        <Link to="/jobs-on/list" className="text-[var(--mp-orange)] hover:underline">
          View all jobs
        </Link>
      </p>
    );
  }

  const badge = statusLabel(form.status);
  const clientName = form.client_id ? clientNames.get(form.client_id) ?? "Customer" : "—";
  const invoice = chain?.invoice ?? null;
  const expenseLink = `/expenses/new?fromJobsOn=${id}${form.quote_id ? `&fromQuote=${form.quote_id}` : ""}${form.lead_id ? `&fromJob=${form.lead_id}` : ""}`;
  const todayLabel = new Date().toLocaleDateString("en-NZ", { weekday: "short", day: "numeric", month: "short" });

  return (
    <div className="pb-4">
      <Link to="/jobs-on/list" className="mb-1 inline-block text-xs text-slate-500 hover:text-slate-800">
        ← All jobs on
      </Link>

      <EntityWorkflowBar
        anchor={{ jobsOnId: id, quoteId: form.quote_id ?? undefined, leadId: form.lead_id ?? undefined }}
        current="jobs_on"
      />

      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
            <HardHat size={16} />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{form.number}</p>
            <h1 className="truncate text-base font-bold text-[var(--mp-navy)]">{form.title || "Jobs On"}</h1>
            <p className="truncate text-[11px] text-slate-500">
              {clientName}
              {form.site_address ? ` · ${form.site_address}` : ""}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => setDetailsOpen(true)}
            className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 text-[10px] font-semibold text-slate-700 hover:border-[var(--mp-orange)]"
          >
            <Pencil size={11} /> Edit details
          </button>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${badge.className}`}>{badge.text}</span>
        </div>
      </div>

      <section className="mb-2 grid grid-cols-2 gap-1.5 sm:grid-cols-5">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1.5">
          <p className="text-[9px] font-semibold uppercase text-emerald-700">Quoted</p>
          <p className="text-sm font-bold text-emerald-900">{formatCurrency(revenue)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5">
          <p className="text-[9px] font-semibold uppercase text-slate-500">Expenses</p>
          <p className="text-sm font-bold text-[var(--mp-navy)]">{formatCurrency(expenseTotal)}</p>
        </div>
        <div className="rounded-lg border border-sky-200 bg-sky-50 px-2 py-1.5">
          <p className="text-[9px] font-semibold uppercase text-sky-700">Labour</p>
          <p className="text-sm font-bold text-sky-900">{formatCurrency(labourEstimate)}</p>
        </div>
        <div className={`rounded-lg border px-2 py-1.5 ${margin >= 0 ? "border-amber-200 bg-amber-50" : "border-red-200 bg-red-50"}`}>
          <p className={`text-[9px] font-semibold uppercase ${margin >= 0 ? "text-amber-700" : "text-red-700"}`}>Margin</p>
          <p className={`text-sm font-bold ${margin >= 0 ? "text-amber-900" : "text-red-900"}`}>{formatCurrency(margin)}</p>
        </div>
        <div className="rounded-lg border border-violet-200 bg-violet-50 px-2 py-1.5">
          <p className="text-[9px] font-semibold uppercase text-violet-700">Cost</p>
          <p className="text-sm font-bold text-violet-900">{formatCurrency(quotedCost)}</p>
        </div>
      </section>

      <p className="mb-2 text-[10px] text-slate-400">
        {expenses.length} expenses · {timesheets.length} time · {images.length} photos · {lineItems.filter((li) => !li.isText).length} items
        {row?.approved_at ? ` · approved ${formatDateLong(row.approved_at)}` : ""}
      </p>

      <div className="mb-2 grid grid-cols-2 gap-2 xl:grid-cols-4">
        <DashCard
          title="Job details"
          icon={HardHat}
          action={
            <button type="button" onClick={() => setDetailsOpen(true)} className="text-[10px] font-semibold text-[var(--mp-orange)] hover:underline">
              Edit
            </button>
          }
        >
          <dl className="space-y-1 text-xs">
            <div>
              <dt className="text-[9px] uppercase text-slate-400">Title</dt>
              <dd className="font-medium text-[var(--mp-navy)]">{form.title || "—"}</dd>
            </div>
            <div>
              <dt className="text-[9px] uppercase text-slate-400">Address</dt>
              <dd className="text-slate-600">{form.site_address || "—"}</dd>
            </div>
            <div>
              <dt className="text-[9px] uppercase text-slate-400">Status</dt>
              <dd>{badge.text}</dd>
            </div>
            {form.notes && (
              <div>
                <dt className="text-[9px] uppercase text-slate-400">Notes</dt>
                <dd className="line-clamp-2 text-slate-600">{form.notes}</dd>
              </div>
            )}
            {form.client_id && (
              <Link to={`/clients/${form.client_id}`} className="inline-block text-[10px] font-semibold text-[var(--mp-orange)] hover:underline">
                {clientName} →
              </Link>
            )}
          </dl>
        </DashCard>

        <DashCard
          title="Time & crew"
          icon={Clock}
          action={
            <Link
              to={`/timesheets/new?fromJobsOn=${id}${form.lead_id ? `&fromJob=${form.lead_id}` : ""}`}
              className="inline-flex items-center gap-0.5 text-[10px] font-bold text-sky-700 hover:underline"
            >
              <Plus size={11} /> Log
            </Link>
          }
        >
          {timesheets.length === 0 ? (
            <p className="text-xs text-slate-500">No time logged · {formatDuration(workedSeconds)} total</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {timesheets.map((t) => {
                const contractor = t.contractor_id ? contractorMap.get(t.contractor_id) : null;
                const est = estimateContractorCost(contractor ?? null, t.duration_seconds ?? 0);
                return (
                  <li key={t.id} className="flex items-center justify-between gap-1 py-1">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <Avatar photoPath={resolveCrewPhotoPath(t, { client: clientForCrew, contractors })} name={t.crew_member} size={22} />
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-medium">{t.crew_member}</p>
                        <p className="truncate text-[9px] text-slate-400">{formatWhen(t.check_in_time)}</p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right text-[11px]">
                      <p className="font-semibold">{formatDuration(t.duration_seconds)}</p>
                      {est > 0 && <p className="text-[9px] text-slate-400">{formatCurrency(est)}</p>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </DashCard>

        <DashCard
          title="Expenses"
          icon={Wallet}
          action={
            <Link to={expenseLink} className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[var(--mp-orange)] hover:underline">
              <Plus size={11} /> Add
            </Link>
          }
        >
          {expenses.length === 0 ? (
            <p className="text-xs text-slate-500">No expenses linked</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {expenses.map((ex) => {
                const supplier = ex.supplier_id ? supplierMap.get(ex.supplier_id) : null;
                return (
                  <li key={ex.id}>
                    <Link to={`/expenses/${ex.id}`} className="flex items-center justify-between gap-1 py-1 text-[11px] hover:text-[var(--mp-orange)]">
                      <span className="truncate">{ex.item_name || ex.merchant || "Expense"}</span>
                      <span className="shrink-0 font-semibold">{formatCurrency(Number(ex.amount || 0))}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </DashCard>

        <DashCard title="Quoted items" icon={FileText}>
          <CompactLineItems items={lineItems} />
          <p className="mt-1 border-t border-slate-100 pt-1 text-right text-[11px] font-bold text-[var(--mp-navy)]">{formatCurrency(revenue)}</p>
        </DashCard>
      </div>

      <div className="grid gap-2 lg:grid-cols-3">
        <CompactAccordion title={`Today · ${todayLabel}`} icon={Calendar} badge={todayEvents.length || undefined}>
          {todayEvents.length === 0 ? (
            <p className="text-xs text-slate-500">Nothing scheduled for this job today.</p>
          ) : (
            <ul className="space-y-1.5">
              {todayEvents.map((ev) => (
                <li key={ev.id}>
                  {ev.href ? (
                    <Link to={ev.href} className="block rounded border border-slate-200 px-2 py-1.5 text-xs hover:border-[var(--mp-orange)]">
                      <span className="font-semibold text-[var(--mp-navy)]">{ev.title}</span>
                      <span className="ml-1 text-slate-400">{formatEventTime(ev)}</span>
                    </Link>
                  ) : (
                    <div className="rounded border border-slate-200 px-2 py-1.5 text-xs">
                      <span className="font-semibold text-[var(--mp-navy)]">{ev.title}</span>
                      <span className="ml-1 text-slate-400">{formatEventTime(ev)}</span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
          <Link to="/schedule" className="mt-2 inline-block text-[10px] font-semibold text-[var(--mp-orange)] hover:underline">
            Open full calendar →
          </Link>
        </CompactAccordion>

        <CompactAccordion title="Actions" icon={Zap}>
          <ul className="grid gap-1 sm:grid-cols-2">
            {form.quote_id && (
              <li>
                <Link to={`/quotes/${form.quote_id}`} className="flex items-center gap-1.5 rounded border border-slate-200 px-2 py-1.5 text-xs hover:border-[var(--mp-orange)]">
                  <FileText size={13} className="text-slate-400" /> View quote
                </Link>
              </li>
            )}
            {invoice ? (
              <li>
                <Link to={`/invoices/${invoice.id}`} className="flex items-center gap-1.5 rounded border border-slate-200 px-2 py-1.5 text-xs hover:border-[var(--mp-orange)]">
                  <Receipt size={13} className="text-slate-400" /> Invoice {invoice.number}
                </Link>
              </li>
            ) : (
              <li>
                <Link
                  to={`/invoices/new?fromJobsOn=${id}${form.quote_id ? `&fromQuote=${form.quote_id}` : ""}`}
                  className="flex items-center gap-1.5 rounded border border-dashed border-slate-300 px-2 py-1.5 text-xs hover:border-[var(--mp-orange)]"
                >
                  <Receipt size={13} className="text-slate-400" /> Create invoice
                </Link>
              </li>
            )}
            <li>
              <Link to={expenseLink} className="flex items-center gap-1.5 rounded border border-slate-200 px-2 py-1.5 text-xs hover:border-[var(--mp-orange)]">
                <Wallet size={13} className="text-slate-400" /> Add expense
              </Link>
            </li>
            {chain?.request && (
              <li>
                <Link to={`/requests/${chain.request.id}`} className="flex items-center gap-1.5 rounded border border-slate-200 px-2 py-1.5 text-xs hover:border-[var(--mp-orange)]">
                  <ScrollText size={13} className="text-slate-400" /> Request
                </Link>
              </li>
            )}
            {chain?.lead && (
              <li>
                <Link to={`/leads/${chain.lead.id}`} className="flex items-center gap-1.5 rounded border border-slate-200 px-2 py-1.5 text-xs hover:border-[var(--mp-orange)]">
                  <Wrench size={13} className="text-slate-400" /> Lead
                </Link>
              </li>
            )}
            {companyClient && (
              <li>
                <Link to={`/companies/${companyClient.id}`} className="flex items-center gap-1.5 rounded border border-slate-200 px-2 py-1.5 text-xs hover:border-[var(--mp-orange)]">
                  <Building2 size={13} className="text-slate-400" /> Company
                </Link>
              </li>
            )}
          </ul>
        </CompactAccordion>

        <CompactAccordion title="Site photos" icon={Camera} badge={images.length || undefined}>
          <JobSiteImages images={images} onChange={saveImages} jobsOnId={id} onError={showError} />
        </CompactAccordion>
      </div>

      <JobsOnDetailsModal
        open={detailsOpen}
        form={form}
        onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
        onClose={() => setDetailsOpen(false)}
        onSave={(e) => persist(e, true)}
        saving={saving}
      />
    </div>
  );
}
