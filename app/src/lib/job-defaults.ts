import { todayIsoDate } from "@/lib/line-items";
import type { JobBillingFlags, JobChecklist, JobChecklistItem, JobVisit } from "@/types/entities";

export function newChecklistItem(label = ""): JobChecklistItem {
  return { id: crypto.randomUUID(), label, checked: false, notes: "" };
}

export function newChecklist(title = ""): JobChecklist {
  return {
    id: crypto.randomUUID(),
    title,
    items: [newChecklistItem()],
  };
}

export function parseChecklists(raw: unknown[] | null | undefined): JobChecklist[] {
  if (!raw?.length) return [];
  return raw.map((c) => {
    const cl = c as Partial<JobChecklist>;
    const items = (cl.items ?? []).map((item) => ({
      ...newChecklistItem(),
      ...(item as Partial<JobChecklistItem>),
      id: (item as JobChecklistItem).id || crypto.randomUUID(),
    }));
    return {
      id: cl.id || crypto.randomUUID(),
      title: cl.title ?? "",
      items: items.length ? items : [newChecklistItem()],
    };
  });
}

export function defaultJobVisit(): JobVisit {
  return {
    title: "",
    date: todayIsoDate(),
    scheduleLater: false,
    startTime: "",
    endTime: "",
    anytime: false,
    assignedTo: "Richo Petersen",
    instructions: "",
    emailTeam: false,
  };
}

export function defaultBillingFlags(): JobBillingFlags {
  return {
    remindInvoiceOnClose: true,
    splitPaymentSchedule: false,
    discount: 0,
    gstRegistered: false,
  };
}

export function parseVisits(raw: unknown[] | null | undefined): JobVisit[] {
  if (!raw?.length) return [defaultJobVisit()];
  return raw.map((v) => ({ ...defaultJobVisit(), ...(v as Partial<JobVisit>) }));
}

export function parseBillingFlags(raw: Record<string, unknown> | null | undefined): JobBillingFlags {
  return { ...defaultBillingFlags(), ...(raw as Partial<JobBillingFlags>) };
}

export function displayJobNumber(number: string): string {
  return number.replace(/^JOB-/i, "");
}
