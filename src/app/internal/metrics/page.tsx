import { supabaseAdmin } from '@features/shared/supabase';
import { PLAN_LIMITS, PLAN_ORDER } from '@features/billing/plans';
import { PageHeader, Stat } from '../ui';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Business health at a glance. Every number comes from ONE SQL round trip:
 * admin_dashboard_metrics() (migration 017) aggregates in Postgres, so this
 * page never loops over rows. Tiles with an obvious underlying list link to it
 * (users / reviews / commissions).
 *
 * MRR source: our own users table (plan x list price for active paid users).
 * "Errored" reviews = completed with risk_level NULL — its own bucket.
 */

type Metrics = {
  signups_today: number;
  signups_week: number;
  users_total: number;
  users_by_plan: Record<string, number>;
  paying_active_by_plan: Record<string, number>;
  mrr_cents: number;
  reviews_total: number;
  reviews_today: number;
  reviews_failed_total: number;
  reviews_24h: number;
  reviews_failed_24h: number;
  reviews_errored_total: number;
  credit_revenue_cents: number;
  credit_packs_sold: number;
  commissions_unpaid_cents: number;
  commissions_total_cents: number;
};

function dollars(centsValue: number): string {
  return `$${(centsValue / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

function pct(part: number, whole: number): string {
  if (whole === 0) return '0%';
  return `${((part / whole) * 100).toFixed(1)}%`;
}

export default async function InternalMetricsPage() {
  const { data, error } = (await supabaseAdmin.rpc('admin_dashboard_metrics')) as unknown as {
    data: Metrics | null;
    error: { message: string } | null;
  };

  if (error || !data) {
    return (
      <>
        <PageHeader title="Business metrics" />
        <p className="rounded-xl border border-risk-high/40 bg-risk-high/10 p-4 text-risk-high">
          Failed to load metrics: {error?.message ?? 'no data'}. Is migration 017 applied?
        </p>
      </>
    );
  }

  const m = data;
  const payingTotal = Object.values(m.paying_active_by_plan).reduce((s, n) => s + n, 0);
  const freeCount = m.users_by_plan.free ?? 0;

  return (
    <>
      <PageHeader title="Business metrics" subtitle="Live, one aggregate query. Click a tile to drill in." />

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Growth</h2>
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Signups today" value={String(m.signups_today)} href="/internal/users" />
        <Stat label="Signups (7d)" value={String(m.signups_week)} href="/internal/users" />
        <Stat label="Total users" value={String(m.users_total)} href="/internal/users" />
        <Stat
          label="Free vs paying"
          value={`${freeCount} / ${payingTotal}`}
          sub={PLAN_ORDER.filter((p) => p !== 'free')
            .map((p) => `${PLAN_LIMITS[p].label}: ${m.paying_active_by_plan[p] ?? 0}`)
            .join(' · ')}
          href="/internal/users"
        />
      </div>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Revenue</h2>
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="MRR" value={dollars(m.mrr_cents)} sub="active paid × list price" />
        <Stat
          label="Credit pack revenue"
          value={dollars(m.credit_revenue_cents)}
          sub={`${m.credit_packs_sold} packs sold`}
        />
        <Stat
          label="Commissions owed"
          value={dollars(m.commissions_unpaid_cents)}
          sub={`total ever: ${dollars(m.commissions_total_cents)}`}
          href="/internal/affiliates?filter=unpaid"
        />
      </div>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Reviews</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Reviews (all time)" value={String(m.reviews_total)} href="/internal/reviews" />
        <Stat label="Reviews today" value={String(m.reviews_today)} href="/internal/reviews?filter=today" />
        <Stat
          label="Failure rate (all time)"
          value={pct(m.reviews_failed_total, m.reviews_total)}
          sub={`${m.reviews_failed_total} failed`}
          href="/internal/reviews?filter=failed"
        />
        <Stat
          label="Failure rate (24h)"
          value={pct(m.reviews_failed_24h, m.reviews_24h)}
          sub={`${m.reviews_failed_24h} of ${m.reviews_24h}`}
          href="/internal/reviews?filter=failed"
        />
        <Stat
          label="Errored (no result)"
          value={String(m.reviews_errored_total)}
          sub="completed, no risk level"
          href="/internal/reviews?filter=errored"
        />
      </div>
    </>
  );
}
