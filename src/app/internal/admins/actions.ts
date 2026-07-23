'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@features/shared/supabase';
import { requireAdmin, recordAdminAction, superAdminCount } from '@features/admin/admin-auth';

/**
 * Super-admin-only mutations for the admin roster. Every action re-checks
 * super_admin (a layout gate does not protect server actions) and audits the
 * result. The last super_admin can never be removed or demoted, so the system
 * can never reach zero super_admins.
 */

export async function addAdmin(formData: FormData): Promise<void> {
  const admin = await requireAdmin({ superAdmin: true });

  const identifier = String(formData.get('identifier') ?? '').trim();
  const role = String(formData.get('role') ?? 'admin');
  if (!identifier || (role !== 'admin' && role !== 'super_admin')) return;

  // Look up the existing user by github_username or email. You can only make
  // an existing user (someone who has logged in at least once) an admin.
  const { data: user } = (await supabaseAdmin
    .from('users')
    .select('id, github_username, email')
    .or(`github_username.eq.${identifier},email.eq.${identifier}`)
    .maybeSingle()) as unknown as { data: { id: string } | null };

  if (!user) {
    console.error('[internal/admins] add failed: no user matches', { identifier });
    return;
  }

  const { error } = await supabaseAdmin
    .from('admin_users')
    .insert({ user_id: user.id, role, created_by: admin.userId });
  if (error) {
    // Unique violation = already an admin; log and move on.
    console.error('[internal/admins] add failed', { identifier, message: error.message });
    return;
  }
  await recordAdminAction(admin.userId, `add_admin_${role}`, identifier);
  revalidatePath('/internal/admins');
}

export async function removeAdmin(formData: FormData): Promise<void> {
  const admin = await requireAdmin({ superAdmin: true });

  const adminRowId = String(formData.get('admin_row_id') ?? '');
  if (!adminRowId) return;

  const { data: target } = (await supabaseAdmin
    .from('admin_users')
    .select('id, role, user_id')
    .eq('id', adminRowId)
    .maybeSingle()) as unknown as { data: { id: string; role: string; user_id: string } | null };

  if (!target) return;

  // Never leave zero super_admins: block removing the last one (covers the
  // "remove yourself as the only super_admin" case too).
  if (target.role === 'super_admin' && (await superAdminCount()) <= 1) {
    console.error('[internal/admins] refused to remove the last super_admin', { adminRowId });
    return;
  }

  const { error } = await supabaseAdmin.from('admin_users').delete().eq('id', adminRowId);
  if (error) {
    console.error('[internal/admins] remove failed', { adminRowId, message: error.message });
    return;
  }
  await recordAdminAction(admin.userId, 'remove_admin', target.user_id);
  revalidatePath('/internal/admins');
}
