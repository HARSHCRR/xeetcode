import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { Problem } from '@xeetcode/shared';

import { judgeLocally } from './local.js';

/**
 * A problem whose single test passes only if the submission returns true.
 *
 * The hostile cases below try to reach something they shouldn't and return
 * whether they succeeded — so a passing verdict means the sandbox leaked.
 */
const probe: Problem = {
  id: 'probe',
  slug: 'probe',
  title: 'Probe',
  topic: 'arrays',
  difficulty: 'easy',
  description: '',
  starters: { javascript: '' },
  sampleCases: [],
  jsFunctionName: 'probe',
  testCases: [{ input: [], expected: true }],
};

test('a correct submission is accepted', async () => {
  const verdict = await judgeLocally(probe, 'function probe() { return true; }');
  assert.equal(verdict.passed, true);
  assert.equal(verdict.passedCount, 1);
});

test('a wrong submission reports the failing test without leaking it', async () => {
  const verdict = await judgeLocally(probe, 'function probe() { return false; }');
  assert.equal(verdict.passed, false);
  assert.equal(verdict.failedTestIndex, 1);
  assert.ok(!('expected' in verdict), 'must not echo the expected value back');
});

test('sandboxed code cannot read the filesystem', async () => {
  const verdict = await judgeLocally(
    probe,
    `function probe() {
       try { require('node:fs').readFileSync('/etc/hosts'); return true; }
       catch { return false; }
     }`,
  );
  assert.notEqual(verdict.passed, true, 'filesystem access must be denied');
});

test('sandboxed code cannot spawn processes', async () => {
  const verdict = await judgeLocally(
    probe,
    `function probe() {
       try { require('node:child_process').execSync('id'); return true; }
       catch { return false; }
     }`,
  );
  assert.notEqual(verdict.passed, true, 'child_process must be denied');
});

test('sandboxed code cannot see server secrets in the environment', async () => {
  // Set a decoy on this process; the child must not inherit it.
  process.env.XEETCODE_SANDBOX_CANARY = 'leaked';
  try {
    const verdict = await judgeLocally(
      probe,
      `function probe() { return process.env.XEETCODE_SANDBOX_CANARY === 'leaked'; }`,
    );
    assert.notEqual(verdict.passed, true, 'the child must run with a scrubbed environment');
  } finally {
    delete process.env.XEETCODE_SANDBOX_CANARY;
  }
});

test('an infinite loop is killed and reported as a timeout', async () => {
  const verdict = await judgeLocally(probe, 'function probe() { while (true) {} }');
  assert.equal(verdict.errorKind, 'timeout');
  assert.equal(verdict.passed, false);
});

test('a syntax error is reported as such', async () => {
  const verdict = await judgeLocally(probe, 'function probe( {{{');
  assert.equal(verdict.errorKind, 'compile_error');
});

test('a thrown error fails without crashing the judge', async () => {
  const verdict = await judgeLocally(probe, 'function probe() { throw new Error("nope"); }');
  assert.equal(verdict.passed, false);
});
