'use client';

import type { SubmissionResultPayload } from '@xeetcode/shared';

import { useCountdown } from '@/lib/useCountdown';

const ERROR_COPY: Record<NonNullable<SubmissionResultPayload['errorKind']>, string> = {
  compile_error: 'Syntax error — your code did not parse.',
  runtime_error: 'Runtime error — your code threw before finishing.',
  timeout: 'Time limit exceeded — likely an infinite loop.',
};

/** Live "retry in 12s" counter during a post-failure cooldown. */
function Cooldown({ until }: { until: number }) {
  const remaining = useCountdown(until);
  if (remaining <= 0) return null;
  return <span className="text-ink-faint">Retry in {Math.ceil(remaining / 1000)}s</span>;
}

/**
 * Shows the verdict for the player's own submission.
 *
 * Never renders the failing input or expected output — only which test index
 * failed. Revealing the data would turn hidden tests into a spec you could
 * hardcode against.
 */
export function VerdictPanel({
  submission,
  judging,
}: {
  submission: SubmissionResultPayload | null;
  judging: boolean;
}) {
  if (judging) {
    return (
      <div className="shrink-0 border-t border-edge bg-surface px-4 py-3 text-sm text-ink-muted">
        Running hidden tests…
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="shrink-0 border-t border-edge bg-surface px-4 py-3 text-sm text-ink-faint">
        Submit to run the hidden tests. All must pass to win.
      </div>
    );
  }

  // A cooldown rejection carries no verdict of its own.
  const rejectedForCooldown =
    !submission.passed && submission.totalCount > 0 && submission.passedCount === 0 && !submission.errorKind && submission.failedTestIndex === undefined;

  if (submission.passed) {
    return (
      <div className="shrink-0 border-t border-edge bg-surface px-4 py-3">
        <p className="text-sm font-medium text-win">
          Accepted — {submission.passedCount}/{submission.totalCount} tests passed
        </p>
      </div>
    );
  }

  return (
    <div className="shrink-0 border-t border-edge bg-surface px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <p className="text-sm font-medium text-lose">
          {submission.errorKind
            ? ERROR_COPY[submission.errorKind]
            : rejectedForCooldown
              ? 'Slow down a moment.'
              : `Wrong answer — ${submission.passedCount}/${submission.totalCount} tests passed`}
        </p>
        {submission.cooldownUntil && <Cooldown until={submission.cooldownUntil} />}
      </div>

      {submission.failedTestIndex !== undefined && (
        <p className="mt-1 text-xs text-ink-faint">
          First failure on hidden test {submission.failedTestIndex}. The input isn&apos;t shown.
        </p>
      )}
    </div>
  );
}
