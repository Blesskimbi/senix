import { supabaseAdmin } from '@features/shared/supabase';
import { createAffiliate, setCommissionStatus } from './actions';
import { PageHeader, Card, Table, Badge, Button } from '../ui';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type AffiliateRow = {
  id: string;
  code: string;
  name: string;
  payout_contact: string | null;
  created_at: string;
};

type CommissionRow = {
  id: string;
  payment_amount_cents: number;
  commission_cents: number;
  currency: string;
  status: 'unpaid' | 'paid';
  created_at: string;
  paid_at: string | null;
  affiliates: { code: string; name: string } | null;
  users: { github_username: string | null; email: string | null } | null;
};

function cents(v: number): string {
  return `$${(v / 100).toFixed(2)}`;
}

/**
 * Affiliate admin: create referrers and track commission payouts. Commission
 * rows are written exclusively by the Whop payment webhook; this page reads
 * them and flips paid/unpaid. Supports ?filter=unpaid (linked from the
 * "Commissions owed" metric tile).
 */
export default async function InternalAffiliatesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const sp = await searchParams;
  const unpaidOnly = sp.filter === 'unpaid';

  const [{ data: affiliates }, { data: commissions }] = await Promise.all([
    supabaseAdmin
      .from('affiliates')
      .select('id, code, name, payout_contact, created_at')
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('affiliate_commissions')
      .select(
        'id, payment_amount_cents, commission_cents, currency, status, created_at, paid_at, affiliates(code, name), users(github_username, email)'
      )
      .order('created_at', { ascending: false })
      .limit(500),
  ]);

  const affiliateList = (affiliates ?? []) as unknown as AffiliateRow[];
  let commissionList = (commissions ?? []) as unknown as CommissionRow[];
  const unpaidTotal = commissionList
    .filter((c) => c.status === 'unpaid')
    .reduce((s, c) => s + c.commission_cents, 0);
  if (unpaidOnly) commissionList = commissionList.filter((c) => c.status === 'unpaid');

  return (
    <>
      <PageHeader
        title="Affiliates"
        subtitle={`Unpaid commissions owed: ${cents(unpaidTotal)}`}
      />

      <Card className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-primary">New affiliate</h2>
        <form action={createAffiliate} className="flex flex-wrap items-end gap-3">
          <Field name="code" label="code (senix.dev/yt/…)" placeholder="mkbhd" required pattern="[a-z0-9-]{2,40}" />
          <Field name="name" label="name" placeholder="Marques" required />
          <Field name="payout_contact" label="payout contact" placeholder="paypal@example.com" />
          <Button type="submit" variant="primary">
            Create
          </Button>
        </form>
      </Card>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
        Affiliates ({affiliateList.length})
      </h2>
      <div className="mb-8">
        <Table
          head={
            <tr>
              <th className="px-4 py-2">Link</th>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Payout contact</th>
              <th className="px-4 py-2">Created</th>
            </tr>
          }
        >
          {affiliateList.map((a) => (
            <tr key={a.id} className="text-secondary">
              <td className="px-4 py-2 text-accent">/yt/{a.code}</td>
              <td className="px-4 py-2 text-primary">{a.name}</td>
              <td className="px-4 py-2">{a.payout_contact ?? '—'}</td>
              <td className="px-4 py-2 text-muted">{new Date(a.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
          {affiliateList.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-muted">
                None yet.
              </td>
            </tr>
          )}
        </Table>
      </div>

      <div className="mb-3 flex items-center gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Commission ledger ({commissionList.length})
        </h2>
        <a
          href={unpaidOnly ? '/internal/affiliates' : '/internal/affiliates?filter=unpaid'}
          className="rounded-lg border border-surface-border px-2 py-0.5 text-xs text-secondary hover:text-primary"
        >
          {unpaidOnly ? 'show all' : 'unpaid only'}
        </a>
      </div>
      <Table
        head={
          <tr>
            <th className="px-4 py-2">Affiliate</th>
            <th className="px-4 py-2">Referred user</th>
            <th className="px-4 py-2">Payment</th>
            <th className="px-4 py-2">Commission</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2" />
          </tr>
        }
      >
        {commissionList.map((c) => (
          <tr key={c.id} className="text-secondary">
            <td className="px-4 py-2 text-accent">{c.affiliates?.code ?? '?'}</td>
            <td className="px-4 py-2 text-primary">
              {c.users?.github_username ?? c.users?.email ?? 'unknown'}
            </td>
            <td className="px-4 py-2">{cents(c.payment_amount_cents)}</td>
            <td className="px-4 py-2 font-semibold text-primary">{cents(c.commission_cents)}</td>
            <td className="px-4 py-2">
              <Badge tone={c.status === 'paid' ? 'green' : 'yellow'}>{c.status}</Badge>
            </td>
            <td className="px-4 py-2">
              <form action={setCommissionStatus}>
                <input type="hidden" name="commission_id" value={c.id} />
                <input type="hidden" name="next_status" value={c.status === 'paid' ? 'unpaid' : 'paid'} />
                <Button type="submit" variant={c.status === 'paid' ? 'secondary' : 'primary'}>
                  mark {c.status === 'paid' ? 'unpaid' : 'paid'}
                </Button>
              </form>
            </td>
          </tr>
        ))}
        {commissionList.length === 0 && (
          <tr>
            <td colSpan={6} className="px-4 py-6 text-center text-muted">
              No commissions{unpaidOnly ? ' unpaid' : ''}.
            </td>
          </tr>
        )}
      </Table>
    </>
  );
}

function Field({
  name,
  label,
  placeholder,
  required,
  pattern,
}: {
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  pattern?: string;
}): React.ReactElement {
  return (
    <label className="flex flex-col gap-1 text-xs text-secondary">
      {label}
      <input
        name={name}
        required={required}
        pattern={pattern}
        placeholder={placeholder}
        className="rounded-lg border border-surface-border bg-surface-raised px-2 py-1.5 text-sm text-primary outline-none focus:border-accent"
      />
    </label>
  );
}
