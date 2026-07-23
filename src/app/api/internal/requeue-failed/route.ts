import { NextRequest, NextResponse } from 'next/server';
import { requeueFailedAnalyses } from '@features/review-queue/requeue-failed';
import { verifyInternalAuth, internalUnauthorized } from '@/lib/internal-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/internal/requeue-failed
 *
 * Machine endpoint (CRON_SECRET/INTERNAL_PASSWORD) to requeue every analysis
 * that failed in the last 24 hours. The core logic lives in
 * requeueFailedAnalyses and is shared with the admin server action behind the
 * /internal test panel.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!verifyInternalAuth(req)) return internalUnauthorized();
  const body = await requeueFailedAnalyses();
  return NextResponse.json(body);
}
