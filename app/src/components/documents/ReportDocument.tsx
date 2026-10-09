import { DocumentShell } from "@/components/documents/DocumentShell";
import type { DocumentProfile } from "@/lib/document-profile";
import { formatDateLong } from "@/lib/nz";
import type { ReportArea } from "@/types/entities";

export type ReportDocumentData = {
  number: string;
  title: string;
  report_date: string | null;
  site_address: string;
  summary: string;
  areas: ReportArea[];
  recommendations: string;
  clientName: string;
  clientAddress: string;
  clientEmail: string;
  profile?: DocumentProfile;
  /** storage path -> signed url, so photos show in the preview */
  photoUrls: Record<string, string>;
};

const label = "text-xs font-bold uppercase tracking-wide text-slate-400";

/** The assessment page the customer receives. No prices anywhere. */
export function ReportDocument({ data }: { data: ReportDocumentData }) {
  const areas = data.areas.filter((a) => a.area.trim() || a.finding.trim() || a.recommended.trim() || a.photos.length);
  return (
    <DocumentShell docLabel="Report" docNumber={data.number} accent="quote" profile={data.profile} flow>
      <div className="mb-6 grid gap-8 sm:grid-cols-2">
        <div>
          <p className={label}>Prepared for</p>
          <p className="mt-1 text-lg font-bold text-[var(--mp-navy)]">{data.clientName}</p>
          {(data.site_address || data.clientAddress) && (
            <p className="mt-1 whitespace-pre-line text-sm text-slate-600">
              {data.site_address ? `Site: ${data.site_address}` : data.clientAddress}
            </p>
          )}
          {data.clientEmail && <p className="mt-1 text-sm text-slate-500">{data.clientEmail}</p>}
        </div>
        <div className="sm:text-right">
          <p className={label}>Report details</p>
          {data.title && <p className="mt-1 font-semibold text-slate-800">{data.title}</p>}
          {data.report_date && (
            <p className="mt-1 text-sm text-slate-600">
              <span className="text-slate-400">Date </span>
              {formatDateLong(data.report_date)}
            </p>
          )}
        </div>
      </div>

      {data.summary.trim() && (
        <section className="mb-6">
          <h2 className="mb-1 text-[11pt] font-extrabold uppercase tracking-wide text-[var(--mp-navy)]">Summary</h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{data.summary}</p>
        </section>
      )}

      {areas.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-[11pt] font-extrabold uppercase tracking-wide text-[var(--mp-navy)]">Areas assessed</h2>
          <div className="space-y-3">
            {areas.map((a) => (
              <div key={a.id} className="break-inside-avoid rounded-lg border border-slate-200 p-3">
                <h3 className="font-bold text-[var(--mp-navy)]">{a.area || "Area"}</h3>
                {a.finding.trim() && (
                  <>
                    <p className={`${label} mt-2`}>What we found</p>
                    <p className="whitespace-pre-wrap text-sm text-slate-700">{a.finding}</p>
                  </>
                )}
                {a.recommended.trim() && (
                  <>
                    <p className={`${label} mt-2`}>Recommended work</p>
                    <p className="whitespace-pre-wrap text-sm text-slate-700">{a.recommended}</p>
                  </>
                )}
                {a.photos.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {a.photos.map((p) =>
                      data.photoUrls[p] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={p} src={data.photoUrls[p]} alt={a.area || "Photo"} className="h-36 w-[48%] rounded-md border border-slate-200 object-cover" />
                      ) : null,
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {data.recommendations.trim() && (
        <section className="mb-2">
          <h2 className="mb-1 text-[11pt] font-extrabold uppercase tracking-wide text-[var(--mp-navy)]">Recommendations and next steps</h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{data.recommendations}</p>
        </section>
      )}
    </DocumentShell>
  );
}
