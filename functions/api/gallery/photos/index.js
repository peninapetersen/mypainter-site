import { requireAuth, json, unauthorized } from "../../../_lib/auth.js";
import { rowToPhoto, uid } from "../../../_lib/gallery.js";

export async function onRequestGet(context) {
  if (!(await requireAuth(context.request, context.env))) return unauthorized();
  const { DB } = context.env;
  if (!DB) return json({ error: "D1 not configured" }, 500);

  const albumId = new URL(context.request.url).searchParams.get("albumId");
  if (!albumId) return json({ error: "albumId required" }, 400);

  const origin = new URL(context.request.url).origin;
  const { results } = await DB.prepare(
    "SELECT * FROM gallery_photos WHERE album_id = ? ORDER BY sort_order ASC, created_at ASC",
  )
    .bind(albumId)
    .all();

  return json({ photos: (results || []).map((p) => rowToPhoto(p, origin)) });
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

  const albumId = String(body.albumId || "");
  const url = String(body.url || "").trim();
  if (!albumId || !url) return json({ error: "albumId and url required" }, 400);

  const id = uid();
  const now = new Date().toISOString();
  const sortOrder = Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0;

  await DB.prepare(
    `INSERT INTO gallery_photos (id, album_id, url, r2_key, caption, alt_text, sort_order, created_at, updated_at)
     VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      albumId,
      url,
      String(body.caption || ""),
      String(body.altText || body.caption || ""),
      sortOrder,
      now,
      now,
    )
    .run();

  const origin = new URL(context.request.url).origin;
  const row = await DB.prepare("SELECT * FROM gallery_photos WHERE id = ?").bind(id).first();
  return json({ photo: rowToPhoto(row, origin) }, 201);
}
