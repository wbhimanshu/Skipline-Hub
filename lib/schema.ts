export const SCHEMA_SQL = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
PRAGMA busy_timeout = 5000;

CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT '',
  pincode TEXT NOT NULL DEFAULT '',
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  open_time TEXT NOT NULL DEFAULT '09:00',
  close_time TEXT NOT NULL DEFAULT '18:00',
  slot_minutes INTEGER NOT NULL DEFAULT 15,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','suspended','rejected')),
  owner_user_id TEXT,
  priority_policy TEXT NOT NULL DEFAULT 'Priority is granted only after staff verification for senior citizens, persons with disabilities and approved medical emergencies.',
  cancellation_policy TEXT NOT NULL DEFAULT 'Please cancel at least 30 minutes before your slot. Three unexplained late cancellations within 30 days may temporarily limit new bookings.',
  emergency_enabled INTEGER NOT NULL DEFAULT 0,
  services TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  approved_at TEXT,
  status_reason TEXT
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user','org','admin')),
  org_id TEXT REFERENCES organizations(id) ON DELETE SET NULL,
  phone TEXT NOT NULL DEFAULT '',
  email_verified_at TEXT,
  verification_token TEXT,
  verification_expires_at TEXT,
  reset_token TEXT,
  reset_expires_at TEXT,
  language TEXT NOT NULL DEFAULT 'en',
  large_text INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  restricted_until TEXT,
  restriction_reason TEXT,
  last_login_at TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  user_agent TEXT NOT NULL DEFAULT '',
  ip TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS counters (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_no TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'queue' CHECK (kind IN ('queue','appointment')),
  status TEXT NOT NULL DEFAULT 'waiting'
    CHECK (status IN ('booked','waiting','serving','completed','cancelled','no_show')),
  priority TEXT NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('normal','senior','disability','emergency')),
  priority_reason TEXT NOT NULL DEFAULT '',
  scheduled_for TEXT,
  counter_id TEXT REFERENCES counters(id) ON DELETE SET NULL,
  checked_in_at TEXT,
  called_at TEXT,
  completed_at TEXT,
  cancelled_at TEXT,
  cancel_reason TEXT,
  cancel_category TEXT,
  service_seconds INTEGER,
  queue_date TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (org_id, queue_date, token_no)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tickets_one_active
  ON tickets(user_id, org_id)
  WHERE status IN ('booked','waiting','serving');

CREATE INDEX IF NOT EXISTS idx_tickets_org_status ON tickets(org_id, status, queue_date);
CREATE INDEX IF NOT EXISTS idx_tickets_user ON tickets(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_completed ON tickets(org_id, completed_at);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  ticket_id TEXT REFERENCES tickets(id) ON DELETE SET NULL,
  read_at TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read_at, created_at DESC);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  actor_id TEXT,
  actor_role TEXT NOT NULL,
  org_id TEXT,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  details TEXT NOT NULL DEFAULT '{}',
  ip TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);

CREATE TABLE IF NOT EXISTS emergency_requests (
  id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','declined','withdrawn')),
  reviewed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  review_note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  resolved_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_emergency_org ON emergency_requests(org_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS restrictions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','expired','reversed')),
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  created_by TEXT,
  created_at TEXT NOT NULL,
  reversed_by TEXT,
  reversed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_restrictions_user ON restrictions(user_id, status);

CREATE TABLE IF NOT EXISTS appeals (
  id TEXT PRIMARY KEY,
  restriction_id TEXT NOT NULL REFERENCES restrictions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','accepted','rejected')),
  admin_note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  resolved_at TEXT,
  resolved_by TEXT
);

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  org_id TEXT REFERENCES organizations(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','reviewing','resolved')),
  admin_note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  resolved_at TEXT
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS email_log (
  id TEXT PRIMARY KEY,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  action_url TEXT,
  created_at TEXT NOT NULL
);
`;
