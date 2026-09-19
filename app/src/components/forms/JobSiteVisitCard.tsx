import { Link } from "react-router-dom";
import { MapPin, Pencil, Phone, Mail, User } from "lucide-react";
import { GoogleMapEmbed } from "@/components/maps/GoogleMapEmbed";
import { clientDisplayName } from "@/lib/client-display";
import type { Client } from "@/types/entities";

type Props = {
  client: Client | null;
  siteAddress: string;
  onSiteAddressChange: (address: string) => void;
  jobId?: string;
  requestId?: string;
  measureUp?: boolean;
};

export function JobSiteVisitCard({
  client,
  siteAddress,
  onSiteAddressChange,
  jobId,
  requestId,
  measureUp,
}: Props) {
  const hasAddress = siteAddress.trim().length > 0;
  const returnTo = jobId ? `/leads/${jobId}` : requestId ? `/requests/${requestId}` : undefined;

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
            {measureUp ? "Measure-up visit" : "Site visit"}
          </h2>
          {client ? (
            <p className="mt-1 text-lg font-bold text-[var(--mp-navy)]">{clientDisplayName(client)}</p>
          ) : (
            <p className="mt-1 text-sm text-slate-500">Link a client above to pull contact details.</p>
          )}
        </div>
        {client && (
          <Link
            to={
              returnTo
                ? `/clients/${client.id}?returnTo=${encodeURIComponent(returnTo)}`
                : `/clients/${client.id}`
            }
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--mp-navy)] bg-white px-3 py-2 text-sm font-bold text-[var(--mp-navy)] hover:bg-slate-100"
          >
            <Pencil size={14} />
            Edit client
          </Link>
        )}
      </div>

      {client && (
        <dl className="grid gap-3 text-sm sm:grid-cols-3">
          <div className="flex items-center gap-2">
            <User size={14} className="text-slate-400" />
            <span className="font-medium text-slate-800">
              {[client.first_name, client.last_name].filter(Boolean).join(" ") || client.name || "—"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Phone size={14} className="text-slate-400" />
            {client.phone?.trim() ? (
              <a href={`tel:${client.phone.trim()}`} className="font-medium text-[var(--mp-navy)] hover:underline">
                {client.phone.trim()}
              </a>
            ) : (
              <span className="text-slate-400">No phone — add in client</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Mail size={14} className="text-slate-400" />
            {client.email?.trim() ? (
              <a href={`mailto:${client.email.trim()}`} className="font-medium text-[var(--mp-navy)] hover:underline">
                {client.email.trim()}
              </a>
            ) : (
              <span className="text-slate-400">No email</span>
            )}
          </div>
        </dl>
      )}

      <div>
        <label className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
          <MapPin size={14} className="text-[var(--mp-orange)]" />
          Job site address
        </label>
        {!hasAddress && (
          <p className="mb-2 text-sm text-amber-800">
            No address on file yet — enter it after you speak to the customer, then save the job.
          </p>
        )}
        <textarea
          value={siteAddress}
          onChange={(e) => onSiteAddressChange(e.target.value)}
          rows={2}
          placeholder="e.g. 12 Example Road, Ponsonby, Auckland 1011"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        />
      </div>

      {hasAddress ? (
        <GoogleMapEmbed address={siteAddress} />
      ) : (
        <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-4 text-center">
          <MapPin size={28} className="mb-2 text-slate-300" />
          <p className="text-sm font-semibold text-slate-500">Map appears when you enter an address</p>
        </div>
      )}
    </section>
  );
}
