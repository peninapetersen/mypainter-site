import { Printer, Send, X } from "lucide-react";
import type { ReactNode } from "react";

export function DocumentPreviewModal({
  open,
  title,
  onClose,
  children,
  onSend,
  sendLabel = "Send to customer",
  sending = false,
  sendDisabled = false,
  sendHint,
  linkUrl,
  customerEmail,
  printUrl,
  onPrint,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  onSend?: () => void | Promise<void>;
  sendLabel?: string;
  sending?: boolean;
  sendDisabled?: boolean;
  sendHint?: string;
  linkUrl?: string;
  customerEmail?: string;
  /** Opens dedicated A4 print page (always works — not blank) */
  printUrl?: string;
  /** Prefer this for quotes — opens quote-view.html etc. */
  onPrint?: () => void | Promise<void>;
}) {
  if (!open) return null;

  async function printDoc() {
    if (onPrint) {
      await onPrint();
      return;
    }
    if (printUrl) {
      const sep = printUrl.includes("?") ? "&" : "?";
      window.open(`${printUrl}${sep}print=1`, "_blank", "noopener");
      return;
    }
    window.open("", "_blank")?.document.write(
      "<p style='font-family:system-ui;padding:2rem'>Save the document first, then use Print from the preview.</p>",
    );
  }

  function emailCustomer() {
    if (!customerEmail) return;
    const subject = encodeURIComponent(title);
    const lines = [
      "Hi,\n",
      linkUrl
        ? `Please view your ${title.toLowerCase()} here:\n${linkUrl}\n`
        : `Please find your ${title.toLowerCase()} attached / as discussed.\n`,
      "\nThank you,\nRichard Petersen\nMyPainter",
    ];
    const body = encodeURIComponent(lines.join("\n"));
    window.location.href = `mailto:${encodeURIComponent(customerEmail)}?subject=${subject}&body=${body}`;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/70 backdrop-blur-sm">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-700/50 bg-[var(--mp-navy)] px-4 py-3 text-white">
        <div>
          <p className="text-sm font-bold">{title}</p>
          <p className="text-xs text-slate-300">Print opens the same A4 page the customer sees (quote-view)</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={printDoc}
            disabled={!printUrl && !onPrint}
            title={printUrl || onPrint ? "Open A4 print page" : "Save first"}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/20 disabled:opacity-40"
          >
            <Printer size={14} />
            Print / PDF
          </button>
          {onSend && (
            <button
              type="button"
              onClick={() => onSend()}
              disabled={sending || sendDisabled}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--mp-orange)] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
            >
              <Send size={14} />
              {sending ? "Sending…" : sendLabel}
            </button>
          )}
          {customerEmail && (
            <button
              type="button"
              onClick={emailCustomer}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold hover:bg-white/10"
            >
              Email
            </button>
          )}
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-white/10" aria-label="Close">
            <X size={18} />
          </button>
        </div>
      </div>

      {(sendHint || linkUrl) && (
        <div className="shrink-0 border-b border-slate-200 bg-sky-50 px-4 py-2 text-xs text-sky-900">
          {sendHint && <p>{sendHint}</p>}
          {linkUrl && <p className="mt-0.5 break-all font-mono text-[11px] text-sky-700">{linkUrl}</p>}
        </div>
      )}

      <div className="flex-1 overflow-y-auto bg-[#cfc9bc] p-4 sm:p-8">
        <div className="document-page-wrap !min-h-0 !bg-transparent !p-0">{children}</div>
      </div>
    </div>
  );
}
