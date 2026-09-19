import { Link } from "react-router-dom";
import { Pencil } from "lucide-react";
import { clientDisplayName } from "@/lib/client-display";
import type { Client } from "@/types/entities";

type Props = {
  client: Client | null;
  requestId?: string;
};

export function RequestClientCard({ client, requestId }: Props) {
  if (!client) return null;

  const missingLast = client.first_name?.trim() && !client.last_name?.trim();
  const missingSplit = !client.first_name?.trim() && !client.last_name?.trim() && client.name?.trim();
  const returnTo = requestId ? `/requests/${requestId}` : undefined;

  return (
    <section className="rounded-lg border border-slate-200 bg-slate-50/80 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Client</h2>
          <p className="mt-1 text-lg font-bold text-[var(--mp-navy)]">{clientDisplayName(client)}</p>
        </div>
        <Link
          to={returnTo ? `/clients/${client.id}?returnTo=${encodeURIComponent(returnTo)}` : `/clients/${client.id}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--mp-navy)] bg-white px-3 py-2 text-sm font-bold text-[var(--mp-navy)] hover:bg-slate-100"
        >
          <Pencil size={14} />
          Edit client
        </Link>
      </div>

      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-slate-500">First name</dt>
          <dd className="font-medium text-slate-800">{client.first_name?.trim() || "—"}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Last name</dt>
          <dd className="font-medium text-slate-800">{client.last_name?.trim() || "—"}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Phone</dt>
          <dd className="font-medium text-slate-800">{client.phone?.trim() || "—"}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Email</dt>
          <dd className="font-medium text-slate-800">{client.email?.trim() || "—"}</dd>
        </div>
      </dl>

      {(missingLast || missingSplit) && (
        <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {missingSplit
            ? "This client only has a single name on file. Edit client to add first and last name."
            : "Last name is missing — edit client to complete their record."}
        </p>
      )}
    </section>
  );
}
