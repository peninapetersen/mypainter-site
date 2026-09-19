import { requireAuth, json, unauthorized } from "../../../_lib/auth.js";
import { rowToAlbum, rowToPhoto, uid, uniqueAlbumSlug } from "../../../_lib/gallery.js";

export async function onRequestGet(context) {
  if (!(await requireAuth(context.request, context.env))) return unauthorized();
  const { DB } = context.env;
  if (!DB) return json({ error: "D1 not configured" }, 500);

  const origin = new URL(context.request.url).origin;
  const { results } = await DB.prepare(
    "SELECT * FROM gallery_albums ORDER BY sort_order ASC, title ASC",
  ).all();

  const albums = [];
  for (const row of results || []) {
    const album = rowToAlbum(row);
    const coverRow = await DB.prepare(
      "SELECT * FROM gallery_photos WHERE album_id = ? ORDER BY sort_order ASC, created_at ASC LIMIT 1",
    )
      .bind(album.id)
      .first();
    const countRow = await DB.prepare("SELECT COUNT(*) AS c FROM gallery_photos WHERE album_id = ?")
      .bind(album.id)
      .first();
    albums.push({
      ...album,
      photoCount: Number(countRow?.c || 0),
      coverUrl: coverRow ? rowToPhoto(coverRow, origin).url : null,
    });
  }
  return json({ albums });
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
