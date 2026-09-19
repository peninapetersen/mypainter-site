import type { JobBillingFlags } from "@/types/entities";

export function JobBillingSection({
  flags,
  onChange,
}: {
  flags: JobBillingFlags;
  onChange: (flags: JobBillingFlags) => void;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="mb-4 text-lg font-bold text-[var(--mp-navy)]">Billing</h2>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={flags.remindInvoiceOnClose}
          onChange={(e) => onChange({ ...flags, remindInvoiceOnClose: e.target.checked })}
          className="rounded border-slate-300 text-[var(--mp-orange)]"
        />
        Remind me to invoice when I close the job
      </label>
      <hr className="my-4 border-slate-200" />
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={flags.splitPaymentSchedule}
          onChange={(e) => onChange({ ...flags, splitPaymentSchedule: e.target.checked })}
          className="rounded border-slate-300 text-[var(--mp-orange)]"
        />
        Split into multiple invoices with a payment schedule
      </label>
    </div>
  );
}
