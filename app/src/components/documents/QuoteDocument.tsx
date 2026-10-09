import { DocumentShell } from "@/components/documents/DocumentShell";
import type { DocumentProfile } from "@/lib/document-profile";
import { DocumentTotals } from "@/components/documents/DocumentTotals";
import { LineItemsTable } from "@/components/documents/LineItemsTable";
import { formatDateLong } from "@/lib/nz";
import type { LineItem } from "@/types/entities";

export type QuoteDocumentData = {
  number: string;
  title: string;
  quote_date: string | null;
  valid_until: string | null;
  line_items: LineItem[];
  discount: number;
  subtotal: number;
  gst: number;
  total: number;
  terms: string;
  gstRegistered: boolean;
  clientName: string;
  clientAddress: string;
  clientEmail: string;
  profile?: DocumentProfile;
};

export function QuoteDocument({ data }: { data: QuoteDocumentData }) {
  return (
    <DocumentShell docLabel="Quote" docNumber={data.number} accent="quote" profile={data.profile}>
      <div className="mb-8 grid gap-8 sm:grid-cols-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Prepared for</p>
          <p className="mt-1 text-lg font-bold text-[var(--mp-navy)]">{data.clientName}</p>
          {data.clientAddress && <p className="mt-1 text-sm text-slate-600 whitespace-pre-line">{data.clientAddress}</p>}
          {data.clientEmail && <p className="mt-1 text-sm text-slate-500">{data.clientEmail}</p>}
        </div>
        <div className="sm:text-right">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Quote details</p>
          {data.title && <p className="mt-1 font-semibold text-slate-800">{data.title}</p>}
          {data.quote_date && (
            <p className="mt-1 text-sm text-slate-600">
              <span className="text-slate-400">Date </span>
              {formatDateLong(data.quote_date)}
            </p>
          )}
          {data.valid_until && (
            <p className="text-sm text-slate-600">
              <span className="text-slate-400">Valid until </span>
              {formatDateLong(data.valid_until)}
            </p>
          )}
        </div>
      </div>

      <LineItemsTable items={data.line_items} />

      <div className="mt-8 flex justify-end">
        <DocumentTotals
          subtotal={data.subtotal}
          discount={data.discount}
          gst={data.gst}
          total={data.total}
          gstRegistered={data.gstRegistered}
        />
      </div>

      {data.terms?.trim() && (
        <div className="mt-8 rounded-lg bg-slate-50 p-4 text-sm leading-relaxed text-slate-600">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Terms</p>
          <p className="whitespace-pre-wrap">{data.terms}</p>
        </div>
      )}
    </DocumentShell>
  );
}
