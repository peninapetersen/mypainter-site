import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { InvoiceDocument } from "@/components/documents/InvoiceDocument";
import { useErrorBanner } from "@/context/ErrorBannerContext";
import { useClientsMap } from "@/hooks/useClientsMap";
import { buildInvoiceDocumentData } from "@/lib/document-preview";
import { documentProfileFromSettings } from "@/lib/document-profile";
import { displayInvoiceNumber } from "@/lib/invoice-defaults";
import { getInvoice } from "@/lib/invoices";
import { getWorkSettings } from "@/lib/work-settings";

export function InvoicePrintPage() {
  const { id } = useParams();
  const [search] = useSearchParams();
  const { showError } = useErrorBanner();
  const { clients } = useClientsMap();
  const [ready, setReady] = useState(false);
  const [doc, setDoc] = useState<ReturnType<typeof buildInvoiceDocumentData> | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const [inv, ws] = await Promise.all([getInvoice(id), getWorkSettings().catch(() => null)]);
        if (!inv) throw new Error("Invoice not found");
        if (cancelled) return;
        const profile = documentProfileFromSettings(ws);
        const balance = inv.status === "paid" ? 0 : Number(inv.balance ?? inv.total);
        setDoc(
          buildInvoiceDocumentData({
            number: displayInvoiceNumber(inv.number),
            subject: inv.subject,
            issued_date: inv.issued_date,
            payment_terms: inv.payment_terms,
            line_items: inv.line_items,
            discount: Number(inv.discount),
            gstRegistered: Number(inv.gst) > 0,
            client_message: inv.client_message ?? "",
            contract: inv.contract ?? "",
            status: inv.status,
            balance,
            client_id: inv.client_id ?? "",
            clients,
            profile,
          }),
        );
        setReady(true);
        if (search.get("print") === "1") {
          window.setTimeout(() => window.print(), 400);
        }
      } catch (e) {
        showError(e instanceof Error ? e.message : "Load failed");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, search, clients, showError]);

  if (!ready || !doc) return <p className="p-8 text-slate-500">Loading invoice…</p>;

  return (
    <>
      <div className="document-print-toolbar no-print">
        <button type="button" onClick={() => window.print()}>
          Print / Save PDF
        </button>
        <Link to={`/invoices/${id}`} className="ghost">
          ← Back to invoice
        </Link>
      </div>
      <div className="document-page-wrap">
        <InvoiceDocument data={doc} />
      </div>
    </>
  );
}
