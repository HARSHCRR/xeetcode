import assert from 'node:assert/strict';
import { test } from 'node:test';

import { PROBLEM_BANK } from './bank.js';
import { REFERENCE_SOLUTIONS } from './solutions/index.js';
import { ADAPTERS } from './solutions/structures.js';

/** Sorts nested arrays so order-insensitive answers compare equal. */
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value
      .map(canonical)
      .slice()
      .sort((a, b) => (JSON.stringify(a) < JSON.stringify(b) ? -1 : 1));
  }
  return value;
}

test('every problem has a reference solution', () => {
  const missing = PROBLEM_BANK.filter((p) => !REFERENCE_SOLUTIONS[p.slug]).map((p) => p.slug);
  assert.deepEqual(missing, [], `problems without a reference solution: ${missing.join(', ')}`);
});

test('every reference solution reproduces its expected values', () => {
  for (const problem of PROBLEM_BANK) {
    const solve = REFERENCE_SOLUTIONS[problem.slug];
    if (!solve) continue;

    problem.testCases.forEach((testCase, index) => {
      // Feed the reference the same shapes a player's code receives: JSON in,
      // structures built by the adapters where the problem declares them.
      const args = (testCase.input as unknown[]).map((arg, i) => {
        const adapter = problem.argAdapters?.[i];
        return adapter ? ADAPTERS[adapter]!(arg) : arg;
      });

      const raw = solve(...(args as never[]));
      const actual = problem.resultAdapter ? ADAPTERS[problem.resultAdapter]!(raw) : raw;
      const [a, b] = problem.unorderedResult
        ? [canonical(actual), canonical(testCase.expected)]
        : [actual, testCase.expected];

      assert.deepEqual(
        a,
        b,
        `${problem.slug} test ${index + 1}: input ${JSON.stringify(testCase.input)} ` +
          `expected ${JSON.stringify(testCase.expected)} but reference produced ${JSON.stringify(actual)}`,
      );
    });
  }
});

test('slugs are unique', () => {
  const slugs = PROBLEM_BANK.map((p) => p.slug);
  assert.equal(new Set(slugs).size, slugs.length);
});

test('every problem has at least 3 test cases', () => {
  const thin = PROBLEM_BANK.filter((p) => p.testCases.length < 3).map((p) => p.slug);
  assert.deepEqual(thin, []);
});

test('the starter code declares the documented function name', () => {
  for (const problem of PROBLEM_BANK) {
    const name = problem.functionSignature.match(/function\s+(\w+)/)?.[1];
    assert.ok(name, `${problem.slug}: could not parse a function name from its signature`);
    assert.ok(
      problem.starterCode.includes(`function ${name}`),
      `${problem.slug}: starter code does not define ${name}`,
    );
  }
});

test('the bank holds the full Blind 75 set', () => {
  assert.equal(PROBLEM_BANK.length, 75);
});

test('structure problems declare adapters that exist', () => {
  for (const problem of PROBLEM_BANK) {
    for (const adapter of problem.argAdapters ?? []) {
      if (adapter) assert.ok(ADAPTERS[adapter], `${problem.slug}: unknown adapter ${adapter}`);
    }
    if (problem.resultAdapter) {
      assert.ok(ADAPTERS[problem.resultAdapter], `${problem.slug}: unknown result adapter`);
    }
  }
});
