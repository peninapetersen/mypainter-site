import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Check, Clock, Hammer, Receipt, ScrollText, FileText, Wallet, HardHat } from "lucide-react";
import { loadWorkflowChain, type WorkflowAnchor, type WorkflowChain } from "@/lib/workflow";
import { formatDuration } from "@/lib/timesheets";

type StepKey = "request" | "lead" | "quote" | "jobs_on" | "invoice";

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
    return { label: "Send quote", to: `/quotes/${chain.quote.id}` };
  }
  if (current === "quote" && chain.quote && chain.jobsOn) {
    if (chain.jobsOn.status === "draft") {
      return { label: "Jobs On draft", to: `/jobs-on/${chain.jobsOn.id}` };
    }
    return { label: "Open Jobs On", to: `/jobs-on/${chain.jobsOn.id}` };
  }
  if (current === "jobs_on" && chain.jobsOn && !chain.invoice) {
    return { label: "Create invoice", to: `/invoices/new?fromJobsOn=${chain.jobsOn.id}` };
  }
  if (current === "invoice" && chain.invoice) {
    if (chain.invoice.status !== "paid") {
      return { label: "Mark paid", to: `/invoices/${chain.invoice.id}` };
    }
    return { label: "Send review request", to: `/invoices/${chain.invoice.id}` };
  }
  return null;
}

function Divider() {
  return <span className="mx-0.5 hidden h-4 w-px shrink-0 bg-slate-200 sm:inline-block" aria-hidden />;
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
      <div className="mb-2 flex h-8 items-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-[10px] text-slate-400">
        Loading pipeline…
      </div>
    );
  }

  if (!chain) return null;

  const action = current && current !== "expense" && current !== "timesheet" ? nextAction(current, chain) : null;
  const totalTime = chain.timesheets.reduce((sum, t) => sum + (t.duration_seconds ?? 0), 0);
  const showJobLinks = !!(chain.lead || chain.jobsOn);

  return (
    <div className="mb-2 flex flex-wrap items-center gap-x-1 gap-y-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 shadow-sm">
      {MAIN_STEPS.map((step, i) => {
        const href = stepHref(step.key, chain);
        const isCurrent = current === step.key || (current === "expense" && step.key === "invoice");
        const Icon = step.icon;
        return (
          <div key={step.key} className="flex items-center gap-0.5">
            {i > 0 && <ArrowRight size={10} className="text-slate-300" />}
            {href ? (
              <Link
                to={href}
                title={stepLabel(step.key, chain)}
                className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold transition ${
                  isCurrent ? "bg-[var(--mp-navy)] text-white" : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                }`}
              >
                <Check size={9} />
                <Icon size={11} />
                <span className="hidden sm:inline">{step.label}</span>
              </Link>
            ) : (
              <span
                title={step.label}
                className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                  isCurrent ? "bg-slate-200 text-slate-600" : "bg-slate-100 text-slate-400"
                }`}
              >
                <Icon size={11} />
                <span className="hidden sm:inline">{step.label}</span>
              </span>
            )}
          </div>
        );
      })}

      {showJobLinks && (
        <>
          <Divider />
          <Link
            to={`/expenses/new?fromJob=${chain.lead?.id ?? ""}&fromJobsOn=${chain.jobsOn?.id ?? ""}&fromQuote=${chain.quote?.id ?? ""}`}
            className="inline-flex items-center gap-0.5 rounded border border-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 hover:border-[var(--mp-orange)]"
          >
            <Wallet size={10} />
            Expense{chain.expenses.length ? ` (${chain.expenses.length})` : ""}
          </Link>
          {chain.lead && (
            <Link
              to={`/timesheets/new?fromJob=${chain.lead.id}${chain.jobsOn ? `&fromJobsOn=${chain.jobsOn.id}` : ""}`}
              className="inline-flex items-center gap-0.5 rounded border border-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 hover:border-[var(--mp-orange)]"
            >
              <Clock size={10} />
              Time{chain.timesheets.length ? ` (${formatDuration(totalTime)})` : ""}
            </Link>
          )}
        </>
      )}

      {action?.to && (
        <>
          <Divider />
          <button
            type="button"
            onClick={() => navigate(action.to)}
            className="inline-flex items-center gap-0.5 rounded bg-[var(--mp-orange)] px-2 py-0.5 text-[10px] font-bold text-white hover:opacity-90"
          >
            Next: {action.label}
            <ArrowRight size={10} />
          </button>
          {current === "request" && chain.request && !chain.lead && (
            <button
              type="button"
              onClick={() => navigate(`/quotes/new?fromRequest=${chain.request!.id}`)}
              className="text-[10px] font-semibold text-slate-400 underline hover:text-slate-600"
            >
              Skip visit
            </button>
          )}
        </>
      )}
    </div>
  );
}
