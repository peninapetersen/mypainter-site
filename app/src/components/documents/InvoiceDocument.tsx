import { DocumentShell } from "@/components/documents/DocumentShell";
import type { DocumentProfile } from "@/lib/document-profile";
import { DocumentTotals } from "@/components/documents/DocumentTotals";
import { LineItemsTable } from "@/components/documents/LineItemsTable";
import { formatDateLong } from "@/lib/nz";

export type InvoiceDocumentData = {
  number: string;
  subject: string;
  issued_date: string | null;
  payment_terms: string;
  line_items: import("@/types/entities").LineItem[];
  discount: number;
  subtotal: number;
  gst: number;
  total: number;
  balance: number;
  gstRegistered: boolean;
  client_message: string;
  contract: string;
  status: string;
  clientName: string;
  clientAddress: string;
  clientEmail: string;
  profile?: DocumentProfile;
};

export function InvoiceDocument({ data }: { data: InvoiceDocumentData }) {
  const paid = data.status === "paid";

  return (
    <DocumentShell docLabel="Invoice" docNumber={data.number} accent="invoice" profile={data.profile}>
      <div className="mb-8 grid gap-8 sm:grid-cols-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Bill to</p>
          <p className="mt-1 text-lg font-bold text-[var(--mp-navy)]">{data.clientName}</p>
          {data.clientAddress && <p className="mt-1 text-sm text-slate-600 whitespace-pre-line">{data.clientAddress}</p>}
          {data.clientEmail && <p className="mt-1 text-sm text-slate-500">{data.clientEmail}</p>}
        </div>
        <div className="sm:text-right">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Invoice details</p>
          <p className="mt-1 font-semibold text-slate-800">{data.subject}</p>
          {data.issued_date && (
            <p className="mt-1 text-sm text-slate-600">
              <span className="text-slate-400">Issued </span>
              {formatDateLong(data.issued_date)}
            </p>
          )}
          {data.payment_terms && (
            <p className="text-sm text-slate-600">
              <span className="text-slate-400">Terms </span>
              {data.payment_terms}
            </p>
          )}
          {paid && (
            <span className="mt-2 inline-block rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-bold text-emerald-800">
              PAID
            </span>
          )}
        </div>
      </div>

      {data.client_message?.trim() && (
        <div className="mb-6 rounded-lg border border-sky-100 bg-sky-50/80 px-4 py-3 text-sm text-slate-700">
          {data.client_message}
        </div>
      )}

      <LineItemsTable items={data.line_items} />

      <div className="mt-8 flex justify-end">
        <DocumentTotals
          subtotal={data.subtotal}
          discount={data.discount}
          gst={data.gst}
          total={data.total}
          balance={paid ? 0 : data.balance}
          gstRegistered={data.gstRegistered}
        />
      </div>

      {data.contract?.trim() && (
        <div className="mt-8 rounded-lg bg-slate-50 p-4 text-sm leading-relaxed text-slate-600">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Payment &amp; terms</p>
          <p className="whitespace-pre-wrap">{data.contract}</p>
        </div>
      )}
    </DocumentShell>
  );
}
