CREATE TABLE IF NOT EXISTS inquiries (
  id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  ip_hash TEXT NOT NULL,
  payload TEXT NOT NULL CHECK (json_valid(payload)),
  notification_status TEXT NOT NULL DEFAULT 'pending'
);
CREATE INDEX IF NOT EXISTS inquiries_rate ON inquiries(ip_hash, created_at);
CREATE INDEX IF NOT EXISTS inquiries_expiry ON inquiries(expires_at);
