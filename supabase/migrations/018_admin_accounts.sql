-- Migration 018: per-person admin accounts + audit log
--
-- Replaces the single shared /internal Basic Auth password with named admins.
-- An admin is a signed-in user (existing GitHub OAuth) whose users.id is in
-- admin_users. Every state-changing /internal action is attributed to the
-- acting admin in admin_audit_log.
--
-- Machine endpoints (/api/internal/*, called by the GitHub Actions cron) keep
-- their own CRON_SECRET/INTERNAL_PASSWORD auth and are NOT affected here.
--
-- Both tables are service-role-only (RLS enabled, no policies), same pattern
-- as credit_packs / affiliate_commissions. Run manually in Supabase.

-- 1. Admin roster -----------------------------------------------------------

CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin')),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
-- No policies: all reads/writes go through the service role.

-- 2. Audit log --------------------------------------------------------------

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  target TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_audit_log_created_at_idx
  ON admin_audit_log (created_at DESC);

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
-- No policies: service-role only.

-- 3. Seed the founding admins ----------------------------------------------
-- Seeded by github_username lookup (stable, not environment-specific). If a
-- username is not found the row is simply skipped; re-running is safe
-- (ON CONFLICT on the UNIQUE user_id).

INSERT INTO admin_users (user_id, role)
SELECT id, 'super_admin' FROM users WHERE github_username = 'Eng-Alvin'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO admin_users (user_id, role)
SELECT id, 'admin' FROM users WHERE github_username = 'hamishfromatech'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO admin_users (user_id, role)
SELECT id, 'admin' FROM users WHERE github_username = 'Blesskimbi'
ON CONFLICT (user_id) DO NOTHING;
