import assert from 'node:assert/strict';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

import type { Problem } from '@xeetcode/shared';

import { buildHarness, parseHarnessOutput, RESULT_MARKER, solutionName } from './harness.js';

const problem = (testCases: Problem['testCases']): Problem => ({
  id: 'p1',
  slug: 'add',
  title: 'Add',
  topic: 'arrays',
  difficulty: 'easy',
  description: '',
  starters: { javascript: '' },
  sampleCases: [],
  jsFunctionName: 'add',
  testCases,
});

/**
 * The harness is a string of JS run inside a sandbox, so it can't be imported
 * and called. Executing it with `eval` here checks the generated program itself
 * — the thing that actually decides a match — rather than trusting it by eye.
 */
function runHarness(source: string): ReturnType<typeof parseHarnessOutput> {
  const lines: string[] = [];

  // A fresh context per run, mirroring the sandbox. Using `eval` here leaked
  // globals between tests: a `function add` defined by one test was still
  // present in the next, hiding the "missing function" case entirely.
  runInNewContext(source, {
    console: { log: (...args: unknown[]) => void lines.push(args.join(' ')) },
  });

  return parseHarnessOutput(lines.join('\n'));
}

test('parses the function name out of a signature', () => {
  assert.equal(solutionName(problem([])), 'add');
});

test('a correct solution passes every test', () => {
  const source = buildHarness(
    problem([
      { input: [1, 2], expected: 3 },
      { input: [0, 0], expected: 0 },
    ]),
    'function add(a, b) { return a + b; }',
  );

  const result = runHarness(source);
  assert.deepEqual(result?.results, [{ pass: true }, { pass: true }]);
});

test('a wrong solution fails the tests it gets wrong', () => {
  const source = buildHarness(
    problem([
      { input: [1, 2], expected: 3 },
      { input: [2, 2], expected: 4 },
    ]),
    'function add(a, b) { return a === 1 ? 3 : 0; }',
  );

  const result = runHarness(source);
  assert.deepEqual(result?.results, [{ pass: true }, { pass: false }]);
});

test('a throwing solution fails rather than crashing the run', () => {
  const source = buildHarness(
    problem([{ input: [1, 2], expected: 3 }]),
    'function add() { throw new Error("boom"); }',
  );

  const result = runHarness(source);
  assert.deepEqual(result?.results, [{ pass: false }]);
});

test('a missing function reports a usable error instead of a crash', () => {
  const source = buildHarness(problem([{ input: [1, 2], expected: 3 }]), 'const nope = 1;');

  const result = runHarness(source);
  assert.match(result?.error ?? '', /add/);
});

test('array and object results compare structurally, not by reference', () => {
  const source = buildHarness(
    problem([
      { input: [], expected: [1, [2, 3]] },
      { input: [], expected: { a: 1, b: [2] } },
    ]),
    'let n = 0; function add() { return n++ === 0 ? [1, [2, 3]] : { b: [2], a: 1 }; }',
  );

  const result = runHarness(source);
  // Key order must not matter for objects.
  assert.deepEqual(result?.results, [{ pass: true }, { pass: true }]);
});

test('mutating an input cannot corrupt a later test', () => {
  const source = buildHarness(
    problem([
      { input: [[1, 2, 3]], expected: 3 },
      { input: [[1, 2, 3]], expected: 3 },
    ]),
    'function add(xs) { xs.pop(); return xs.length + 1; }',
  );

  const result = runHarness(source);
  assert.deepEqual(result?.results, [{ pass: true }, { pass: true }]);
});

test('player output on stdout does not confuse the verdict parser', () => {
  const source = buildHarness(
    problem([{ input: [1, 2], expected: 3 }]),
    `function add(a, b) { console.log('${RESULT_MARKER}{"results":[{"pass":true}]}'); return 0; }`,
  );

  const result = runHarness(source);
  // The real verdict is printed last, so a spoofed marker can't win the match.
  assert.deepEqual(result?.results, [{ pass: false }]);
});

test('unparseable output yields no verdict', () => {
  assert.equal(parseHarnessOutput('nothing useful here'), undefined);
});
