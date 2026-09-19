import type { PipelineStage } from "@/types/entities";

export const PIPELINE_STAGES: {
  id: PipelineStage;
  label: string;
  hint: string;
  accent: string;
  headerBg: string;
  dot: string;
}[] = [
  {
    id: "lead",
    label: "Leads",
    hint: "Measure-ups & enquiries before quote",
    accent: "border-l-indigo-500",
    headerBg: "bg-indigo-600",
    dot: "bg-indigo-500",
  },
  {
    id: "quote",
    label: "Quotes",
    hint: "Sent — awaiting customer approval",
    accent: "border-l-[var(--mp-orange)]",
    headerBg: "bg-[var(--mp-orange)]",
    dot: "bg-[var(--mp-orange)]",
  },
  {
    id: "jobs_on",
    label: "Jobs On",
    hint: "Approved — work in progress",
    accent: "border-l-amber-500",
    headerBg: "bg-amber-600",
    dot: "bg-amber-500",
  },
  {
    id: "invoiced",
    label: "Invoiced",
    hint: "Awaiting payment",
    accent: "border-l-sky-500",
    headerBg: "bg-sky-600",
    dot: "bg-sky-500",
  },
  {
    id: "paid",
    label: "Paid",
    hint: "Customer paid — mark complete",
    accent: "border-l-emerald-500",
    headerBg: "bg-emerald-600",
    dot: "bg-emerald-500",
  },
  {
    id: "testimonial",
    label: "Testimonials",
    hint: "Collect customer reviews",
    accent: "border-l-violet-500",
    headerBg: "bg-violet-600",
    dot: "bg-violet-500",
  },
];

const STAGE_IDS = new Set<string>(PIPELINE_STAGES.map((s) => s.id));

/** Accept legacy pipeline stage `job` from before rename to Leads. */
export function isPipelineStage(s: string): s is PipelineStage {
  return s === "job" || STAGE_IDS.has(s);
}

export function normalisePipelineStage(s: string): PipelineStage {
  if (s === "job") return "lead";
  if (STAGE_IDS.has(s)) return s as PipelineStage;
  return "lead";
}
