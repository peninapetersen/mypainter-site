import { requireAuth, json, unauthorized } from "../../../_lib/auth.js";
import { rowToPhoto } from "../../../_lib/gallery.js";

export async function onRequestPut(context) {
  if (!(await requireAuth(context.request, context.env))) return unauthorized();
  const { DB } = context.env;
  if (!DB) return json({ error: "D1 not configured" }, 500);

  const id = context.params.id;
  let body;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const row = await DB.prepare("SELECT * FROM gallery_photos WHERE id = ?").bind(id).first();
  if (!row) return json({ error: "Not found" }, 404);

  const now = new Date().toISOString();
  const caption = body.caption != null ? String(body.caption) : row.caption;
  const altText = body.altText != null ? String(body.altText) : row.alt_text;
  const sortOrder = body.sortOrder != null ? Number(body.sortOrder) : row.sort_order;
  const albumId = body.albumId != null ? String(body.albumId) : row.album_id;

  await DB.prepare(
    `UPDATE gallery_photos SET album_id = ?, caption = ?, alt_text = ?, sort_order = ?, updated_at = ? WHERE id = ?`,
  )
    .bind(albumId, caption, altText, sortOrder, now, id)
    .run();

  const origin = new URL(context.request.url).origin;
  const updated = await DB.prepare("SELECT * FROM gallery_photos WHERE id = ?").bind(id).first();
  return json({ photo: rowToPhoto(updated, origin) });
}

export async function onRequestDelete(context) {
  if (!(await requireAuth(context.request, context.env))) return unauthorized();
  const { DB, GALLERY } = context.env;
  if (!DB) return json({ error: "D1 not configured" }, 500);

  const id = context.params.id;
  const row = await DB.prepare("SELECT * FROM gallery_photos WHERE id = ?").bind(id).first();
  if (!row) return json({ error: "Not found" }, 404);

  if (row.r2_key && GALLERY) await GALLERY.delete(row.r2_key);
  await DB.prepare("DELETE FROM gallery_photos WHERE id = ?").bind(id).run();
  return json({ ok: true });
}
