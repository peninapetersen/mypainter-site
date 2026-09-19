import { clientDisplayName } from "@/lib/client-display";
import type { InvoiceDocumentData } from "@/components/documents/InvoiceDocument";
import type { QuoteDocumentData } from "@/components/documents/QuoteDocument";
import type { DocumentProfile } from "@/lib/document-profile";
import { calcLineSubtotal, calcQuoteTotals } from "@/lib/line-items";
import { displayInvoiceNumber } from "@/lib/invoice-defaults";
import type { Client, LineItem } from "@/types/entities";

function clientFields(clientId: string, clients: Client[]) {
  const c = clients.find((x) => x.id === clientId);
  return {
    clientName: c ? clientDisplayName(c) : "Customer",
    clientAddress: c?.address?.trim() ?? "",
    clientEmail: c?.email?.trim() ?? "",
  };
}

export function buildQuoteDocumentData(input: {
  number: string;
  title: string;
  quote_date: string | null;
  valid_until: string | null;
  line_items: LineItem[];
  discount: number;
  gstRegistered: boolean;
  terms: string;
  client_id: string;
  clients: Client[];
  profile?: DocumentProfile;
}): QuoteDocumentData {
  const subtotal = calcLineSubtotal(input.line_items);
  const totals = calcQuoteTotals(subtotal, input.discount, input.gstRegistered);
  return {
    number: input.number.startsWith("MP-") ? input.number : `MP-${input.number}`,
    title: input.title,
    quote_date: input.quote_date,
    valid_until: input.valid_until,
    line_items: input.line_items,
    discount: input.discount,
    ...totals,
    terms: input.terms,
    gstRegistered: input.gstRegistered,
    ...clientFields(input.client_id, input.clients),
    profile: input.profile,
  };
}

export function buildInvoiceDocumentData(input: {
  number: string;
  subject: string;
  issued_date: string | null;
  payment_terms: string;
  line_items: LineItem[];
  discount: number;
  gstRegistered: boolean;
  client_message: string;
  contract: string;
  status: string;
  balance: number;
  client_id: string;
  clients: Client[];
  profile?: DocumentProfile;
}): InvoiceDocumentData {
  const subtotal = calcLineSubtotal(input.line_items);
  const totals = calcQuoteTotals(subtotal, input.discount, input.gstRegistered);
  const num = displayInvoiceNumber(input.number);
  return {
    number: num,
    subject: input.subject,
    issued_date: input.issued_date,
    payment_terms: input.payment_terms,
    line_items: input.line_items,
    discount: input.discount,
    subtotal: totals.subtotal,
    gst: totals.gst,
    total: totals.total,
    balance: input.status === "paid" ? 0 : input.balance ?? totals.total,
    gstRegistered: input.gstRegistered,
    client_message: input.client_message,
    contract: input.contract,
    status: input.status,
    ...clientFields(input.client_id, input.clients),
    profile: input.profile,
  };
}
