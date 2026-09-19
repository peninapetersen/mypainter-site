import { requireAuth, json, unauthorized } from "../../_lib/auth.js";
import { rowToPhoto, uid } from "../../_lib/gallery.js";

export async function onRequestPost(context) {
  if (!(await requireAuth(context.request, context.env))) return unauthorized();
  const { DB, GALLERY } = context.env;
  if (!DB) return json({ error: "D1 not configured" }, 500);
  if (!GALLERY) return json({ error: "R2 gallery bucket not configured" }, 500);

  const form = await context.request.formData();
  const file = form.get("file");
  const albumId = String(form.get("albumId") || "");
  const caption = String(form.get("caption") || "");
  const altText = String(form.get("altText") || caption);

  if (!file || typeof file === "string") return json({ error: "file required" }, 400);
  if (!albumId) return json({ error: "albumId required" }, 400);

  const album = await DB.prepare("SELECT slug FROM gallery_albums WHERE id = ?").bind(albumId).first();
  if (!album) return json({ error: "Album not found" }, 404);

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const r2Key = `gallery/${album.slug}/${uid()}.${ext}`;
  const contentType = file.type || "image/jpeg";

  await GALLERY.put(r2Key, file.stream(), {
    httpMetadata: { contentType },
  });

  const id = uid();
  const now = new Date().toISOString();
  const countRow = await DB.prepare("SELECT COUNT(*) AS c FROM gallery_photos WHERE album_id = ?")
    .bind(albumId)
    .first();
  const sortOrder = Number(countRow?.c || 0);

  await DB.prepare(
    `INSERT INTO gallery_photos (id, album_id, url, r2_key, caption, alt_text, sort_order, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(id, albumId, `/api/media/${r2Key}`, r2Key, caption, altText, sortOrder, now, now)
    .run();

  const origin = new URL(context.request.url).origin;
  const row = await DB.prepare("SELECT * FROM gallery_photos WHERE id = ?").bind(id).first();
  return json({ photo: rowToPhoto(row, origin) }, 201);
}
