import { requireAuth, json, unauthorized } from "../../_lib/auth.js";
import { rowsToBlocks } from "../../_lib/content.js";

export async function onRequestGet(context) {
  if (!(await requireAuth(context.request, context.env))) return unauthorized();
  const { DB } = context.env;
  if (!DB) return json({ error: "D1 not configured" }, 500);

  const page = context.params.page;
  const { results } = await DB.prepare(
    "SELECT block_key, content FROM page_blocks WHERE page_slug = ?",
  )
    .bind(page)
    .all();
  return json({ page, blocks: rowsToBlocks(results) });
}

export async function onRequestPut(context) {
  if (!(await requireAuth(context.request, context.env))) return unauthorized();
  const { DB } = context.env;
  if (!DB) return json({ error: "D1 not configured" }, 500);

  const page = context.params.page;
  let body;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const key = String(body.key || "");
  const content = String(body.content ?? "");
  if (!key) return json({ error: "key required" }, 400);

  const now = new Date().toISOString();
  await DB.prepare(
    `INSERT INTO page_blocks (page_slug, block_key, content, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(page_slug, block_key) DO UPDATE SET content = excluded.content, updated_at = excluded.updated_at`,
  )
    .bind(page, key, content, now)
    .run();

  return json({ ok: true, page, key, content });
}
