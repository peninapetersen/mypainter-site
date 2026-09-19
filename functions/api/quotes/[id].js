import { requireAuth, json, unauthorized } from "../../_lib/auth.js";
import { calcTotals, rowToQuote } from "../../_lib/quotes.js";

export async function onRequestGet(context) {
  if (!(await requireAuth(context.request, context.env))) return unauthorized();
  const id = context.params.id;
  const row = await context.env.DB.prepare("SELECT * FROM quotes WHERE id = ?").bind(id).first();
  if (!row) return json({ error: "Not found" }, 404);
  return json({ quote: rowToQuote(row) });
}

export async function onRequestPut(context) {
  if (!(await requireAuth(context.request, context.env))) return unauthorized();
  const id = context.params.id;
  const existing = await context.env.DB.prepare("SELECT * FROM quotes WHERE id = ?").bind(id).first();
  if (!existing) return json({ error: "Not found" }, 404);

  let body;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const { lineItems, totalCents } = calcTotals(body.lineItems);
  const depositCents = Math.round(Number(body.deposit || 0) * 100) || 0;
  const now = new Date().toISOString();
  const total = body.totalCents != null ? Math.round(Number(body.totalCents)) : totalCents;

  await context.env.DB.prepare(
    `UPDATE quotes SET
      updated_at = ?, quote_date = ?, valid_until = ?,
      client_name = ?, client_address = ?, client_phone = ?, client_email = ?, job_address = ?,
      scope = ?, exclusions = ?, line_items = ?, total_cents = ?, deposit_cents = ?,
      gst_registered = ?, status = ?, notes = ?
     WHERE id = ?`,
  )
    .bind(
      now,
      String(body.quoteDate || existing.quote_date),
      String(body.validUntil || existing.valid_until),
      String(body.clientName ?? existing.client_name),
      String(body.clientAddress ?? existing.client_address),
      String(body.clientPhone ?? existing.client_phone),
      String(body.clientEmail ?? existing.client_email),
      String(body.jobAddress ?? existing.job_address),
      String(body.scope ?? existing.scope),
      String(body.exclusions ?? existing.exclusions),
      JSON.stringify(lineItems),
      total,
      depositCents,
      body.gstRegistered ? 1 : 0,
      String(body.status || existing.status),
      String(body.notes ?? existing.notes),
      id,
    )
    .run();

  const row = await context.env.DB.prepare("SELECT * FROM quotes WHERE id = ?").bind(id).first();
  return json({ quote: rowToQuote(row) });
}

export async function onRequestDelete(context) {
  if (!(await requireAuth(context.request, context.env))) return unauthorized();
  const id = context.params.id;
  await context.env.DB.prepare("DELETE FROM quotes WHERE id = ?").bind(id).run();
  return json({ ok: true });
}
