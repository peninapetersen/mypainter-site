import { todayIsoDate } from "@/lib/line-items";
import type { JobBillingFlags, JobVisit } from "@/types/entities";

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
