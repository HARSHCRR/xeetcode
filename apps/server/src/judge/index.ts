import type { Problem } from '@xeetcode/shared';

import { env } from '../env.js';
import { judgeLocally } from './local.js';
import { judgeWithPiston } from './piston.js';
import type { JudgeVerdict } from './types.js';

export type { JudgeVerdict } from './types.js';

/**
 * Runs a submission against a problem's hidden tests.
 *
 * Defaults to the local sandboxed process. The Phase 0 design picked Piston's
 * public API, but that became whitelist-only in February 2026, so the documented
 * fallback is now the primary path. Setting `PISTON_URL` switches to a Piston
 * instance — useful if you self-host one or get whitelisted.
 *
 * Either way, execution never happens in this process and the hidden test cases
 * stay server-side.
 */
export function judgeSubmission(problem: Problem, userCode: string): Promise<JudgeVerdict> {
  return env.pistonUrl ? judgeWithPiston(problem, userCode, env.pistonUrl) : judgeLocally(problem, userCode);
}
