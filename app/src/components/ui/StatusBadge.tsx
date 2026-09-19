const STYLES: Record<string, string> = {
  lead: "bg-amber-100 text-amber-800",
  active: "bg-green-100 text-green-800",
  inactive: "bg-slate-100 text-slate-600",
  draft: "bg-slate-100 text-slate-700",
  open: "bg-blue-100 text-blue-800",
  approved: "bg-green-100 text-green-800",
  closed: "bg-slate-100 text-slate-600",
  sent: "bg-blue-100 text-blue-800",
  declined: "bg-red-100 text-red-700",
  scheduled: "bg-indigo-100 text-indigo-800",
  completed: "bg-green-100 text-green-800",
  paid: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-700",
};

export function StatusBadge({ status }: { status: string }) {
  const cls = STYLES[status] ?? "bg-slate-100 text-slate-700";
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${cls}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}
