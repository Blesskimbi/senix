'use client';

import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { requeueFailedAction, type RequeueActionState } from './actions';

const INITIAL: RequeueActionState = { message: null, error: null };

/**
 * Requeue-failed control, now backed by an admin-gated server action
 * (requeueFailedAction) instead of a fetch to the machine route — the browser
 * no longer sends Basic Auth, so the old fetch would 401. The action enforces
 * admin and records an audit row.
 */
export default function RequeueButton(): React.ReactElement {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(requeueFailedAction, INITIAL);

  // Refresh the server-rendered analyses list once a requeue succeeds.
  useEffect(() => {
    if (state.message) router.refresh();
  }, [state.message, router]);

  return (
    <form action={formAction}>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-black transition-colors duration-150 hover:bg-accent-hover disabled:opacity-50"
      >
        {pending ? 'Requeueing…' : 'Requeue all failed in last 24h'}
      </button>
      {state.message && <div className="mt-2 text-sm text-risk-low">{state.message}</div>}
      {state.error && <div className="mt-2 text-sm text-risk-high">{state.error}</div>}
    </form>
  );
}
