import type { Language, Problem, TestCase } from '@xeetcode/shared';

import { runCpp } from './cpp/run.js';
import { judgeLocally } from './local.js';
import type { JudgeVerdict } from './types.js';

export type { JudgeVerdict } from './types.js';

/**
 * Runs a submission against a set of cases.
 *
 * "Run" passes the visible sample cases and asks for the produced value, so a
 * player can debug. "Submit" passes the hidden set and reveals nothing beyond
 * which case failed — otherwise the hidden tests would be a spec to hardcode
 * against.
 *
 * Execution never happens in this process, and the hidden cases stay
 * server-side either way.
 */
export async function judgeSubmission(
  problem: Problem,
  userCode: string,
  language: Language,
  cases: TestCase[],
  revealActual: boolean,
): Promise<JudgeVerdict> {
  const total = cases.length;

  if (language === 'cpp') {
    const outcome = await runCpp(problem, userCode, cases, revealActual);

    if (outcome.failure) {
      return {
        passed: false,
        passedCount: 0,
        totalCount: total,
        errorKind: outcome.failure,
        ...(outcome.compileMessage ? { errorDetail: outcome.compileMessage } : {}),
        cases: [],
      };
    }

    const results = outcome.verdict?.results ?? [];
    const passedCount = results.filter((r) => r.pass).length;
    const firstFailure = results.findIndex((r) => !r.pass);

    return {
      passed: passedCount === total && results.length === total,
      passedCount,
      totalCount: total,
      ...(firstFailure === -1 ? {} : { failedTestIndex: firstFailure + 1 }),
      cases: revealActual ? results : [],
    };
  }

  return judgeLocally(problem, userCode, cases, revealActual);
}
