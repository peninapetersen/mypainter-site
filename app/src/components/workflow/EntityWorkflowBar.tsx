import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Check, Clock, Hammer, Receipt, ScrollText, FileText, Wallet, HardHat } from "lucide-react";
import { loadWorkflowChain, type WorkflowAnchor, type WorkflowChain } from "@/lib/workflow";
import { formatDuration } from "@/lib/timesheets";

type StepKey = "request" | "lead" | "quote" | "jobs_on" | "invoice";

/** Tradie order: enquiry → lead visit → quote → customer approves → Jobs On → invoice */
const MAIN_STEPS: { key: StepKey; label: string; icon: typeof ScrollText }[] = [
  { key: "request", label: "Request", icon: ScrollText },
  { key: "lead", label: "Lead", icon: Hammer },
  { key: "quote", label: "Quote", icon: FileText },
  { key: "jobs_on", label: "Jobs On", icon: HardHat },
  { key: "invoice", label: "Invoice", icon: Receipt },
];

function stepHref(key: StepKey, chain: WorkflowChain): string | null {
  if (key === "request" && chain.request) return `/requests/${chain.request.id}`;
  if (key === "lead" && chain.lead) return `/leads/${chain.lead.id}`;
  if (key === "quote" && chain.quote) return `/quotes/${chain.quote.id}`;
  if (key === "jobs_on" && chain.jobsOn) return `/jobs-on/${chain.jobsOn.id}`;
  if (key === "invoice" && chain.invoice) return `/invoices/${chain.invoice.id}`;
  return null;
}

function stepLabel(key: StepKey, chain: WorkflowChain): string {
  if (key === "request" && chain.request) return chain.request.title || "Request";
  if (key === "lead" && chain.lead) return chain.lead.number || "Lead";
  if (key === "quote" && chain.quote) return chain.quote.number || "Quote";
  if (key === "jobs_on" && chain.jobsOn) return chain.jobsOn.number || "Jobs On";
  if (key === "invoice" && chain.invoice) return chain.invoice.number || "Invoice";
  return "";
}

function nextAction(
  current: StepKey | null,
  chain: WorkflowChain,
): { label: string; to: string } | null {
  if (!current) return null;
  if (current === "request" && !chain.lead && chain.request) {
    return { label: "Schedule lead visit", to: `/leads/new?fromRequest=${chain.request.id}` };
  }
  if (current === "lead" && chain.lead && !chain.quote) {
    return { label: "Create quote", to: `/quotes/new?fromJob=${chain.lead.id}` };
  }
  if (current === "quote" && chain.quote && !chain.jobsOn) {
    if (chain.quote.status === "approved") {
      return { label: "Open Jobs On", to: `/jobs-on/list` };
    }
    return { label: "Send quote to customer", to: `/quotes/${chain.quote.id}` };
  }
  if (current === "quote" && chain.quote && chain.jobsOn) {
    if (chain.jobsOn.status === "draft") {
      return { label: "Jobs On (draft)", to: `/jobs-on/${chain.jobsOn.id}` };
    }
    return { label: "Open Jobs On", to: `/jobs-on/${chain.jobsOn.id}` };
  }
  if (current === "jobs_on" && chain.jobsOn && !chain.invoice) {
    return { label: "Create invoice", to: `/invoices/new?fromJobsOn=${chain.jobsOn.id}` };
  }
  if (current === "invoice" && chain.invoice) {
    return { label: "Add expense", to: `/expenses/new?fromInvoice=${chain.invoice.id}` };
  }
  return null;
}

export function EntityWorkflowBar({
  anchor,
  current,
}: {
  anchor: WorkflowAnchor;
  current: StepKey | "expense" | "timesheet" | null;
}) {
  const navigate = useNavigate();
  const [chain, setChain] = useState<WorkflowChain | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadWorkflowChain(anchor)
      .then((c) => {
        if (!cancelled) setChain(c);
      })
      .catch(() => {
        if (!cancelled) setChain(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [anchor.requestId, anchor.quoteId, anchor.leadId, anchor.jobId, anchor.jobsOnId, anchor.invoiceId]);

  if (loading) {
    return (
      <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
        Loading workflow…
      </div>
    );
  }

  if (!chain) return null;

  const action = current && current !== "expense" && current !== "timesheet" ? nextAction(current, chain) : null;
  const totalTime = chain.timesheets.reduce((sum, t) => sum + (t.duration_seconds ?? 0), 0);

  return (
    <div className="mb-6 rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-4 shadow-sm">
      <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Pipeline</p>

      <div className="flex flex-wrap items-center gap-1">
        {MAIN_STEPS.map((step, i) => {
          const href = stepHref(step.key, chain);
          const isCurrent = current === step.key || (current === "expense" && step.key === "invoice");
          const Icon = step.icon;
          return (
            <div key={step.key} className="flex items-center gap-1">
              {i > 0 && <ArrowRight size={14} className="mx-0.5 text-slate-300" />}
              {href ? (
                <Link
                  to={href}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                    isCurrent ? "bg-[var(--mp-navy)] text-white" : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                  }`}
                  title={stepLabel(step.key, chain)}
                >
                  <Check size={12} />
                  <Icon size={14} />
                  {step.label}
                </Link>
              ) : (
                <span
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
                    isCurrent ? "bg-slate-200 text-slate-600" : "bg-slate-100 text-slate-400"
                  }`}
                >
                  <Icon size={14} />
                  {step.label}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
        {(chain.lead || chain.jobsOn) && (
          <>
            <Link
              to={`/expenses/new?fromJob=${chain.lead?.id ?? ""}&fromJobsOn=${chain.jobsOn?.id ?? ""}&fromQuote=${chain.quote?.id ?? ""}`}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-[var(--mp-orange)]"
            >
              <Wallet size={12} />
              Expense{chain.expenses.length ? ` (${chain.expenses.length})` : ""}
            </Link>
            {chain.lead && (
              <Link
                to={`/timesheets/new?fromJob=${chain.lead.id}`}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-[var(--mp-orange)]"
              >
                <Clock size={12} />
                Time{chain.timesheets.length ? ` (${formatDuration(totalTime)})` : ""}
              </Link>
            )}
          </>
        )}
        {chain.expenses.length > 0 && (
          <Link to="/expenses/list" className="text-xs font-semibold text-[var(--mp-orange)] underline">
            View {chain.expenses.length} expense{chain.expenses.length === 1 ? "" : "s"}
          </Link>
        )}
      </div>

      {action?.to && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(action.to)}
            className="inline-flex items-center gap-1 rounded-lg bg-[var(--mp-orange)] px-3 py-1.5 text-xs font-bold text-white hover:opacity-90"
          >
            Next: {action.label}
            <ArrowRight size={14} />
          </button>
          {current === "request" && chain.request && !chain.lead && (
            <button
              type="button"
              onClick={() => navigate(`/quotes/new?fromRequest=${chain.request!.id}`)}
              className="text-xs font-semibold text-slate-500 underline"
            >
              Skip visit — quote from request
            </button>
          )}
        </div>
      )}
    </div>
  );
}
