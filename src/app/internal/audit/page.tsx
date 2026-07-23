import { supabaseAdmin } from '@features/shared/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type AuditRow = {
  id: string;
  action: string;
  target: string | null;
  created_at: string;
  users: { github_username: string | null; email: string | null } | null;
};

/**
 * Read-only audit trail: every state-changing /internal action, attributed to
 * the admin who performed it. Any admin can view it.
 */
export default async function InternalAuditPage() {
  const { data } = await supabaseAdmin
    .from('admin_audit_log')
    .select('id, action, target, created_at, users:admin_user_id(github_username, email)')
    .order('created_at', { ascending: false })
    .limit(500);
  const rows = (data ?? []) as unknown as AuditRow[];

  return (
    <main className="min-h-screen bg-zinc-950 p-8 font-mono text-sm text-zinc-100">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Audit log</h1>
        <nav className="flex gap-4 text-xs text-blue-300">
          <a href="/internal">status</a>
          <a href="/internal/admins">admins</a>
          <a href="/internal/metrics">metrics</a>
        </nav>
      </div>

      <div className="space-y-1">
        {rows.map((r) => (
          <div key={r.id} className="flex gap-4">
            <span className="w-44 text-zinc-500">
              {new Date(r.created_at).toLocaleString()}
            </span>
            <span className="w-40 truncate text-zinc-300">
              {r.users?.github_username ?? r.users?.email ?? 'unknown'}
            </span>
            <span className="w-48 text-yellow-300">{r.action}</span>
            <span className="truncate text-zinc-400">{r.target ?? ''}</span>
          </div>
        ))}
        {rows.length === 0 && <p className="text-zinc-600">No audit entries yet.</p>}
      </div>
    </main>
  );
}
