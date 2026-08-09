import type { Problem } from '@xeetcode/shared';

/** Marker the harness prints its JSON verdict behind, so we can find it in stdout. */
export const RESULT_MARKER = '__XEETCODE_RESULT__';

export interface HarnessResult {
  results: { pass: boolean }[];
  error?: string;
}

/**
 * Parses the function name a problem expects, e.g. "function twoSum(a, b)" -> "twoSum".
 */
export function solutionName(problem: Problem): string {
  return problem.functionSignature.match(/function\s+(\w+)/)?.[1] ?? 'solution';
}

/**
 * Wraps the player's source in a runner that executes every test case and
 * prints one JSON line.
 *
 * A single execution handles all tests, so judging costs one sandbox call
 * rather than one per case — that matters because the judge is a shared public
 * API with rate limits.
 *
 * Comparison is structural on JSON, which is why the bank avoids problems that
 * admit several correct answers.
 */
export function buildHarness(problem: Problem, userCode: string): string {
  const fn = solutionName(problem);
  const cases = JSON.stringify(problem.testCases);

  return `${userCode}

;(function () {
  const __marker = ${JSON.stringify(RESULT_MARKER)};
  const __cases = ${cases};

  function __equal(a, b) {
    if (a === b) return true;
    if (typeof a !== typeof b) return false;
    if (a === null || b === null) return a === b;
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) if (!__equal(a[i], b[i])) return false;
      return true;
    }
    if (typeof a === 'object' && typeof b === 'object') {
      const ka = Object.keys(a).sort();
      const kb = Object.keys(b).sort();
      if (ka.length !== kb.length) return false;
      for (let i = 0; i < ka.length; i++) {
        if (ka[i] !== kb[i]) return false;
        if (!__equal(a[ka[i]], b[kb[i]])) return false;
      }
      return true;
    }
    // NaN is the one value that isn't equal to itself.
    if (typeof a === 'number' && typeof b === 'number') return Number.isNaN(a) && Number.isNaN(b);
    return false;
  }

  if (typeof ${fn} !== 'function') {
    console.log(__marker + JSON.stringify({
      results: [],
      error: 'Define a function named ${fn}.'
    }));
    return;
  }

  const __results = [];
  for (const __case of __cases) {
    try {
      // Deep-copy arguments so one test mutating an input can't corrupt the next.
      const __args = JSON.parse(JSON.stringify(__case.input));
      const __actual = ${fn}.apply(null, __args);
      __results.push({ pass: __equal(__actual, __case.expected) });
    } catch (err) {
      __results.push({ pass: false });
    }
  }

  console.log(__marker + JSON.stringify({ results: __results }));
})();
`;
}

/** Extracts the verdict from stdout, ignoring anything the player logged. */
export function parseHarnessOutput(stdout: string): HarnessResult | undefined {
  const start = stdout.lastIndexOf(RESULT_MARKER);
  if (start === -1) return undefined;

  const line = stdout.slice(start + RESULT_MARKER.length).split('\n')[0];
  if (!line) return undefined;

  try {
    const parsed: unknown = JSON.parse(line);
    if (typeof parsed === 'object' && parsed !== null && 'results' in parsed) {
      return parsed as HarnessResult;
    }
  } catch {
    // Malformed — treated as a failed run by the caller.
  }
  return undefined;
}
