import { json } from "../../_lib/auth.js";
import { rowToAlbum, rowToPhoto } from "../../_lib/gallery.js";

export async function onRequestGet(context) {
  const { DB } = context.env;
  if (!DB) return json({ albums: [], fallback: true });

  try {
    const origin = new URL(context.request.url).origin;
    const { results: albums } = await DB.prepare(
      "SELECT * FROM gallery_albums WHERE published = 1 ORDER BY sort_order ASC, title ASC",
    ).all();

    const out = [];
    for (const row of albums || []) {
      const album = rowToAlbum(row);
      const { results: photos } = await DB.prepare(
        "SELECT * FROM gallery_photos WHERE album_id = ? ORDER BY sort_order ASC, created_at ASC",
      )
        .bind(album.id)
        .all();
      out.push({ ...album, photos: (photos || []).map((p) => rowToPhoto(p, origin)) });
    }
    return json({ albums: out });
  } catch {
    return json({ albums: [], fallback: true });
  }
}
