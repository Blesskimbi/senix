import { notFound } from 'next/navigation';
import { getCurrentAdmin } from '@features/admin/admin-auth';
import AdminShell from './admin-shell';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Gate + shell for every /internal/* page. An admin is a signed-in user whose
 * users.id is in admin_users (migration 018).
 *
 * Every non-admin outcome — signed out OR signed in but not an admin — returns
 * a generic 404 (notFound). /internal/* is therefore indistinguishable from a
 * route that does not exist. The persistent admin sidebar is rendered ONLY
 * after this check passes, so it never leaks to non-admins.
 *
 * SECURITY: this gates PAGE RENDERING only. Server actions are independent
 * endpoints and are NOT protected here — each action calls requireAdmin()
 * itself. Do not remove those per-action checks.
 */
export default async function InternalLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    notFound();
  }
  return (
    <AdminShell role={admin.role} handle={admin.githubUsername ?? admin.email ?? 'admin'}>
      {children}
    </AdminShell>
  );
}
