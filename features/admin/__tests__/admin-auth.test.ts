import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Proves the admin authorization core: a signed-in non-admin is denied,
 * requireAdmin enforces super_admin when asked, and the last-super-admin
 * guard is computable (superAdminCount). These back the two security
 * guarantees: no non-admin reaches /internal, and the roster can never reach
 * zero super_admins.
 */

const h = vi.hoisted(() => ({
  authUser: null as { id: string } | null,
  adminRow: null as { role: string } | null,
  userRow: null as { id: string } | null,
  superCount: 0,
}));

vi.mock('@features/shared/supabase-server', () => ({
  createServerSupabaseClient: async () => ({
    auth: { getUser: async () => ({ data: { user: h.authUser } }) },
  }),
}));

vi.mock('@features/shared/supabase', () => ({
  supabaseAdmin: {
    from: (table: string) => {
      if (table === 'admin_users') {
        return {
          select: (_cols: string, opts?: { count?: string; head?: boolean }) => {
            // superAdminCount path: .select('id',{count}).eq('role','super_admin')
            if (opts?.count) {
              return { eq: async () => ({ count: h.superCount }) };
            }
            // getCurrentAdmin path: single query embedding users (incl. id).
            return {
              eq: () => ({
                maybeSingle: async () => ({
                  data: h.adminRow
                    ? {
                        role: h.adminRow.role,
                        users: {
                          id: h.userRow?.id ?? 'user1',
                          github_username: 'x',
                          email: 'x@e.com',
                        },
                      }
                    : null,
                  error: null,
                }),
              }),
            };
          },
        };
      }
      return {};
    },
  },
}));

import { getCurrentAdmin, requireAdmin, superAdminCount } from '@features/admin/admin-auth';

beforeEach(() => {
  h.authUser = null;
  h.adminRow = null;
  h.userRow = null;
  h.superCount = 0;
});

describe('getCurrentAdmin', () => {
  it('returns null when signed out', async () => {
    h.authUser = null;
    expect(await getCurrentAdmin()).toBeNull();
  });

  it('returns null for a signed-in user who is not in admin_users', async () => {
    h.authUser = { id: 'auth1' };
    h.adminRow = null; // not an admin
    expect(await getCurrentAdmin()).toBeNull();
  });

  it('returns the identity for a signed-in admin', async () => {
    h.authUser = { id: 'auth1' };
    h.adminRow = { role: 'admin' };
    h.userRow = { id: 'user1' };
    const admin = await getCurrentAdmin();
    expect(admin).toMatchObject({ userId: 'user1', role: 'admin' });
  });
});

describe('requireAdmin', () => {
  it('throws for a non-admin (server actions are not protected by the layout)', async () => {
    h.authUser = { id: 'auth1' };
    h.adminRow = null;
    await expect(requireAdmin()).rejects.toThrow(/admin access required/i);
  });

  it('throws for an admin when super_admin is required', async () => {
    h.authUser = { id: 'auth1' };
    h.adminRow = { role: 'admin' };
    h.userRow = { id: 'user1' };
    await expect(requireAdmin({ superAdmin: true })).rejects.toThrow(/super_admin/i);
  });

  it('allows a super_admin through the super_admin gate', async () => {
    h.authUser = { id: 'auth1' };
    h.adminRow = { role: 'super_admin' };
    h.userRow = { id: 'user1' };
    const admin = await requireAdmin({ superAdmin: true });
    expect(admin.role).toBe('super_admin');
  });
});

describe('superAdminCount (last-super-admin guard input)', () => {
  it('reflects the count used to block removing the final super_admin', async () => {
    h.superCount = 1;
    expect(await superAdminCount()).toBe(1);
    h.superCount = 3;
    expect(await superAdminCount()).toBe(3);
  });
});
