CREATE TABLE IF NOT EXISTS quotes (
  id TEXT PRIMARY KEY,
  number TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  quote_date TEXT NOT NULL,
  valid_until TEXT NOT NULL,
  client_name TEXT NOT NULL DEFAULT '',
  client_address TEXT NOT NULL DEFAULT '',
  client_phone TEXT NOT NULL DEFAULT '',
  client_email TEXT NOT NULL DEFAULT '',
  job_address TEXT NOT NULL DEFAULT '',
  scope TEXT NOT NULL DEFAULT '',
  exclusions TEXT NOT NULL DEFAULT '',
  line_items TEXT NOT NULL DEFAULT '[]',
  total_cents INTEGER NOT NULL DEFAULT 0,
  deposit_cents INTEGER NOT NULL DEFAULT 0,
  gst_registered INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  notes TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS quote_seq (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  next_num INTEGER NOT NULL
);

INSERT OR IGNORE INTO quote_seq (id, next_num) VALUES (1, 131);
