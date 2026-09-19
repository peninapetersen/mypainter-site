import { requireAuth, json, unauthorized } from "../../../_lib/auth.js";
import { rowToAlbum, slugify } from "../../../_lib/gallery.js";

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

  const now = new Date().toISOString();
  const row = await DB.prepare("SELECT * FROM gallery_albums WHERE id = ?").bind(id).first();
  if (!row) return json({ error: "Not found" }, 404);

  const title = body.title != null ? String(body.title).trim() : row.title;
  const slug = body.slug != null ? slugify(body.slug) : row.slug;
  const sortOrder = body.sortOrder != null ? Number(body.sortOrder) : row.sort_order;
  const published = body.published === false ? 0 : body.published === true ? 1 : row.published;

  try {
    await DB.prepare(
      `UPDATE gallery_albums SET title = ?, slug = ?, sort_order = ?, published = ?, updated_at = ? WHERE id = ?`,
    )
      .bind(title, slug, sortOrder, published, now, id)
      .run();
  } catch (e) {
    return json({ error: e.message || "Update failed" }, 400);
  }

  const updated = await DB.prepare("SELECT * FROM gallery_albums WHERE id = ?").bind(id).first();
  return json({ album: rowToAlbum(updated) });
}

export async function onRequestDelete(context) {
  if (!(await requireAuth(context.request, context.env))) return unauthorized();
  const { DB, GALLERY } = context.env;
  if (!DB) return json({ error: "D1 not configured" }, 500);

  const id = context.params.id;
  const { results: photos } = await DB.prepare("SELECT r2_key FROM gallery_photos WHERE album_id = ?")
    .bind(id)
    .all();

  await DB.prepare("DELETE FROM gallery_photos WHERE album_id = ?").bind(id).run();
  await DB.prepare("DELETE FROM gallery_albums WHERE id = ?").bind(id).run();

  if (GALLERY) {
    for (const p of photos || []) {
      if (p.r2_key) await GALLERY.delete(p.r2_key);
    }
  }

  return json({ ok: true });
}
