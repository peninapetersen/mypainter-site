import { requireAuth, json, unauthorized } from "../../_lib/auth.js";
import { calcTotals, nextQuoteNumber, rowToQuote, uid } from "../../_lib/quotes.js";

export async function onRequestGet(context) {
  if (!(await requireAuth(context.request, context.env))) return unauthorized();
  const { DB } = context.env;
  const { results } = await DB.prepare(
    "SELECT * FROM quotes ORDER BY created_at DESC LIMIT 200",
  ).all();
  return json({ quotes: (results || []).map(rowToQuote) });
}

export async function onRequestPost(context) {
  if (!(await requireAuth(context.request, context.env))) return unauthorized();
  const { DB } = context.env;
  let body;
  try {
    body = await requestBody(context.request);
  } catch (e) {
    return json({ error: e.message || "Invalid body" }, 400);
  }

  const { lineItems, totalCents } = calcTotals(body.lineItems);
  const id = uid();
  const number = await nextQuoteNumber(DB);
  const now = new Date().toISOString();
  const quoteDate = body.quoteDate || now.slice(0, 10);
  const validUntil = body.validUntil || addDays(quoteDate, 30);
  const depositCents = Math.round(Number(body.deposit || 0) * 100) || 0;

  await DB.prepare(
    `INSERT INTO quotes (
      id, number, created_at, updated_at, quote_date, valid_until,
      client_name, client_address, client_phone, client_email, job_address,
      scope, exclusions, line_items, total_cents, deposit_cents, gst_registered, status, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      number,
      now,
      now,
      quoteDate,
      validUntil,
      String(body.clientName || ""),
      String(body.clientAddress || ""),
      String(body.clientPhone || ""),
      String(body.clientEmail || ""),
      String(body.jobAddress || ""),
      String(body.scope || ""),
      String(body.exclusions || ""),
      JSON.stringify(lineItems),
      body.totalCents != null ? Math.round(Number(body.totalCents)) : totalCents,
      depositCents,
      body.gstRegistered ? 1 : 0,
      String(body.status || "draft"),
      String(body.notes || ""),
    )
    .run();

  const row = await DB.prepare("SELECT * FROM quotes WHERE id = ?").bind(id).first();
  return json({ quote: rowToQuote(row) }, 201);
}

async function requestBody(req) {
  return await req.json();
}

function addDays(isoDate, days) {
  const d = new Date(isoDate + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
