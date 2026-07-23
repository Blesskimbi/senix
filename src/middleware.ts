import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Senix middleware:
 *  - /internal/* is gated by Basic Auth (team-only pages).
 *  - Everything else gets a Supabase session-refresh pass: we read the
 *    auth cookies, hand them to a server-context client, call
 *    `auth.getUser()` to refresh the session, and propagate any rotated
 *    cookies onto the response. We never block on the auth result here —
 *    page-level guards (`/dashboard/layout.tsx`, `/login`, `/setup`) own
 *    the redirect logic.
 */
export async function middleware(req: NextRequest): Promise<NextResponse> {
  // /internal/* is no longer Basic-Auth gated here. It runs the normal
  // session-refresh pass (so the Supabase cookie is fresh), and per-person
  // admin authorization is enforced by src/app/internal/layout.tsx and by a
  // requireAdmin() call inside every /internal server action (migration 018).
  // The machine /api/internal/* routes keep their own CRON_SECRET/
  // INTERNAL_PASSWORD auth (src/lib/internal-auth.ts) and are unaffected.
  return refreshSupabaseSession(req);
}

/**
 * Refresh the Supabase session cookie for non-internal paths.
 * Implements the standard @supabase/ssr middleware pattern: cookies are
 * mirrored onto both the incoming request and the outgoing response so
 * downstream handlers and the browser see a consistent state.
 */
async function refreshSupabaseSession(req: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            req.cookies.set(name, value);
          }
          response = NextResponse.next({ request: req });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    /**
     * Run on every path EXCEPT static assets, image optimisation, and
     * favicon. The Basic Auth branch handles /internal/*; the
     * session-refresh branch handles everything else (landing, /login,
     * /setup, /dashboard/*, /auth/callback).
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
