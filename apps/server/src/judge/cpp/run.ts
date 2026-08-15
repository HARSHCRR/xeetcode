import { execFile } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { Problem, TestCase } from '@xeetcode/shared';

import { parseVerdict, type RawVerdict } from '../verdict.js';
import { buildCppHarness } from './harness.js';

const COMPILE_TIMEOUT_MS = 12000;
const RUN_TIMEOUT_MS = 8000;
/** CPU seconds; a tighter bound than the wall clock, and enforced by the OS. */
const CPU_SECONDS = 6;
const ADDRESS_SPACE_KB = 512 * 1024;
const MAX_OUTPUT_BYTES = 256 * 1024;

function run(
  command: string,
  args: string[],
  options: { timeout: number; cwd?: string },
): Promise<{
  code: number | null;
  stdout: string;
  stderr: string;
  killed: boolean;
  signal: string | null;
}> {
  return new Promise((resolve) => {
    execFile(
      command,
      args,
      {
        timeout: options.timeout,
        killSignal: 'SIGKILL',
        maxBuffer: MAX_OUTPUT_BYTES,
        env: {},
        ...(options.cwd ? { cwd: options.cwd } : {}),
      },
      (error, stdout, stderr) => {
        const killed = Boolean(error && 'killed' in error && error.killed);
        const signal =
          error && 'signal' in error && typeof error.signal === 'string' ? error.signal : null;
        const code =
          error && 'code' in error && typeof error.code === 'number' ? error.code : error ? 1 : 0;
        resolve({ code, stdout, stderr, killed, signal });
      },
    );
  });
}

export interface CppOutcome {
  verdict?: RawVerdict;
  /** Set when the program never produced a verdict. */
  failure?: 'compile_error' | 'runtime_error' | 'timeout';
  /** Compiler diagnostics — safe to show, it is the player's own code. */
  compileMessage?: string;
}

/**
 * Compiles and runs a C++ submission.
 *
 * Untrusted native code is genuinely harder to contain than JavaScript: Node's
 * permission model only governs its own runtime, so a compiled binary can issue
 * syscalls directly. What we do have:
 *
 * - a **separate process** with an **empty environment**, so no credentials leak
 * - **OS resource limits** via `ulimit`: CPU seconds, address space, file size,
 *   and process count, which stop fork bombs and runaway allocation
 * - a **wall-clock timeout** with SIGKILL on top of the CPU limit
 * - a **scratch directory** deleted afterwards
 *
 * This is deliberately weaker than the JavaScript sandbox and is documented as
 * such: it suits a private game between friends, not an open public endpoint.
 */
export async function runCpp(
  problem: Problem,
  userCode: string,
  cases: TestCase[],
  revealActual: boolean,
): Promise<CppOutcome> {
  const dir = await mkdtemp(join(tmpdir(), 'xeetcode-cpp-'));
  const sourcePath = join(dir, 'main.cpp');
  const binaryPath = join(dir, 'main');

  try {
    await writeFile(sourcePath, buildCppHarness(problem, userCode, cases, revealActual), 'utf8');

    const compiled = await run(
      'g++',
      ['-O2', '-std=c++17', '-w', '-o', binaryPath, sourcePath],
      { timeout: COMPILE_TIMEOUT_MS },
    );

    if (compiled.code !== 0) {
      return {
        failure: 'compile_error',
        // Strip the temp path so the player sees their own line numbers, not ours.
        compileMessage: compiled.stderr.split(sourcePath).join('solution.cpp').slice(0, 4000),
      };
    }

    // `ulimit` lives in the shell, so the binary is launched through one.
    const limits = `ulimit -t ${CPU_SECONDS}; ulimit -f 4096; ulimit -u 64;`;
    // Address-space limits are respected on Linux (production); macOS largely
    // ignores them, which is fine because the wall clock still applies.
    const addressSpace = process.platform === 'linux' ? ` ulimit -v ${ADDRESS_SPACE_KB};` : '';

    const executed = await run(
      '/bin/sh',
      ['-c', `${limits}${addressSpace} exec "${binaryPath}"`],
      { timeout: RUN_TIMEOUT_MS, cwd: dir },
    );

    // SIGXCPU is the `ulimit -t` bound; SIGKILL is our wall clock. Either way
    // the submission spent longer than a correct solution would.
    const timedOut =
      executed.killed || executed.signal === 'SIGXCPU' || executed.signal === 'SIGKILL';
    if (timedOut) return { failure: 'timeout' };

    const verdict = parseVerdict(executed.stdout);
    if (!verdict) return { failure: 'runtime_error' };

    return { verdict };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
