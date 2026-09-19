import type { DocumentProfile } from "@/lib/document-profile";
import { BUSINESS_PROFILE } from "@/lib/business-profile";
import type { ReactNode } from "react";

export function DocumentShell({
  docLabel,
  docNumber,
  children,
  accent = "quote",
  profile,
}: {
  docLabel: string;
  docNumber: string;
  children: ReactNode;
  accent?: "quote" | "invoice";
  profile?: DocumentProfile;
}) {
  const p = profile ?? {
    name: BUSINESS_PROFILE.name,
    owner: BUSINESS_PROFILE.owner,
    tagline: BUSINESS_PROFILE.tagline,
    phone: BUSINESS_PROFILE.phone,
    email: BUSINESS_PROFILE.email,
    website: BUSINESS_PROFILE.website,
    logoUrl: BUSINESS_PROFILE.logoUrl,
  };
  const badgeBg = accent === "invoice" ? "bg-[var(--mp-navy)]" : "bg-[var(--mp-orange)]";

  return (
    <article className="document-sheet text-slate-800">
      <div className="doc-accent-bar" />

      <div className="flex h-[calc(297mm-4px)] flex-col px-[14mm] pb-[12mm] pt-[10mm]">
        <div className="flex shrink-0 flex-wrap items-start justify-between gap-4 border-b-2 border-[#fdd85d] pb-4">
          <div className="min-w-[140px]">
            <img src={p.logoUrl} alt={p.name} className="doc-logo" width={200} height={56} decoding="async" />
            <p className="mt-2 text-[11pt] font-bold text-[var(--mp-navy)]">{p.owner}</p>
            <p className="text-[9pt] text-slate-500">{p.tagline}</p>
          </div>
          <div className="text-right">
            <span className={`inline-block rounded px-2.5 py-0.5 text-[9pt] font-bold uppercase tracking-wide text-white ${badgeBg}`}>
              {docLabel}
            </span>
            <p className="mt-2 text-[16pt] font-extrabold tracking-tight text-[var(--mp-navy)]">{docNumber}</p>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden pt-4">{children}</div>

        <div className="mt-auto shrink-0 border-t border-slate-200 pt-3 text-[9pt] text-slate-600">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="font-bold text-[var(--mp-navy)]">{p.name}</p>
              <p>
                {p.phone} · {p.email}
              </p>
            </div>
            <p>{p.website}</p>
          </div>
        </div>
      </div>
    </article>
  );
}
