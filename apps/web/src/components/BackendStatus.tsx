'use client';

import { useEffect, useState } from 'react';

import { BACKEND_URL } from '@/lib/config';

type Status = 'checking' | 'online' | 'offline';

const STATUS_LABEL: Record<Status, string> = {
  checking: 'Contacting backend…',
  online: 'Backend online',
  offline: 'Backend unreachable',
};

const STATUS_STYLE: Record<Status, string> = {
  checking: 'bg-surface-raised text-ink-muted',
  online: 'bg-surface-raised text-win',
  offline: 'bg-surface-raised text-lose',
};

/**
 * Phase 1 pipeline proof: confirms the deployed frontend can actually reach the
 * separately-deployed realtime backend. Replaced by real lobby UI in Phase 2.
 */
export function BackendStatus() {
  const [status, setStatus] = useState<Status>('checking');

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${BACKEND_URL}/health`, { signal: controller.signal })
      .then((res) => (res.ok ? setStatus('online') : setStatus('offline')))
      .catch(() => {
        // An aborted request is a component unmount, not a real failure.
        if (!controller.signal.aborted) setStatus('offline');
      });

    return () => controller.abort();
  }, []);

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border border-edge px-4 py-2 text-sm ${STATUS_STYLE[status]}`}
    >
      <span
        aria-hidden
        className={`size-2 rounded-full ${
          status === 'online' ? 'bg-win' : status === 'offline' ? 'bg-lose' : 'bg-ink-faint'
        }`}
      />
      {STATUS_LABEL[status]}
    </div>
  );
}
