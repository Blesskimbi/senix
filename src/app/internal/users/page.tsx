import { supabaseAdmin } from '@features/shared/supabase';
import { PLAN_ORDER } from '@features/billing/plans';
import { PageHeader, Table, Badge } from '../ui';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const PAGE_SIZE = 50;

type UserRow = {
  id: string;
  github_username: string | null;
  email: string | null;
  plan: string;
  plan_status: string | null;
  tokens_used_this_month: number | null;
  created_at: string;
};

function planTone(plan: string): 'neutral' | 'green' | 'purple' {
  if (plan === 'free') return 'neutral';
  if (plan === 'pro' || plan === 'team') return 'purple';
  return 'green';
}

/**
 * Read-only admin user list. Drill-down target for the metrics user tiles.
 * Paginated (?page=) and optionally filtered by plan (?plan=). One select on
 * users with an exact count for pagination — no N+1.
 */
export default async function InternalUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; plan?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? '1') || 1);
  const planFilter = PLAN_ORDER.includes(sp.plan as never) ? sp.plan : undefined;
  const from = (page - 1) * PAGE_SIZE;

  let query = supabaseAdmin
    .from('users')
    .select('id, github_username, email, plan, plan_status, tokens_used_this_month, created_at', {
      count: 'exact',
    })
    .order('created_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1);
  if (planFilter) query = query.eq('plan', planFilter);

  const { data, count } = (await query) as unknown as { data: UserRow[] | null; count: number | null };
  const users = data ?? [];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const filterHref = (plan?: string) =>
    `/internal/users${plan ? `?plan=${plan}` : ''}`;

  return (
    <>
      <PageHeader title="Users" subtitle={`${total} total${planFilter ? ` · plan: ${planFilter}` : ''}`} />

      <div className="mb-4 flex flex-wrap gap-2">
        <a
          href={filterHref()}
          className={`rounded-lg border px-3 py-1 text-xs ${!planFilter ? 'border-accent text-accent' : 'border-surface-border text-secondary hover:text-primary'}`}
        >
          all
        </a>
        {PLAN_ORDER.map((p) => (
          <a
            key={p}
            href={filterHref(p)}
            className={`rounded-lg border px-3 py-1 text-xs ${planFilter === p ? 'border-accent text-accent' : 'border-surface-border text-secondary hover:text-primary'}`}
          >
            {p}
          </a>
        ))}
      </div>

      <Table
        head={
          <tr>
            <th className="px-4 py-2">User</th>
            <th className="px-4 py-2">Plan</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2">Tokens (mo)</th>
            <th className="px-4 py-2">Joined</th>
          </tr>
        }
      >
        {users.map((u) => (
          <tr key={u.id} className="text-secondary">
            <td className="px-4 py-2">
              <div className="text-primary">{u.github_username ?? '—'}</div>
              <div className="text-xs text-muted">{u.email ?? ''}</div>
            </td>
            <td className="px-4 py-2">
              <Badge tone={planTone(u.plan)}>{u.plan}</Badge>
            </td>
            <td className="px-4 py-2">{u.plan_status ?? '—'}</td>
            <td className="px-4 py-2">{(u.tokens_used_this_month ?? 0).toLocaleString()}</td>
            <td className="px-4 py-2 text-muted">{new Date(u.created_at).toLocaleDateString()}</td>
          </tr>
        ))}
        {users.length === 0 && (
          <tr>
            <td colSpan={5} className="px-4 py-6 text-center text-muted">
              No users.
            </td>
          </tr>
        )}
      </Table>

      <Pagination page={page} totalPages={totalPages} base={filterHref(planFilter)} />
    </>
  );
}

function Pagination({
  page,
  totalPages,
  base,
}: {
  page: number;
  totalPages: number;
  base: string;
}): React.ReactElement {
  const sep = base.includes('?') ? '&' : '?';
  return (
    <div className="mt-4 flex items-center justify-between text-sm text-secondary">
      <span>
        Page {page} of {totalPages}
      </span>
      <div className="flex gap-2">
        {page > 1 && (
          <a
            href={`${base}${sep}page=${page - 1}`}
            className="rounded-lg border border-surface-border px-3 py-1 hover:text-primary"
          >
            ← Prev
          </a>
        )}
        {page < totalPages && (
          <a
            href={`${base}${sep}page=${page + 1}`}
            className="rounded-lg border border-surface-border px-3 py-1 hover:text-primary"
          >
            Next →
          </a>
        )}
      </div>
    </div>
  );
}
