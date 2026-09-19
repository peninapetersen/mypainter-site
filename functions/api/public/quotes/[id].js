import { json } from "../../../_lib/auth.js";
import { rowToQuote } from "../../../_lib/quotes.js";

export async function onRequestGet(context) {
  const id = context.params.id;
  const row = await context.env.DB.prepare(
    "SELECT * FROM quotes WHERE id = ? AND status != 'deleted'",
  )
    .bind(id)
    .first();
  if (!row) return json({ error: "Not found" }, 404);
  return json({ quote: rowToQuote(row) });
}
