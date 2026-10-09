/** Opens Gmail compose in a new tab with a report email ready to send. */
export function openReportGmail({ to, subject, body }: { to: string; subject: string; body: string }): void {
  const params = new URLSearchParams({ view: "cm", fs: "1", to: to.trim(), su: subject, body });
  const opened = window.open(`https://mail.google.com/mail/?${params.toString()}`, "_blank", "noopener,noreferrer");
  if (!opened) throw new Error("Pop-up blocked — allow pop-ups for mypainter.co.nz, then try again.");
}

export function reportEmailBody(args: { customerName?: string; reportLabel: string; linkUrl: string; senderName?: string; businessName?: string }): string {
  const hi = args.customerName?.trim() ? `Hi ${args.customerName.trim()}` : "Hi";
  return [
    `${hi},`,
    "",
    `Please find your ${args.reportLabel} here:`,
    args.linkUrl,
    "",
    "Thank you,",
    args.senderName?.trim() || "Richard Petersen",
    args.businessName?.trim() || "MyPainter",
  ].join("\n");
}
