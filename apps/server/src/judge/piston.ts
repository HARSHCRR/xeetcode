import type { Problem } from '@xeetcode/shared';

import { buildHarness, parseHarnessOutput } from './harness.js';
import type { JudgeVerdict } from './types.js';

/** Shape of the Piston /execute response we care about. */
interface PistonResponse {
  run?: { stdout?: string; stderr?: string; code?: number | null; signal?: string | null };
  message?: string;
}

const EXECUTION_TIMEOUT_MS = 8000;
/** Give the HTTP call more room than the sandbox, so we can tell the two apart. */
const REQUEST_TIMEOUT_MS = 20000;

/**
 * Judges a submission on a Piston instance.
 *
 * No longer the default: the public instance at emkc.org went whitelist-only in
 * February 2026. Kept because it remains the right choice against a self-hosted
 * Piston, which sandboxes far more strongly than the local runner can.
 */
export async function judgeWithPiston(
  problem: Problem,
  userCode: string,
  endpoint: string,
): Promise<JudgeVerdict> {
  const total = problem.testCases.length;
  const harness = buildHarness(problem, userCode);

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        language: 'javascript',
        version: '*',
        files: [{ name: 'solution.js', content: harness }],
        run_timeout: EXECUTION_TIMEOUT_MS,
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    return { passed: false, passedCount: 0, totalCount: total, errorKind: 'runtime_error' };
  }

  if (!response.ok) {
    console.error(`[judge] piston responded ${response.status}`);
    return { passed: false, passedCount: 0, totalCount: total, errorKind: 'runtime_error' };
  }

  const body = (await response.json()) as PistonResponse;

  // A refusal (e.g. "whitelist only") returns 200 with a message and no `run`.
  if (!body.run) {
    console.error(`[judge] piston refused the request: ${body.message ?? 'no run result'}`);
    return { passed: false, passedCount: 0, totalCount: total, errorKind: 'runtime_error' };
  }

  const run = body.run;

  if (run.signal === 'SIGKILL' || run.code === null) {
    return { passed: false, passedCount: 0, totalCount: total, errorKind: 'timeout' };
  }

  const parsed = parseHarnessOutput(run.stdout ?? '');

  if (!parsed) {
    const kind = (run.stderr ?? '').includes('SyntaxError') ? 'compile_error' : 'runtime_error';
    return { passed: false, passedCount: 0, totalCount: total, errorKind: kind };
  }

  if (parsed.error) {
    return { passed: false, passedCount: 0, totalCount: total, errorKind: 'compile_error' };
  }

  const passedCount = parsed.results.filter((result) => result.pass).length;
  const firstFailure = parsed.results.findIndex((result) => !result.pass);

  return {
    passed: passedCount === total && parsed.results.length === total,
    passedCount,
    totalCount: total,
    ...(firstFailure === -1 ? {} : { failedTestIndex: firstFailure + 1 }),
  };
}
