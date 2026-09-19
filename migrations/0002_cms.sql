CREATE TABLE IF NOT EXISTS gallery_albums (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  published INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS gallery_photos (
  id TEXT PRIMARY KEY,
  album_id TEXT NOT NULL,
  url TEXT NOT NULL,
  r2_key TEXT,
  caption TEXT NOT NULL DEFAULT '',
  alt_text TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (album_id) REFERENCES gallery_albums(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS page_blocks (
  page_slug TEXT NOT NULL,
  block_key TEXT NOT NULL,
  content TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (page_slug, block_key)
);

CREATE INDEX IF NOT EXISTS idx_gallery_photos_album ON gallery_photos(album_id, sort_order);

-- Seed default album + existing gallery items (static /images/ paths)
INSERT OR IGNORE INTO gallery_albums (id, slug, title, sort_order, published, created_at, updated_at)
VALUES ('album-recent', 'recent-work', 'Recent Work', 0, 1, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO gallery_photos (id, album_id, url, r2_key, caption, alt_text, sort_order, created_at, updated_at) VALUES
('gp-01', 'album-recent', '/images/service-interior.jpg', NULL, 'Interior Repaint — Kamo', 'Interior repaint in Kamo, Whangarei', 0, datetime('now'), datetime('now')),
('gp-02', 'album-recent', '/images/service-exterior.jpg', NULL, 'Exterior Weatherboard — Onerahi', 'Exterior weatherboard painting in Onerahi', 1, datetime('now'), datetime('now')),
('gp-03', 'album-recent', '/images/service-roof.jpg', NULL, 'Roof Restoration — Tikipunga', 'Roof restoration in Tikipunga', 2, datetime('now'), datetime('now')),
('gp-04', 'album-recent', '/images/service-exterior.jpg', NULL, 'Deck Staining — Ngunguru', 'Deck staining and outdoor finishes in Ngunguru', 3, datetime('now'), datetime('now')),
('gp-05', 'album-recent', '/images/service-handyman.jpg', NULL, 'Fence Rebuild — Hikurangi', 'Fence rebuild and handyman work in Hikurangi', 4, datetime('now'), datetime('now')),
('gp-06', 'album-recent', '/images/service-interior.jpg', NULL, 'Kitchen Refresh — Whangarei', 'Kitchen refresh interior painting in Whangarei', 5, datetime('now'), datetime('now')),
('gp-07', 'album-recent', '/images/service-handyman.jpg', NULL, 'Gib Repair — Maunu', 'Gib repair and plastering in Maunu', 6, datetime('now'), datetime('now')),
('gp-08', 'album-recent', '/images/richo.jpg', NULL, 'Commercial Shop — Whangarei CBD', 'Commercial shop maintenance in Whangarei CBD', 7, datetime('now'), datetime('now')),
('gp-09', 'album-recent', '/images/hero.jpg', NULL, 'Before & After — Flood Damage', 'Insurance repair and repaint after flood damage', 8, datetime('now'), datetime('now')),
('gp-10', 'album-recent', '/images/service-roof.jpg', NULL, 'Shed Repaint — Whangarei Heads', 'Shed repaint in Whangarei Heads', 9, datetime('now'), datetime('now')),
('gp-11', 'album-recent', '/images/service-exterior.jpg', NULL, 'Soffit Repair — Kensington', 'Soffit repair and exterior work in Kensington', 10, datetime('now'), datetime('now')),
('gp-12', 'album-recent', '/images/hero.jpg', NULL, 'Full Exterior — Glenbervie', 'Full exterior repaint in Glenbervie', 11, datetime('now'), datetime('now'));
