import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@features/admin/admin-auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Gate for every /internal/* page. An admin is a signed-in user whose
 * users.id is in admin_users (migration 018). Signed-out visitors go to
 * /login; signed-in non-admins get a terminal 403 (not a redirect, to avoid
 * a login loop). This replaces the shared Basic Auth gate that used to live
 * in middleware.
 *
 * SECURITY: this layout gates PAGE RENDERING only. Server actions are
 * independent endpoints and are NOT protected by this — each action calls
 * requireAdmin() itself. Do not remove those per-action checks on the
 * assumption this layout covers them.
 */
export default async function InternalLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> {
  const admin = await getCurrentAdmin();

  if (!admin) {
    // Distinguish signed-out (send to login) from signed-in-but-not-admin
    // (terminal 403). getCurrentAdmin returns null for both, so re-check the
    // session cheaply to pick the right response.
    const { createServerSupabaseClient } = await import('@features/shared/supabase-server');
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      redirect('/login?next=/internal');
    }
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 p-8 font-mono text-sm text-zinc-100">
        <div className="max-w-md text-center">
          <h1 className="mb-2 text-2xl font-bold text-red-400">403 — Not an admin</h1>
          <p className="text-zinc-400">
            You are signed in, but this account is not an admin. Ask a super_admin to add
            you, then reload.
          </p>
          <a href="/dashboard" className="mt-4 inline-block text-blue-300 underline">
            Back to dashboard
          </a>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
