import { supabaseAdmin } from '@features/shared/supabase';
import { getCurrentAdmin } from '@features/admin/admin-auth';
import { addAdmin, removeAdmin } from './actions';
import { PageHeader, Card, Table, Badge, Button } from '../ui';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type AdminRow = {
  id: string;
  role: 'super_admin' | 'admin';
  created_at: string;
  users: { github_username: string | null; email: string | null } | null;
};

/**
 * Admin roster — super_admin only for changes. Any admin can view. The server
 * actions independently enforce super_admin regardless of what renders here.
 */
export default async function InternalAdminsPage() {
  const me = await getCurrentAdmin();
  const isSuper = me?.role === 'super_admin';

  // Name the relationship: admin_users has two FKs to users (user_id,
  // created_by), so a bare users(...) embed is ambiguous (PGRST201).
  const { data } = await supabaseAdmin
    .from('admin_users')
    .select('id, role, created_at, users!admin_users_user_id_fkey(github_username, email)')
    .order('created_at', { ascending: true });
  const admins = (data ?? []) as unknown as AdminRow[];

  return (
    <>
      <PageHeader
        title="Admins"
        subtitle={isSuper ? 'You are a super_admin.' : 'Read-only — you are an admin, not a super_admin.'}
      />

      <div className="mb-8">
        <Table
          head={
            <tr>
              <th className="px-4 py-2">Admin</th>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2">Added</th>
              <th className="px-4 py-2" />
            </tr>
          }
        >
          {admins.map((a) => (
            <tr key={a.id} className="text-secondary">
              <td className="px-4 py-2 text-primary">
                {a.users?.github_username ?? a.users?.email ?? 'unknown'}
              </td>
              <td className="px-4 py-2">
                <Badge tone={a.role === 'super_admin' ? 'purple' : 'neutral'}>{a.role}</Badge>
              </td>
              <td className="px-4 py-2 text-muted">{new Date(a.created_at).toLocaleDateString()}</td>
              <td className="px-4 py-2">
                {isSuper && (
                  <form action={removeAdmin}>
                    <input type="hidden" name="admin_row_id" value={a.id} />
                    <Button type="submit" variant="danger">
                      remove
                    </Button>
                  </form>
                )}
              </td>
            </tr>
          ))}
        </Table>
      </div>

      {isSuper && (
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-primary">Add admin</h2>
          <form action={addAdmin} className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-xs text-secondary">
              github username or email (must have logged in)
              <input
                name="identifier"
                required
                placeholder="octocat"
                className="rounded-lg border border-surface-border bg-surface-raised px-2 py-1.5 text-sm text-primary outline-none focus:border-accent"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-secondary">
              role
              <select
                name="role"
                defaultValue="admin"
                className="rounded-lg border border-surface-border bg-surface-raised px-2 py-1.5 text-sm text-primary outline-none focus:border-accent"
              >
                <option value="admin">admin</option>
                <option value="super_admin">super_admin</option>
              </select>
            </label>
            <Button type="submit" variant="primary">
              Add
            </Button>
          </form>
        </Card>
      )}
    </>
  );
}
