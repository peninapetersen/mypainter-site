import { requireAuth, json, unauthorized } from "../../../_lib/auth.js";
import { formatMoney, rowToQuote, FROM_DEFAULTS } from "../../../_lib/quotes.js";

export async function onRequestPost(context) {
  if (!(await requireAuth(context.request, context.env))) return unauthorized();
  const id = context.params.id;
  const row = await context.env.DB.prepare("SELECT * FROM quotes WHERE id = ?").bind(id).first();
  if (!row) return json({ error: "Not found" }, 404);
  const quote = rowToQuote(row);

  let body = {};
  try {
    body = await context.request.json();
  } catch {
    /* optional */
  }

  const to = String(body.to || quote.clientEmail || "").trim();
  if (!to) return json({ error: "Client email required" }, 400);

  const apiKey = context.env.RESEND_API_KEY;
  if (!apiKey) {
    return json(
      {
        error: "RESEND_API_KEY not set. Add it in Cloudflare Pages → Settings → Environment variables.",
      },
      500,
    );
  }

  const from = context.env.RESEND_FROM || "MyPainter Quotes <onboarding@resend.dev>";
  const origin = new URL(context.request.url).origin;
  const link = `${origin}/q/${id}`;
  const subject = body.subject || `Quotation ${quote.number} — mypainter.co.nz`;
  const total = formatMoney(quote.totalCents);
  const deposit = formatMoney(quote.depositCents);

  const html = `
    <p>Hi ${escapeHtml(quote.clientName || "there")},</p>
    <p>Please find your quotation <strong>${escapeHtml(quote.number)}</strong> from ${escapeHtml(FROM_DEFAULTS.name)}.</p>
    <p><strong>Total:</strong> ${total}<br/><strong>Deposit:</strong> ${deposit}</p>
    <p><a href="${link}">View / print your quote</a></p>
    <p>Questions? Call ${escapeHtml(FROM_DEFAULTS.phone)} or reply to this email.</p>
    <p>— ${escapeHtml(FROM_DEFAULTS.name)}<br/>mypainter.co.nz</p>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: FROM_DEFAULTS.email,
      subject,
      html,
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    return json({ error: `Resend ${res.status}: ${text.slice(0, 400)}` }, 502);
  }

  await context.env.DB.prepare("UPDATE quotes SET status = ?, updated_at = ? WHERE id = ?")
    .bind("sent", new Date().toISOString(), id)
    .run();

  let resend;
  try {
    resend = JSON.parse(text);
  } catch {
    resend = text;
  }
  return json({ ok: true, link, resend });
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
