'use client';

import { useEffect, useState } from 'react';

/**
 * Counts down to the server-supplied `endsAt`.
 *
 * Purely presentational — the server owns the real clock and is what actually
 * ends the match, so a tampered or drifting client can't buy itself extra time.
 */
export function MatchTimer({ endsAt }: { endsAt: number }) {
  const [remaining, setRemaining] = useState(() => Math.max(0, endsAt - Date.now()));

  useEffect(() => {
    const tick = () => setRemaining(Math.max(0, endsAt - Date.now()));
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [endsAt]);

  const totalSeconds = Math.floor(remaining / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, '0');

  const urgent = remaining <= 60_000;

  return (
    <span
      className={`font-mono text-sm tabular-nums ${urgent ? 'text-lose' : 'text-ink'}`}
      aria-label="Time remaining"
    >
      {minutes}:{seconds}
    </span>
  );
}
