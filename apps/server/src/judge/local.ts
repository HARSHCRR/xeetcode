import { execFile } from 'node:child_process';

import type { Problem, TestCase } from '@xeetcode/shared';

import { buildHarness, parseHarnessOutput } from './harness.js';
import type { JudgeVerdict } from './types.js';

const EXECUTION_TIMEOUT_MS = 8000;
const MAX_OUTPUT_BYTES = 256 * 1024;
const MEMORY_LIMIT_MB = 128;

/**
 * Runs a submission in a locked-down child process.
 *
 * Player code is untrusted, so this is defence in depth rather than one trick:
 *
 * - a **separate process**, so a crash or OOM can't take the server with it
 * - **`--permission`**, Node's permission model, which denies filesystem access,
 *   `child_process`, `worker_threads`, and native addons
 * - **an empty environment**, so even a full escape sees no `DATABASE_URL`
 * - **a hard timeout with SIGKILL**, so infinite loops die
 * - **a heap cap**, so a runaway allocation can't exhaust the box
 *
 * Known gap: Node's permission model does not gate outbound network access, so
 * an escape could still make requests. With no credentials in the environment
 * and no filesystem access that's low value, but it is the reason this is not
 * a substitute for a container-level sandbox at real scale.
 *
 * The code goes in via `-e` rather than a temp file because `--permission`
 * blocks the module loader's own filesystem probing.
 */
export function judgeLocally(
  problem: Problem,
  userCode: string,
  cases: TestCase[] = problem.testCases,
  revealActual = false,
): Promise<JudgeVerdict> {
  const total = cases.length;
  const harness = buildHarness(problem, userCode, cases, revealActual);

  return new Promise((resolve) => {
    execFile(
      process.execPath,
      ['--permission', `--max-old-space-size=${MEMORY_LIMIT_MB}`, '-e', harness],
      {
        timeout: EXECUTION_TIMEOUT_MS,
        killSignal: 'SIGKILL',
        maxBuffer: MAX_OUTPUT_BYTES,
        env: {},
        cwd: undefined,
      },
      (error, stdout, stderr) => {
        // `killed` means the timeout fired — almost always an infinite loop.
        if (error && 'killed' in error && error.killed) {
          resolve({ passed: false, passedCount: 0, totalCount: total, errorKind: 'timeout', cases: [] });
          return;
        }

        const parsed = parseHarnessOutput(stdout);

        if (!parsed) {
          // No verdict line: the code threw before the runner could report.
          // stderr may echo the player's own data, so it is never forwarded.
          const kind = stderr.includes('SyntaxError') ? 'compile_error' : 'runtime_error';
          resolve({ passed: false, passedCount: 0, totalCount: total, errorKind: kind, cases: [] });
          return;
        }

        if (parsed.error) {
          resolve({ passed: false, passedCount: 0, totalCount: total, errorKind: 'compile_error', cases: [] });
          return;
        }

        const passedCount = parsed.results.filter((result) => result.pass).length;
        const firstFailure = parsed.results.findIndex((result) => !result.pass);

        resolve({
          passed: passedCount === total && parsed.results.length === total,
          passedCount,
          totalCount: total,
          ...(firstFailure === -1 ? {} : { failedTestIndex: firstFailure + 1 }),
          cases: revealActual ? parsed.results : [],
        });
      },
    );
  });
}
