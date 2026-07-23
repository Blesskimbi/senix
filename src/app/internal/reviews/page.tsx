import { supabaseAdmin } from '@features/shared/supabase';
import { PageHeader, Table, Badge } from '../ui';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const PAGE_SIZE = 50;

type ReviewRow = {
  id: string;
  status: string | null;
  risk_level: string | null;
  tokens_used: number | null;
  error_message: string | null;
  created_at: string;
  pull_requests: {
    github_pr_number: number | null;
    repositories: { full_name: string | null } | null;
  } | null;
};

type Filter = 'all' | 'today' | 'failed' | 'errored';

/**
 * Read-only admin-wide reviews list (all users), the drill-down target for the
 * metrics review tiles. Reuses the analyses -> pull_requests -> repositories
 * join style from billing-usage.ts, just not user-scoped. Filters mirror the
 * metric tiles: today, failed, errored (completed with NULL risk_level).
 */
export default async function InternalReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; filter?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? '1') || 1);
  const filter: Filter = (['today', 'failed', 'errored'] as const).includes(sp.filter as never)
    ? (sp.filter as Filter)
    : 'all';
  const from = (page - 1) * PAGE_SIZE;

  let query = supabaseAdmin
    .from('analyses')
    .select(
      'id, status, risk_level, tokens_used, error_message, created_at, pull_requests(github_pr_number, repositories(full_name))',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  if (filter === 'today') {
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    query = query.gte('created_at', start.toISOString());
  } else if (filter === 'failed') {
    query = query.eq('status', 'failed');
  } else if (filter === 'errored') {
    query = query.eq('status', 'completed').is('risk_level', null);
  }

  const { data, count } = (await query) as unknown as {
    data: ReviewRow[] | null;
    count: number | null;
  };
  const rows = data ?? [];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const tab = (key: Filter, label: string) => (
    <a
      href={`/internal/reviews${key === 'all' ? '' : `?filter=${key}`}`}
      className={`rounded-lg border px-3 py-1 text-xs ${filter === key ? 'border-accent text-accent' : 'border-surface-border text-secondary hover:text-primary'}`}
    >
      {label}
    </a>
  );

  return (
    <>
      <PageHeader title="Reviews" subtitle={`${total} match${total === 1 ? '' : 'es'}`} />

      <div className="mb-4 flex flex-wrap gap-2">
        {tab('all', 'all')}
        {tab('today', 'today')}
        {tab('failed', 'failed')}
        {tab('errored', 'errored')}
      </div>

      <Table
        head={
          <tr>
            <th className="px-4 py-2">Repo / PR</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2">Risk</th>
            <th className="px-4 py-2">Tokens</th>
            <th className="px-4 py-2">When</th>
          </tr>
        }
      >
        {rows.map((r) => {
          const errored = r.status === 'completed' && !r.risk_level;
          return (
            <tr key={r.id} className="align-top text-secondary">
              <td className="px-4 py-2">
                <div className="text-primary">
                  {r.pull_requests?.repositories?.full_name ?? 'unknown'}
                  {r.pull_requests?.github_pr_number ? ` #${r.pull_requests.github_pr_number}` : ''}
                </div>
                {r.error_message && (
                  <div className="mt-0.5 max-w-md truncate text-xs text-muted">{r.error_message}</div>
                )}
              </td>
              <td className="px-4 py-2">
                {r.status === 'failed' || errored ? (
                  <Badge tone="red">{errored ? 'errored' : 'failed'}</Badge>
                ) : (
                  <Badge tone={r.status === 'completed' ? 'green' : 'neutral'}>{r.status ?? '—'}</Badge>
                )}
              </td>
              <td className="px-4 py-2">
                {r.risk_level ? (
                  <Badge
                    tone={r.risk_level === 'high' ? 'red' : r.risk_level === 'medium' ? 'yellow' : 'green'}
                  >
                    {r.risk_level}
                  </Badge>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </td>
              <td className="px-4 py-2">{r.tokens_used ? r.tokens_used.toLocaleString() : '—'}</td>
              <td className="px-4 py-2 text-muted">{new Date(r.created_at).toLocaleString()}</td>
            </tr>
          );
        })}
        {rows.length === 0 && (
          <tr>
            <td colSpan={5} className="px-4 py-6 text-center text-muted">
              No reviews match.
            </td>
          </tr>
        )}
      </Table>

      <div className="mt-4 flex items-center justify-between text-sm text-secondary">
        <span>
          Page {page} of {totalPages}
        </span>
        <div className="flex gap-2">
          {page > 1 && (
            <a
              href={`/internal/reviews?${filter !== 'all' ? `filter=${filter}&` : ''}page=${page - 1}`}
              className="rounded-lg border border-surface-border px-3 py-1 hover:text-primary"
            >
              ← Prev
            </a>
          )}
          {page < totalPages && (
            <a
              href={`/internal/reviews?${filter !== 'all' ? `filter=${filter}&` : ''}page=${page + 1}`}
              className="rounded-lg border border-surface-border px-3 py-1 hover:text-primary"
            >
              Next →
            </a>
          )}
        </div>
      </div>
    </>
  );
}
