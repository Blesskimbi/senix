'use server';

import { requireAdmin, recordAdminAction } from '@features/admin/admin-auth';
import { requeueFailedAnalyses } from '@features/review-queue/requeue-failed';

export type RequeueActionState = { message: string | null; error: string | null };

/**
 * Admin-gated requeue of failed analyses. Replaces the old fetch to the
 * machine route (which relied on browser Basic Auth that no longer exists);
 * enforces admin, records an audit row, and runs the shared requeue logic.
 */
export async function requeueFailedAction(
  _prev: RequeueActionState,
  _formData: FormData
): Promise<RequeueActionState> {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return { message: null, error: 'Not authorized.' };
  }

  try {
    const { requeued, skipped } = await requeueFailedAnalyses();
    await recordAdminAction(admin.userId, 'requeue_failed', `requeued=${requeued} skipped=${skipped}`);
    return { message: `Requeued ${requeued} jobs (skipped ${skipped})`, error: null };
  } catch (e) {
    return { message: null, error: e instanceof Error ? e.message : String(e) };
  }
}
