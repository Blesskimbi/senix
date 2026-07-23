'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@features/shared/supabase';
import { requireAdmin, recordAdminAction } from '@features/admin/admin-auth';

/**
 * Admin mutations for the affiliates page. Each action independently calls
 * requireAdmin() — the /internal layout gate does NOT protect server actions
 * (they are their own POST endpoints) — and records an attributed audit row.
 */

export async function createAffiliate(formData: FormData): Promise<void> {
  const admin = await requireAdmin();

  const code = String(formData.get('code') ?? '').toLowerCase().trim();
  const name = String(formData.get('name') ?? '').trim();
  const payoutContact = String(formData.get('payout_contact') ?? '').trim();

  if (!/^[a-z0-9-]{2,40}$/.test(code) || !name) return;

  const { error } = await supabaseAdmin.from('affiliates').insert({
    code,
    name,
    payout_contact: payoutContact || null,
  });
  if (error) {
    console.error('[internal/affiliates] create failed', { code, message: error.message });
    return;
  }
  await recordAdminAction(admin.userId, 'create_affiliate', code);
  revalidatePath('/internal/affiliates');
}

export async function setCommissionStatus(formData: FormData): Promise<void> {
  const admin = await requireAdmin();

  const id = String(formData.get('commission_id') ?? '');
  const next = String(formData.get('next_status') ?? '');
  if (!id || (next !== 'paid' && next !== 'unpaid')) return;

  const { error } = await supabaseAdmin
    .from('affiliate_commissions')
    .update({
      status: next,
      paid_at: next === 'paid' ? new Date().toISOString() : null,
    })
    .eq('id', id);
  if (error) {
    console.error('[internal/affiliates] status update failed', { id, message: error.message });
    return;
  }
  await recordAdminAction(admin.userId, `mark_commission_${next}`, id);
  revalidatePath('/internal/affiliates');
}
