import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { QuoteDocument } from "@/components/documents/QuoteDocument";
import { useErrorBanner } from "@/context/ErrorBannerContext";
import { useClientsMap } from "@/hooks/useClientsMap";
import { buildQuoteDocumentData } from "@/lib/document-preview";
import { documentProfileFromSettings } from "@/lib/document-profile";
import { getQuote } from "@/lib/quotes";
import { getWorkSettings } from "@/lib/work-settings";

export function QuotePrintPage() {
  const { id } = useParams();
  const [search] = useSearchParams();
  const { showError } = useErrorBanner();
  const { clients } = useClientsMap();
  const [ready, setReady] = useState(false);
  const [doc, setDoc] = useState<ReturnType<typeof buildQuoteDocumentData> | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const [q, ws] = await Promise.all([getQuote(id), getWorkSettings().catch(() => null)]);
        if (!q) throw new Error("Quote not found");
        if (cancelled) return;
        const profile = documentProfileFromSettings(ws);
        setDoc(
          buildQuoteDocumentData({
            number: q.number,
            title: q.title,
            quote_date: q.quote_date,
            valid_until: q.valid_until,
            line_items: q.line_items,
            discount: Number(q.discount),
            gstRegistered: Number(q.gst) > 0,
            terms: q.terms,
            client_id: q.client_id ?? "",
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

  if (!ready || !doc) return <p className="p-8 text-slate-500">Loading quote…</p>;

  return (
    <>
      <div className="document-print-toolbar no-print">
        <button type="button" onClick={() => window.print()}>
          Print / Save PDF
        </button>
        <Link to={`/quotes/${id}`} className="ghost">
          ← Back to quote
        </Link>
      </div>
      <div className="document-page-wrap">
        <QuoteDocument data={doc} />
      </div>
    </>
  );
}
