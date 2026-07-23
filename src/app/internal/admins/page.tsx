import { supabaseAdmin } from '@features/shared/supabase';
import { getCurrentAdmin } from '@features/admin/admin-auth';
import { addAdmin, removeAdmin } from './actions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type AdminRow = {
  id: string;
  role: 'super_admin' | 'admin';
  created_at: string;
  users: { github_username: string | null; email: string | null } | null;
};

/**
 * Admin roster management — super_admin only. Non-super-admins who reach this
 * page (the layout lets any admin in) see a notice instead of the controls;
 * the server actions independently enforce super_admin regardless.
 */
export default async function InternalAdminsPage() {
  const me = await getCurrentAdmin();
  const isSuper = me?.role === 'super_admin';

  const { data } = await supabaseAdmin
    .from('admin_users')
    .select('id, role, created_at, users(github_username, email)')
    .order('created_at', { ascending: true });
  const admins = (data ?? []) as unknown as AdminRow[];

  return (
    <main className="min-h-screen bg-zinc-950 p-8 font-mono text-sm text-zinc-100">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admins</h1>
        <nav className="flex gap-4 text-xs text-blue-300">
          <a href="/internal">status</a>
          <a href="/internal/audit">audit</a>
          <a href="/internal/metrics">metrics</a>
        </nav>
      </div>

      {!isSuper && (
        <p className="mb-6 rounded border border-yellow-700 bg-yellow-950/30 p-3 text-yellow-300">
          You are an admin but not a super_admin, so you can view the roster but not
          change it.
        </p>
      )}

      <div className="mb-8 space-y-1">
        {admins.map((a) => (
          <div key={a.id} className="flex items-center gap-4">
            <span className="w-48 truncate">
              {a.users?.github_username ?? a.users?.email ?? 'unknown'}
            </span>
            <span
              className={a.role === 'super_admin' ? 'w-28 text-purple-300' : 'w-28 text-zinc-400'}
            >
              {a.role}
            </span>
            <span className="w-28 text-zinc-600">
              {new Date(a.created_at).toLocaleDateString()}
            </span>
            {isSuper && (
              <form action={removeAdmin}>
                <input type="hidden" name="admin_row_id" value={a.id} />
                <button
                  type="submit"
                  className="rounded border border-zinc-700 px-2 py-0.5 text-xs text-red-300 hover:bg-zinc-800"
                >
                  remove
                </button>
              </form>
            )}
          </div>
        ))}
      </div>

      {isSuper && (
        <section>
          <h2 className="mb-3 text-lg font-bold">Add admin</h2>
          <form action={addAdmin} className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-xs text-zinc-400">
              github username or email (must have logged in)
              <input
                name="identifier"
                required
                placeholder="octocat"
                className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-zinc-100"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-zinc-400">
              role
              <select
                name="role"
                defaultValue="admin"
                className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-zinc-100"
              >
                <option value="admin">admin</option>
                <option value="super_admin">super_admin</option>
              </select>
            </label>
            <button
              type="submit"
              className="rounded border border-zinc-600 px-3 py-1 hover:bg-zinc-800"
            >
              Add
            </button>
          </form>
        </section>
      )}
    </main>
  );
}
