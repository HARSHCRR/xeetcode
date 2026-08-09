'use client';

import { useEffect, useState } from 'react';

/**
 * Milliseconds remaining until `until`, re-rendering as the clock runs down.
 * Returns 0 when there's no deadline.
 *
 * What ticks is "now", not "remaining", so the only setState lives in the
 * interval callback — where React expects external-clock updates. Reading
 * `Date.now()` during render instead would be impure and wouldn't re-render,
 * leaving a cooldown-disabled button stuck until something else nudged it.
 *
 * The interval runs regardless of whether a deadline is set. Starting it only
 * on demand left `now` stale from mount, so the first frame of a new countdown
 * briefly showed a wildly wrong number. Callers keep this cheap by scoping it
 * to small components rather than whole pages.
 */
export function useCountdown(until: number | undefined, intervalMs = 250): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return until ? Math.max(0, until - now) : 0;
}
