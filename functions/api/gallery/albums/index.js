import { requireAuth, json, unauthorized } from "../../../_lib/auth.js";
import { rowToAlbum, uid, uniqueAlbumSlug } from "../../../_lib/gallery.js";

export async function onRequestGet(context) {
  if (!(await requireAuth(context.request, context.env))) return unauthorized();
  const { DB } = context.env;
  if (!DB) return json({ error: "D1 not configured" }, 500);

  const { results } = await DB.prepare(
    "SELECT * FROM gallery_albums ORDER BY sort_order ASC, title ASC",
  ).all();
  return json({ albums: (results || []).map(rowToAlbum) });
}

export async function onRequestPost(context) {
  if (!(await requireAuth(context.request, context.env))) return unauthorized();
  const { DB } = context.env;
  if (!DB) return json({ error: "D1 not configured" }, 500);

  let body;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const title = String(body.title || "").trim();
  if (!title) return json({ error: "Title required" }, 400);

  const id = uid();
  const slug = body.slug ? String(body.slug).trim() : await uniqueAlbumSlug(DB, title);
  const now = new Date().toISOString();
  const sortOrder = Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0;
  const published = body.published === false ? 0 : 1;

  try {
    await DB.prepare(
      `INSERT INTO gallery_albums (id, slug, title, sort_order, published, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(id, slug, title, sortOrder, published, now, now)
      .run();
  } catch (e) {
    return json({ error: e.message || "Could not create album" }, 400);
  }

  const row = await DB.prepare("SELECT * FROM gallery_albums WHERE id = ?").bind(id).first();
  return json({ album: rowToAlbum(row) }, 201);
}
