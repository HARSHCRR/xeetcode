'use client';

import type { RunResultPayload, TestCase } from '@xeetcode/shared';

/**
 * Results of a "Run" against the visible sample cases.
 *
 * Unlike Submit, this shows the produced value next to the expected one — the
 * samples are public, so there is nothing to protect and everything to gain in
 * making a failure debuggable.
 */
export function SampleResults({
  samples,
  result,
  running,
}: {
  samples: TestCase[];
  result: RunResultPayload | null;
  running: boolean;
}) {
  if (running) {
    return (
      <div className="shrink-0 border-t border-edge bg-surface px-4 py-3 text-sm text-ink-muted">
        Running the example cases…
      </div>
    );
  }

  if (!result) {
    return (
      <div className="shrink-0 border-t border-edge bg-surface px-4 py-3 text-sm text-ink-faint">
        Run checks the {samples.length} examples. Submit runs the full hidden set.
      </div>
    );
  }

  if (result.errorKind) {
    return (
      <div className="max-h-48 shrink-0 overflow-y-auto border-t border-edge bg-surface px-4 py-3">
        <p className="text-sm font-medium text-lose">
          {result.errorKind === 'compile_error'
            ? 'Compile error'
            : result.errorKind === 'timeout'
              ? 'Time limit exceeded'
              : 'Runtime error'}
        </p>
        {result.errorDetail && (
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap font-mono text-xs text-ink-muted">
            {result.errorDetail}
          </pre>
        )}
      </div>
    );
  }

  const allPassed = result.passedCount === result.totalCount;

  return (
    <div className="max-h-56 shrink-0 overflow-y-auto border-t border-edge bg-surface px-4 py-3">
      <p className={`text-sm font-medium ${allPassed ? 'text-win' : 'text-lose'}`}>
        {allPassed ? 'All examples passed' : 'Example failed'} — {result.passedCount}/
        {result.totalCount}
      </p>

      <div className="mt-2 space-y-2">
        {result.cases.map((outcome, index) => (
          <div key={index} className="rounded-md border border-edge bg-surface-raised p-2 text-xs">
            <span className={outcome.pass ? 'text-win' : 'text-lose'}>
              Case {index + 1} {outcome.pass ? 'passed' : 'failed'}
            </span>

            {!outcome.pass && (
              <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 font-mono text-ink-muted">
                <dt className="text-ink-faint">input</dt>
                <dd className="overflow-x-auto">
                  {JSON.stringify(samples[index]?.input ?? []).slice(1, -1)}
                </dd>
                <dt className="text-ink-faint">got</dt>
                <dd className="overflow-x-auto text-lose">{outcome.actual ?? '—'}</dd>
                <dt className="text-ink-faint">want</dt>
                <dd className="overflow-x-auto">
                  {outcome.expected ?? JSON.stringify(samples[index]?.expected)}
                </dd>
              </dl>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
