import { randomUUID } from 'node:crypto';

import type { Problem, ProblemTopic, TopicSelection } from '@xeetcode/shared';

import { getPool } from '../db/client.js';
import { PROBLEM_BANK } from './bank.js';
import { cppFunctionName, startersFor, type SeedProblem } from './types.js';

/**
 * All problems, held in memory for the process lifetime.
 *
 * The bank is small and static, so loading it once at startup avoids a database
 * round trip on every match creation — matchmaking stays synchronous, which
 * keeps the pairing logic simple and easy to test.
 */
let problems: Problem[] = [];

interface ProblemRow {
  id: string;
  slug: string;
  title: string;
  topic: ProblemTopic;
  difficulty: Problem['difficulty'];
  description: string;
  function_signature: string;
  starter_code: string;
  test_cases: Problem['testCases'];
}

function fromRow(row: ProblemRow): Problem {
  return toRuntimeProblem(
    {
      slug: row.slug,
      title: row.title,
      topic: row.topic,
      difficulty: row.difficulty,
      description: row.description,
      functionSignature: row.function_signature,
      starterCode: row.starter_code,
      testCases: row.test_cases,
    },
    row.id,
  );
}

/** Turns an authored problem into the runtime shape the judge and wire use. */
export function toRuntimeProblem(problem: SeedProblem, id: string): Problem {
  return {
    id,
    slug: problem.slug,
    title: problem.title,
    topic: problem.topic,
    difficulty: problem.difficulty,
    description: problem.description,
    starters: startersFor(problem),
    // Until a problem gets hand-picked examples, show its first two hidden
    // cases so "Run" is still useful rather than blank.
    sampleCases: problem.sampleCases ?? problem.testCases.slice(0, 2),
    testCases: problem.testCases,
    jsFunctionName: problem.functionSignature.match(/function\s+(\w+)/)?.[1] ?? 'solution',
    ...(problem.cppDeclaration
      ? {
          cppFunctionName: cppFunctionName(problem.cppDeclaration),
          ...(problem.cppTypes ? { cppSignature: problem.cppTypes } : {}),
        }
      : {}),
    ...(problem.argAdapters ? { argAdapters: problem.argAdapters } : {}),
    ...(problem.resultAdapter ? { resultAdapter: problem.resultAdapter } : {}),
    ...(problem.unorderedResult ? { unorderedResult: true } : {}),
  };
}

/** The bundled bank, given synthetic ids so it matches the DB-backed shape. */
function fromBundledBank(): Problem[] {
  return PROBLEM_BANK.map((problem) => toRuntimeProblem(problem, randomUUID()));
}

/**
 * Loads the problem pool. Prefers Postgres so problems can be edited without a
 * redeploy; falls back to the bundled bank when there's no database configured
 * or it can't be reached, because a matchmaking server with no problems is
 * useless and the bank is right there.
 */
export async function loadProblems(): Promise<void> {
  const pool = getPool();

  if (!pool) {
    problems = fromBundledBank();
    console.log(`[problems] loaded ${problems.length} from the bundled bank (no DATABASE_URL)`);
    return;
  }

  try {
    const result = await pool.query<ProblemRow>('SELECT * FROM problems');
    if (result.rows.length === 0) {
      problems = fromBundledBank();
      console.warn(
        `[problems] database has no problems — using the bundled bank (${problems.length}). ` +
          'Run `npm run db:seed -w @xeetcode/server` to populate it.',
      );
      return;
    }
    problems = result.rows.map(fromRow);
    console.log(`[problems] loaded ${problems.length} from the database`);
  } catch (error) {
    problems = fromBundledBank();
    console.error('[problems] database read failed, using the bundled bank:', error);
  }
}

export function problemCount(): number {
  return problems.length;
}

/**
 * Picks a random problem for a topic selection.
 *
 * `random` draws from the whole pool. A specific topic draws only from that
 * topic, falling back to the whole pool if that topic somehow has none, so a
 * match can always start.
 */
export function pickProblem(selection: TopicSelection): Problem | undefined {
  if (problems.length === 0) return undefined;

  const pool =
    selection === 'random' ? problems : problems.filter((problem) => problem.topic === selection);

  const candidates = pool.length > 0 ? pool : problems;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

/** Test seam: replace the in-memory pool directly. */
export function setProblemsForTesting(next: Problem[]): void {
  problems = next;
}
