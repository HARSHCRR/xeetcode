import { starter, type SeedProblem } from '../types.js';

const p = (
  slug: string,
  title: string,
  difficulty: SeedProblem['difficulty'],
  description: string,
  signature: string,
  testCases: SeedProblem['testCases'],
): SeedProblem => ({
  slug,
  title,
  topic: 'dynamic_programming',
  difficulty,
  description,
  functionSignature: signature,
  starterCode: starter(signature),
  testCases,
});

export const DP_PROBLEMS: SeedProblem[] = [
  p(
    'ways-up-the-stairs',
    'Ways Up the Stairs',
    'easy',
    `You climb 1 or 2 steps at a time. Return how many distinct ways there are to reach step \`n\`.

\`\`\`
n = 4  ->  5
\`\`\``,
    'function waysUpTheStairs(n)',
    [
      { input: [4], expected: 5 },
      { input: [1], expected: 1 },
      { input: [0], expected: 1 },
      { input: [10], expected: 89 },
    ],
  ),
  p(
    'fewest-coins',
    'Fewest Coins',
    'medium',
    `Given coin denominations and an amount, return the fewest coins that make it exactly. Each denomination may be used any number of times. Return \`-1\` if impossible.

\`\`\`
coins = [1, 5, 6], amount = 11  ->  2
\`\`\``,
    'function fewestCoins(coins, amount)',
    [
      { input: [[1, 5, 6], 11], expected: 2 },
      { input: [[2], 3], expected: -1 },
      { input: [[1, 2, 5], 0], expected: 0 },
      { input: [[186, 419, 83, 408], 6249], expected: 20 },
    ],
  ),
  p(
    'longest-rising-run',
    'Longest Rising Subsequence',
    'medium',
    `Return the length of the longest strictly increasing subsequence. The chosen values need not be adjacent, but must keep their original order.

\`\`\`
nums = [10, 9, 2, 5, 3, 7, 101, 18]  ->  4
\`\`\``,
    'function longestRisingRun(nums)',
    [
      { input: [[10, 9, 2, 5, 3, 7, 101, 18]], expected: 4 },
      { input: [[7, 7, 7]], expected: 1 },
      { input: [[]], expected: 0 },
      { input: [[4, 10, 4, 3, 8, 9]], expected: 3 },
    ],
  ),
  p(
    'longest-shared-subsequence',
    'Longest Shared Subsequence',
    'medium',
    `Return the length of the longest subsequence present in both strings. Characters need not be adjacent, but must keep their order.

\`\`\`
a = "abcde", b = "ace"  ->  3
\`\`\``,
    'function longestSharedSubsequence(a, b)',
    [
      { input: ['abcde', 'ace'], expected: 3 },
      { input: ['abc', 'abc'], expected: 3 },
      { input: ['abc', 'def'], expected: 0 },
      { input: ['', 'abc'], expected: 0 },
    ],
  ),
  p(
    'splittable-into-words',
    'Splittable Into Words',
    'medium',
    `Decide whether a string can be cut into a sequence of dictionary words. Words may be reused.

\`\`\`
s = "applepen", words = ["apple", "pen"]  ->  true
\`\`\``,
    'function splittableIntoWords(s, words)',
    [
      { input: ['applepen', ['apple', 'pen']], expected: true },
      { input: ['catsandog', ['cats', 'dog', 'sand', 'and', 'cat']], expected: false },
      { input: ['', ['a']], expected: true },
      { input: ['aaaaaaa', ['aaaa', 'aaa']], expected: true },
    ],
  ),
  p(
    'ordered-sums-to-target',
    'Ordered Sums to Target',
    'medium',
    `Count the ordered sequences of the given numbers that add up to the target. Sequences using the same values in a different order count separately, and numbers may repeat.

\`\`\`
nums = [1, 2, 3], target = 4  ->  7
\`\`\``,
    'function orderedSumsToTarget(nums, target)',
    [
      { input: [[1, 2, 3], 4], expected: 7 },
      { input: [[9], 3], expected: 0 },
      { input: [[1, 2], 0], expected: 1 },
      { input: [[2, 3], 6], expected: 2 },
    ],
  ),
  p(
    'best-loot-in-a-row',
    'Best Loot in a Row',
    'medium',
    `Houses in a row hold the given amounts. You cannot take from two adjacent houses. Return the most you can take.

\`\`\`
amounts = [2, 7, 9, 3, 1]  ->  12
\`\`\``,
    'function bestLootInARow(amounts)',
    [
      { input: [[2, 7, 9, 3, 1]], expected: 12 },
      { input: [[1, 2, 3, 1]], expected: 4 },
      { input: [[]], expected: 0 },
      { input: [[5]], expected: 5 },
    ],
  ),
  p(
    'best-loot-in-a-circle',
    'Best Loot in a Circle',
    'medium',
    `Same as before, but the houses form a circle — the first and last are adjacent, so you cannot take both.

\`\`\`
amounts = [2, 3, 2]  ->  3
\`\`\``,
    'function bestLootInACircle(amounts)',
    [
      { input: [[2, 3, 2]], expected: 3 },
      { input: [[1, 2, 3, 1]], expected: 4 },
      { input: [[5]], expected: 5 },
      { input: [[]], expected: 0 },
    ],
  ),
  p(
    'ways-to-read-digits',
    'Ways to Read Digits',
    'medium',
    `Letters map to numbers: \`A\` is 1 through \`Z\` is 26. Given a digit string, return how many ways it decodes into letters.

A part starting with \`0\` decodes to nothing.

\`\`\`
s = "226"  ->  3
\`\`\``,
    'function waysToReadDigits(s)',
    [
      { input: ['226'], expected: 3 },
      { input: ['06'], expected: 0 },
      { input: ['12'], expected: 2 },
      { input: [''], expected: 0 },
    ],
  ),
  p(
    'paths-across-grid',
    'Paths Across a Grid',
    'medium',
    `Starting top-left of an \`m\` by \`n\` grid and moving only right or down, return how many distinct paths reach the bottom-right.

\`\`\`
m = 3, n = 3  ->  6
\`\`\``,
    'function pathsAcrossGrid(m, n)',
    [
      { input: [3, 3], expected: 6 },
      { input: [1, 1], expected: 1 },
      { input: [3, 7], expected: 28 },
      { input: [1, 9], expected: 1 },
    ],
  ),
  p(
    'can-reach-the-end',
    'Can Reach the End',
    'medium',
    `Each value is the maximum number of steps you may jump forward from that index. Starting at index 0, decide whether the last index is reachable.

\`\`\`
nums = [2, 3, 1, 1, 4]  ->  true
\`\`\``,
    'function canReachTheEnd(nums)',
    [
      { input: [[2, 3, 1, 1, 4]], expected: true },
      { input: [[3, 2, 1, 0, 4]], expected: false },
      { input: [[0]], expected: true },
      { input: [[2, 0, 0]], expected: true },
    ],
  ),
];

export const HEAP_PROBLEMS: SeedProblem[] = [
  {
    slug: 'k-most-frequent',
    title: 'K Most Frequent',
    topic: 'heap',
    difficulty: 'medium',
    description: `Return the \`k\` values that appear most often. Order does not matter.

\`\`\`
nums = [1, 1, 1, 2, 2, 3], k = 2  ->  [1, 2]
\`\`\``,
    functionSignature: 'function kMostFrequent(nums, k)',
    starterCode: starter('function kMostFrequent(nums, k)'),
    unorderedResult: true,
    testCases: [
      { input: [[1, 1, 1, 2, 2, 3], 2], expected: [1, 2] },
      { input: [[7], 1], expected: [7] },
      { input: [[4, 4, 5, 5, 6], 2], expected: [4, 5] },
      { input: [[1, 2, 3], 3], expected: [1, 2, 3] },
    ],
  },
  {
    slug: 'running-median',
    title: 'Running Median',
    topic: 'heap',
    difficulty: 'hard',
    description: `Numbers arrive one at a time. After each arrival, record the median of everything seen so far.

Return the array of medians. With an even count, the median is the average of the middle two.

\`\`\`
stream = [2, 4, 6]  ->  [2, 3, 4]
\`\`\``,
    functionSignature: 'function runningMedian(stream)',
    starterCode: starter('function runningMedian(stream)'),
    testCases: [
      { input: [[2, 4, 6]], expected: [2, 3, 4] },
      { input: [[1]], expected: [1] },
      { input: [[]], expected: [] },
      { input: [[5, 1, 3, 2]], expected: [5, 3, 3, 2.5] },
    ],
  },
];
