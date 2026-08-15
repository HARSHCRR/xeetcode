import type { Problem } from '@xeetcode/shared';

import { STRUCTURE_PRELUDE } from './prelude.js';

/** Marker the harness prints its JSON verdict behind, so we can find it in stdout. */
export const RESULT_MARKER = '__XEETCODE_RESULT__';

export interface HarnessResult {
  results: { pass: boolean }[];
  error?: string;
}

/** Parses the function name a problem expects, e.g. "function twoSum(a, b)" -> "twoSum". */
export function solutionName(problem: Problem): string {
  return problem.functionSignature.match(/function\s+(\w+)/)?.[1] ?? 'solution';
}

/**
 * Wraps the player's source in a runner that executes every test case and
 * prints one JSON line.
 *
 * A single execution handles all tests, so judging costs one sandbox spawn
 * rather than one per case.
 *
 * Comparison is structural on JSON, which is why the bank avoids problems that
 * admit several correct answers. Problems whose inputs or outputs are linked
 * lists or trees name an adapter (see `prelude.ts`) to convert between the JSON
 * in the test case and the real node structure.
 */
export function buildHarness(problem: Problem, userCode: string): string {
  const fn = solutionName(problem);
  const cases = JSON.stringify(problem.testCases);
  const argAdapters = JSON.stringify(problem.argAdapters ?? null);
  const resultAdapter = JSON.stringify(problem.resultAdapter ?? null);
  const unordered = JSON.stringify(Boolean(problem.unorderedResult));

  return `${STRUCTURE_PRELUDE}

${userCode}

;(function () {
  const __marker = ${JSON.stringify(RESULT_MARKER)};
  const __cases = ${cases};
  const __argAdapters = ${argAdapters};
  const __resultAdapter = ${resultAdapter};
  const __unordered = ${unordered};

  const __helpers = {
    buildList: typeof __buildList === 'function' ? __buildList : null,
    buildLists: typeof __buildLists === 'function' ? __buildLists : null,
    listToArray: typeof __listToArray === 'function' ? __listToArray : null,
    buildTree: typeof __buildTree === 'function' ? __buildTree : null,
    treeToArray: typeof __treeToArray === 'function' ? __treeToArray : null,
  };

  /** Sorts nested arrays so order-insensitive answers compare equal. */
  function __canonical(value) {
    if (Array.isArray(value)) {
      const mapped = value.map(__canonical);
      return mapped.slice().sort((a, b) => (JSON.stringify(a) < JSON.stringify(b) ? -1 : 1));
    }
    return value;
  }

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
    if (typeof a === 'number' && typeof b === 'number') return Number.isNaN(a) && Number.isNaN(b);
    return false;
  }

  if (typeof ${fn} !== 'function') {
    console.log(__marker + JSON.stringify({ results: [], error: 'Define a function named ${fn}.' }));
    return;
  }

  const __results = [];
  for (const __case of __cases) {
    try {
      // Deep-copy so one test mutating an input can't corrupt the next.
      let __args = JSON.parse(JSON.stringify(__case.input));

      if (__argAdapters) {
        __args = __args.map(function (arg, i) {
          const name = __argAdapters[i];
          const helper = name ? __helpers[name] : null;
          return helper ? helper(arg) : arg;
        });
      }

      let __actual = ${fn}.apply(null, __args);

      if (__resultAdapter && __helpers[__resultAdapter]) {
        __actual = __helpers[__resultAdapter](__actual);
      }

      const __expected = __case.expected;
      const __pass = __unordered
        ? __equal(__canonical(__actual), __canonical(__expected))
        : __equal(__actual, __expected);

      __results.push({ pass: __pass });
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
