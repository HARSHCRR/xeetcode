'use client';

import { useCountdown } from '@/lib/useCountdown';

/**
 * Submit control, isolated so the cooldown clock re-renders a button rather
 * than the whole match room — the editor next door is expensive to re-render.
 */
export function SubmitButton({
  onSubmit,
  judging,
  solved,
  finished,
  cooldownUntil,
}: {
  onSubmit: () => void;
  judging: boolean;
  /** Already passed everything — the score is locked, so stop accepting tries. */
  solved: boolean;
  finished: boolean;
  cooldownUntil?: number;
}) {
  const cooldownMs = useCountdown(cooldownUntil);
  const cooling = cooldownMs > 0;

  return (
    <button
      onClick={onSubmit}
      disabled={judging || cooling || finished || solved}
      className="rounded-md bg-win px-4 py-1.5 text-sm font-medium text-[#1a1a1a] transition-opacity hover:opacity-90 disabled:opacity-40"
    >
      {solved
        ? 'Solved'
        : judging
          ? 'Judging…'
          : cooling
            ? `Wait ${Math.ceil(cooldownMs / 1000)}s`
            : 'Submit'}
    </button>
  );
}
