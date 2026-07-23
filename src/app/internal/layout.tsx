import { notFound } from 'next/navigation';
import { getCurrentAdmin } from '@features/admin/admin-auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Gate for every /internal/* page. An admin is a signed-in user whose
 * users.id is in admin_users (migration 018).
 *
 * Every non-admin outcome — signed out OR signed in but not an admin — returns
 * a generic 404 (notFound). /internal/* is therefore indistinguishable from a
 * route that does not exist: no login redirect, no "you are not an admin"
 * message, nothing that reveals an admin tier exists. Only confirmed admins
 * ever see internal UI. A logged-out admin gets the same 404 and simply signs
 * in through the normal front door first (this is the intended tradeoff).
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
  return <>{children}</>;
}
