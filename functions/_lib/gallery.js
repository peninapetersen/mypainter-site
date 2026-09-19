export function rowToAlbum(row) {
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    sortOrder: row.sort_order,
    published: !!row.published,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function rowToPhoto(row, origin) {
  if (!row) return null;
  const url = photoUrl(row, origin);
  return {
    id: row.id,
    albumId: row.album_id,
    url,
    r2Key: row.r2_key || null,
    caption: row.caption,
    altText: row.alt_text,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function photoUrl(row, origin) {
  if (row.r2_key) {
    return `${origin}/api/media/${row.r2_key}`;
  }
  return row.url;
}

export function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "album";
}

export function uid() {
  return crypto.randomUUID();
}

export async function uniqueAlbumSlug(db, base) {
  let slug = slugify(base);
  let n = 1;
  while (true) {
    const existing = await db.prepare("SELECT id FROM gallery_albums WHERE slug = ?").bind(slug).first();
    if (!existing) return slug;
    n += 1;
    slug = `${slugify(base)}-${n}`;
  }
}
