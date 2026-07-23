import { supabaseAdmin } from '@features/shared/supabase';
import { PageHeader, Table, Badge } from '../ui';

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
 * the admin who performed it.
 */
export default async function InternalAuditPage() {
  const { data } = await supabaseAdmin
    .from('admin_audit_log')
    .select('id, action, target, created_at, users:admin_user_id(github_username, email)')
    .order('created_at', { ascending: false })
    .limit(500);
  const rows = (data ?? []) as unknown as AuditRow[];

  return (
    <>
      <PageHeader title="Audit log" subtitle={`${rows.length} most recent actions`} />
      <Table
        head={
          <tr>
            <th className="px-4 py-2">When</th>
            <th className="px-4 py-2">Admin</th>
            <th className="px-4 py-2">Action</th>
            <th className="px-4 py-2">Target</th>
          </tr>
        }
      >
        {rows.map((r) => (
          <tr key={r.id} className="text-secondary">
            <td className="px-4 py-2 text-muted">{new Date(r.created_at).toLocaleString()}</td>
            <td className="px-4 py-2 text-primary">
              {r.users?.github_username ?? r.users?.email ?? 'unknown'}
            </td>
            <td className="px-4 py-2">
              <Badge tone="purple">{r.action}</Badge>
            </td>
            <td className="px-4 py-2">{r.target ?? ''}</td>
          </tr>
        ))}
        {rows.length === 0 && (
          <tr>
            <td colSpan={4} className="px-4 py-6 text-center text-muted">
              No audit entries yet.
            </td>
          </tr>
        )}
      </Table>
    </>
  );
}
