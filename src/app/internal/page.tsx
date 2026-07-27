import { supabaseAdmin } from '@features/shared/supabase';
import { PageHeader, Card, Badge } from './ui';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type StructuralChange = { change: string; kind: string; id: string };

type StructuralFile = {
  filename: string;
  language: string;
  summary: { added: number; removed: number; modified: number; unchanged: number };
  changes: StructuralChange[];
};

type Analysis = {
  id: string;
  status: string;
  commit_sha: string | null;
  created_at: string;
  risk_flags: {
    file_count?: number;
    supported_file_count?: number;
    additions?: number;
    deletions?: number;
    symbol_changes?: number;
    structural_diff?: StructuralFile[];
  } | null;
};

type PullRequest = {
  id: string;
  github_pr_number: number;
  title: string;
  state: string;
  head_sha: string | null;
  updated_at: string;
  repositories: { full_name: string } | null;
};

export default async function InternalPage() {
  const [{ data: events }, { data: prs }, { data: analyses }, { count: installCount }] =
    await Promise.all([
      supabaseAdmin
        .from('webhook_events')
        .select('event_type, action, signature_valid, processed, received_at')
        .order('received_at', { ascending: false })
        .limit(20),
      supabaseAdmin
        .from('pull_requests')
        .select('id, github_pr_number, title, state, head_sha, updated_at, repository_id, repositories(full_name)')
        .order('updated_at', { ascending: false })
        .limit(10),
      supabaseAdmin
        .from('analyses')
        .select('id, status, commit_sha, risk_flags, created_at, pull_request_id')
        .order('created_at', { ascending: false })
        .limit(10),
      supabaseAdmin.from('installations').select('*', { count: 'exact', head: true }),
    ]);

  const prList = (prs ?? []) as unknown as PullRequest[];
  const analysisList = (analyses ?? []) as unknown as Analysis[];

  return (
    <>
      <PageHeader title="Status" subtitle={`${installCount ?? 0} installations`} />

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
        Last 20 webhook events
      </h2>
      <Card className="mb-8 p-0">
        <div className="divide-y divide-surface-border">
          {(events ?? []).map((e, i) => (
            <div key={i} className="flex flex-wrap items-center gap-3 px-4 py-2 text-sm text-secondary">
              <span className="w-44 text-muted">{new Date(e.received_at).toLocaleString()}</span>
              <span className="w-32 text-primary">{e.event_type}</span>
              <span className="w-28 text-secondary">{e.action ?? '—'}</span>
              <Badge tone={e.signature_valid ? 'green' : 'red'}>
                {e.signature_valid ? 'sig ok' : 'sig bad'}
              </Badge>
              <Badge tone={e.processed ? 'green' : 'yellow'}>{e.processed ? 'done' : 'pending'}</Badge>
            </div>
          ))}
        </div>
      </Card>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
        Recent pull requests
      </h2>
      <Card className="mb-8 p-0">
        <div className="divide-y divide-surface-border">
          {prList.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-2 text-sm">
              <span className="w-56 truncate text-primary">{p.repositories?.full_name}</span>
              <span className="w-12 text-secondary">#{p.github_pr_number}</span>
              <span className="w-20 text-secondary">{p.state}</span>
              <span className="w-20 text-muted">{p.head_sha?.slice(0, 7)}</span>
              <span className="truncate text-secondary">{p.title}</span>
            </div>
          ))}
        </div>
      </Card>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
        Recent analyses
      </h2>
      <div className="space-y-4">
        {analysisList.map((a) => {
          const flags = a.risk_flags ?? {};
          const structural = flags.structural_diff ?? [];
          const changedFiles = structural.filter(
            (f) => f.summary.added + f.summary.modified + f.summary.removed > 0
          );
          return (
            <Card key={a.id}>
              <div className="mb-2 flex flex-wrap items-center gap-3 text-sm">
                <span className="text-muted">{new Date(a.created_at).toLocaleString()}</span>
                <Badge tone={a.status === 'completed' ? 'green' : a.status === 'failed' ? 'red' : 'neutral'}>
                  {a.status}
                </Badge>
                <span className="text-muted">{a.commit_sha?.slice(0, 7)}</span>
              </div>
              <div className="mb-3 text-xs text-secondary">
                files={flags.file_count ?? '?'} (supported={flags.supported_file_count ?? '?'}) · +
                {flags.additions ?? 0}/-{flags.deletions ?? 0} · symbol changes={flags.symbol_changes ?? 0}
              </div>
              {changedFiles.length > 0 && (
                <div className="space-y-2">
                  {changedFiles.map((f, i) => (
                    <div key={i} className="text-xs">
                      <div className="font-semibold text-primary">
                        {f.filename} <span className="text-muted">({f.language})</span>
                      </div>
                      <div className="ml-4 mt-1 space-y-0.5">
                        {f.changes
                          .filter((c) => c.change !== 'unchanged')
                          .map((c, j) => (
                            <div key={j} className="text-secondary">
                              <span
                                className={
                                  c.change === 'added'
                                    ? 'text-risk-low'
                                    : c.change === 'removed'
                                    ? 'text-risk-high'
                                    : 'text-risk-medium'
                                }
                              >
                                {c.change.padEnd(10, ' ')}
                              </span>
                              <span className="text-muted"> {c.kind} </span>
                              <span className="text-primary">{c.id}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </>
  );
}
