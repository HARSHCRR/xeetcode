import assert from 'node:assert/strict';
import { test } from 'node:test';

import { PROBLEM_BANK } from './bank.js';

/**
 * Reference solutions, one per problem slug.
 *
 * The point of these is to machine-check the seed data: a hand-written
 * `expected` value that is subtly wrong would be invisible until Phase 3, when
 * it would fail correct player submissions and look like a judge bug. Running
 * a known-good solution over every test case catches that here instead.
 *
 * Keeping them also pins down the intended reading of each description — if a
 * problem statement is ambiguous, writing the reference solution surfaces it.
 */
const SOLUTIONS: Record<string, (...args: never[]) => unknown> = {
  // --- Arrays ---
  'pair-sums-to-target': (nums: number[], target: number) => {
    const seen = new Map<number, number>();
    for (let i = 0; i < nums.length; i++) {
      const value = nums[i]!;
      const partner = seen.get(target - value);
      if (partner !== undefined) return [partner, i];
      seen.set(value, i);
    }
    return [];
  },

  'best-single-trade': (prices: number[]) => {
    let best = 0;
    let cheapest = Infinity;
    for (const price of prices) {
      cheapest = Math.min(cheapest, price);
      best = Math.max(best, price - cheapest);
    }
    return best;
  },

  'largest-run-sum': (nums: number[]) => {
    if (nums.length === 0) return 0;
    let best = nums[0]!;
    let running = nums[0]!;
    for (let i = 1; i < nums.length; i++) {
      running = Math.max(nums[i]!, running + nums[i]!);
      best = Math.max(best, running);
    }
    return best;
  },

  'shift-zeros-back': (nums: number[]) => {
    const kept = nums.filter((n) => n !== 0);
    return [...kept, ...Array(nums.length - kept.length).fill(0)];
  },

  'product-of-the-rest': (nums: number[]) => {
    const out = Array<number>(nums.length).fill(1);
    let prefix = 1;
    for (let i = 0; i < nums.length; i++) {
      out[i] = prefix;
      prefix *= nums[i]!;
    }
    let suffix = 1;
    for (let i = nums.length - 1; i >= 0; i--) {
      out[i]! *= suffix;
      suffix *= nums[i]!;
    }
    return out;
  },

  'find-the-repeat': (nums: number[]) => {
    const seen = new Set<number>();
    for (const n of nums) {
      if (seen.has(n)) return n;
      seen.add(n);
    }
    return -1;
  },

  'merge-overlapping-spans': (spans: number[][]) => {
    const sorted = [...spans].sort((a, b) => a[0]! - b[0]!);
    const out: number[][] = [];
    for (const span of sorted) {
      const last = out[out.length - 1];
      if (last && span[0]! <= last[1]!) {
        last[1] = Math.max(last[1]!, span[1]!);
      } else {
        out.push([...span]);
      }
    }
    return out;
  },

  // --- Strings ---
  'clean-palindrome-check': (s: string) => {
    const cleaned = s.toLowerCase().replace(/[^a-z0-9]/g, '');
    return cleaned === [...cleaned].reverse().join('');
  },

  'longest-unique-window': (s: string) => {
    const lastSeen = new Map<string, number>();
    let best = 0;
    let start = 0;
    for (let i = 0; i < s.length; i++) {
      const ch = s[i]!;
      const prev = lastSeen.get(ch);
      if (prev !== undefined && prev >= start) start = prev + 1;
      lastSeen.set(ch, i);
      best = Math.max(best, i - start + 1);
    }
    return best;
  },

  'same-letters-reordered': (a: string, b: string) => {
    if (a.length !== b.length) return false;
    return [...a].sort().join('') === [...b].sort().join('');
  },

  'first-unrepeated-character': (s: string) => {
    const counts = new Map<string, number>();
    for (const ch of s) counts.set(ch, (counts.get(ch) ?? 0) + 1);
    for (let i = 0; i < s.length; i++) {
      if (counts.get(s[i]!) === 1) return i;
    }
    return -1;
  },

  'collapse-repeats': (s: string) => {
    let out = '';
    let i = 0;
    while (i < s.length) {
      let j = i;
      while (j < s.length && s[j] === s[i]) j++;
      out += `${s[i]}${j - i}`;
      i = j;
    }
    return out.length < s.length ? out : s;
  },

  'reverse-word-order': (s: string) => s.trim().split(/\s+/).filter(Boolean).reverse().join(' '),

  'balanced-brackets': (s: string) => {
    const closers: Record<string, string> = { ')': '(', ']': '[', '}': '{' };
    const stack: string[] = [];
    for (const ch of s) {
      if (ch === '(' || ch === '[' || ch === '{') {
        stack.push(ch);
      } else if (stack.pop() !== closers[ch]) {
        return false;
      }
    }
    return stack.length === 0;
  },

  'group-by-letters': (words: string[]) => {
    const groups = new Map<string, string[]>();
    for (const word of words) {
      const key = [...word].sort().join('');
      const bucket = groups.get(key);
      if (bucket) bucket.push(word);
      else groups.set(key, [word]);
    }
    return [...groups.values()]
      .map((group) => group.sort())
      .sort((a, b) => a[0]!.localeCompare(b[0]!));
  },

  // --- Binary search ---
  'locate-in-sorted': (nums: number[], target: number) => {
    let lo = 0;
    let hi = nums.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (nums[mid] === target) return mid;
      if (nums[mid]! < target) lo = mid + 1;
      else hi = mid - 1;
    }
    return -1;
  },

  'insertion-point': (nums: number[], target: number) => {
    let lo = 0;
    let hi = nums.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (nums[mid]! < target) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  },

  'span-of-a-value': (nums: number[], target: number) => {
    const bound = (findFirst: boolean) => {
      let lo = 0;
      let hi = nums.length - 1;
      let found = -1;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (nums[mid] === target) {
          found = mid;
          if (findFirst) hi = mid - 1;
          else lo = mid + 1;
        } else if (nums[mid]! < target) {
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
      }
      return found;
    };
    return [bound(true), bound(false)];
  },

  'smallest-in-rotated': (nums: number[]) => {
    let lo = 0;
    let hi = nums.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (nums[mid]! > nums[hi]!) lo = mid + 1;
      else hi = mid;
    }
    return nums[lo];
  },

  'integer-square-root': (n: number) => {
    let lo = 0;
    let hi = n;
    let best = 0;
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (mid * mid <= n) {
        best = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    return best;
  },

  'search-rotated-sorted': (nums: number[], target: number) => {
    let lo = 0;
    let hi = nums.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (nums[mid] === target) return mid;
      if (nums[lo]! <= nums[mid]!) {
        if (nums[lo]! <= target && target < nums[mid]!) hi = mid - 1;
        else lo = mid + 1;
      } else {
        if (nums[mid]! < target && target <= nums[hi]!) lo = mid + 1;
        else hi = mid - 1;
      }
    }
    return -1;
  },
};

test('every problem has a reference solution', () => {
  const missing = PROBLEM_BANK.filter((p) => !SOLUTIONS[p.slug]).map((p) => p.slug);
  assert.deepEqual(missing, [], `problems without a reference solution: ${missing.join(', ')}`);
});

test('every reference solution matches its expected values', () => {
  for (const problem of PROBLEM_BANK) {
    const solve = SOLUTIONS[problem.slug];
    if (!solve) continue;
    problem.testCases.forEach((testCase, index) => {
      const actual = solve(...(testCase.input as never[]));
      assert.deepEqual(
        actual,
        testCase.expected,
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

test('each topic has enough problems for its own queue', () => {
  for (const topic of ['arrays', 'strings', 'binary_search'] as const) {
    const count = PROBLEM_BANK.filter((p) => p.topic === topic).length;
    assert.ok(count >= 5, `${topic} only has ${count} problems`);
  }
});
