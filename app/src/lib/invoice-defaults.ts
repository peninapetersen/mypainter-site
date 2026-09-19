export const DEFAULT_INVOICE_CONTRACT =
  "Thank you for your business. Please contact us with any questions regarding this invoice.";

export const PAYMENT_TERMS_OPTIONS = [
  "Due upon receipt",
  "Net 15",
  "Net 30",
  "Net 60",
] as const;

export function displayInvoiceNumber(number: string): string {
  return number.replace(/^INV-/i, "");
}
