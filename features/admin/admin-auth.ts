import { createServerSupabaseClient } from '@features/shared/supabase-server';
import { supabaseAdmin } from '@features/shared/supabase';

/**
 * Per-person admin authorization for /internal/*.
 *
 * An admin is a signed-in user (existing GitHub OAuth) whose users.id is in
 * admin_users (migration 018). This replaces the shared INTERNAL_PASSWORD
 * Basic Auth for the human /internal PAGES. The machine /api/internal/* routes
 * keep their own CRON_SECRET/INTERNAL_PASSWORD and do not use this.
 *
 * No `import 'server-only'`: that package was removed repo-wide (2026-07-18
 * incident) and is banned from worker-reachable code. This module is already
 * unrunnable on the client anyway — it uses the service-role client and
 * next/headers cookies — so the guard would be redundant here.
 */

export type AdminRole = 'super_admin' | 'admin';

export type AdminIdentity = {
  /** The internal users.id — the attribution key for audit rows. */
  userId: string;
  role: AdminRole;
  githubUsername: string | null;
  email: string | null;
};

type AdminLookupRow = {
  role: AdminRole;
  users: { github_username: string | null; email: string | null } | null;
};

/**
 * Resolve the current admin from the session, or null. Two-step: read the
 * signed-in Supabase user (RLS client), then look up their internal user row
 * in admin_users (service role). Returns null for signed-out users, users
 * with no internal row, and non-admins alike — callers decide the response.
 */
export async function getCurrentAdmin(): Promise<AdminIdentity | null> {
  const supabase = await createServerSupabaseClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return null;

  // Map auth user -> internal users.id, then check admin membership in one
  // joined read. Service role because admin_users is RLS-locked.
  const { data, error } = (await supabaseAdmin
    .from('admin_users')
    .select('role, users!inner(github_username, email, auth_user_id)')
    .eq('users.auth_user_id', authData.user.id)
    .maybeSingle()) as unknown as { data: AdminLookupRow | null; error: { message: string } | null };

  if (error) {
    // Table missing (migration not applied) or a transient error: deny, do
    // not silently allow. Logged so a missing migration is obvious.
    console.error('[admin-auth] admin lookup failed (migration 018 applied?)', {
      message: error.message,
    });
    return null;
  }
  if (!data) return null;

  // Recover the internal user id via a second cheap lookup keyed on the auth
  // id (the join above filtered but did not select users.id).
  const { data: userRow } = (await supabaseAdmin
    .from('users')
    .select('id')
    .eq('auth_user_id', authData.user.id)
    .maybeSingle()) as unknown as { data: { id: string } | null };
  if (!userRow) return null;

  return {
    userId: userRow.id,
    role: data.role,
    githubUsername: data.users?.github_username ?? null,
    email: data.users?.email ?? null,
  };
}

/**
 * Guard for server ACTIONS. A layout redirect does NOT protect server actions
 * (they are independent POST endpoints), so every state-changing /internal
 * action must call this first. Throws on non-admins; returns the acting admin
 * otherwise. Optionally require super_admin.
 */
export async function requireAdmin(opts?: { superAdmin?: boolean }): Promise<AdminIdentity> {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error('Not authorized: admin access required.');
  if (opts?.superAdmin && admin.role !== 'super_admin') {
    throw new Error('Not authorized: super_admin access required.');
  }
  return admin;
}

/** Append an attributed audit row. Best-effort: never fails the action. */
export async function recordAdminAction(
  adminUserId: string,
  action: string,
  target: string | null
): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from('admin_audit_log').insert({
      admin_user_id: adminUserId,
      action,
      target,
    });
    if (error) {
      console.error('[admin-auth] failed to write audit row', { action, target, message: error.message });
    }
  } catch (err) {
    console.error('[admin-auth] audit write threw', {
      action,
      message: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * How many super_admins exist. Used to block removing the last one so the
 * system can never reach zero super_admins.
 */
export async function superAdminCount(): Promise<number> {
  const { count } = await supabaseAdmin
    .from('admin_users')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'super_admin');
  return count ?? 0;
}
