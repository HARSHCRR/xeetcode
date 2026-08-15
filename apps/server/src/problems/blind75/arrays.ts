import { starter, type SeedProblem } from '../types.js';

const p = (
  slug: string,
  title: string,
  difficulty: SeedProblem['difficulty'],
  description: string,
  signature: string,
  testCases: SeedProblem['testCases'],
  extra: Partial<SeedProblem> = {},
): SeedProblem => ({
  slug,
  title,
  topic: 'arrays',
  difficulty,
  description,
  functionSignature: signature,
  starterCode: starter(signature),
  testCases,
  ...extra,
});

export const ARRAY_PROBLEMS: SeedProblem[] = [
  p(
    'pair-sums-to-target',
    'Pair Sums to Target',
    'easy',
    `Given an array of integers and a target, find the two positions whose values add up to the target.

Return the indices in increasing order. Exactly one pair works.

\`\`\`
nums = [4, 7, 1, 9], target = 8  ->  [1, 2]
\`\`\``,
    'function pairSumsToTarget(nums, target)',
    [
      { input: [[4, 7, 1, 9], 8], expected: [1, 2] },
      { input: [[3, 3], 6], expected: [0, 1] },
      { input: [[-2, 5, 11, -6], -8], expected: [0, 3] },
      { input: [[0, 4, 3, 0], 0], expected: [0, 3] },
    ],
  ),
  p(
    'best-single-trade',
    'Best Single Trade',
    'easy',
    `Daily prices are given in order. Buy on one day and sell on a strictly later day.

Return the largest profit possible, or \`0\` if no trade profits.

\`\`\`
prices = [8, 3, 6, 1, 9]  ->  8
\`\`\``,
    'function bestSingleTrade(prices)',
    [
      { input: [[8, 3, 6, 1, 9]], expected: 8 },
      { input: [[9, 8, 7, 6]], expected: 0 },
      { input: [[]], expected: 0 },
      { input: [[2, 4, 1, 7, 3, 9]], expected: 8 },
    ],
  ),
  p(
    'has-any-duplicate',
    'Has Any Duplicate',
    'easy',
    `Return \`true\` if any value appears at least twice, otherwise \`false\`.

\`\`\`
nums = [1, 2, 3, 1]  ->  true
\`\`\``,
    'function hasAnyDuplicate(nums)',
    [
      { input: [[1, 2, 3, 1]], expected: true },
      { input: [[1, 2, 3, 4]], expected: false },
      { input: [[]], expected: false },
      { input: [[7, 7]], expected: true },
    ],
  ),
  p(
    'product-of-the-rest',
    'Product of the Rest',
    'medium',
    `For each position, compute the product of every *other* element. Solve it without division.

\`\`\`
nums = [2, 3, 4]  ->  [12, 8, 6]
\`\`\``,
    'function productOfTheRest(nums)',
    [
      { input: [[2, 3, 4]], expected: [12, 8, 6] },
      { input: [[1, 2, 3, 4]], expected: [24, 12, 8, 6] },
      { input: [[5, 0]], expected: [0, 5] },
      { input: [[0, 0, 3]], expected: [0, 0, 0] },
    ],
  ),
  p(
    'largest-run-sum',
    'Largest Run Sum',
    'medium',
    `Find the contiguous run of one or more elements with the largest sum, and return that sum.

An all-negative array answers with its least-negative element.

\`\`\`
nums = [2, -5, 4, -1, 3, -2]  ->  6
\`\`\``,
    'function largestRunSum(nums)',
    [
      { input: [[2, -5, 4, -1, 3, -2]], expected: 6 },
      { input: [[-4, -2, -9]], expected: -2 },
      { input: [[7]], expected: 7 },
      { input: [[1, 2, 3, 4]], expected: 10 },
    ],
  ),
  p(
    'largest-run-product',
    'Largest Run Product',
    'medium',
    `Find the contiguous run with the largest *product* and return it.

Watch for negatives: two of them multiply back to a positive.

\`\`\`
nums = [2, 3, -2, 4]  ->  6
\`\`\``,
    'function largestRunProduct(nums)',
    [
      { input: [[2, 3, -2, 4]], expected: 6 },
      { input: [[-2, 0, -1]], expected: 0 },
      { input: [[-2, 3, -4]], expected: 24 },
      { input: [[-5]], expected: -5 },
    ],
  ),
  p(
    'smallest-in-rotated',
    'Smallest in Rotated',
    'medium',
    `A sorted array of distinct integers was rotated left an unknown number of times. Return its smallest value in logarithmic time.

\`\`\`
nums = [12, 18, 2, 5, 9]  ->  2
\`\`\``,
    'function smallestInRotated(nums)',
    [
      { input: [[12, 18, 2, 5, 9]], expected: 2 },
      { input: [[1, 2, 3]], expected: 1 },
      { input: [[4]], expected: 4 },
      { input: [[5, 1, 2, 3, 4]], expected: 1 },
    ],
  ),
  p(
    'search-rotated-sorted',
    'Search a Rotated Array',
    'medium',
    `A sorted array of distinct integers was rotated left an unknown number of times. Return the index of \`target\`, or \`-1\`. Aim for logarithmic time.

\`\`\`
nums = [12, 18, 2, 5, 9], target = 5  ->  3
\`\`\``,
    'function searchRotatedSorted(nums, target)',
    [
      { input: [[12, 18, 2, 5, 9], 5], expected: 3 },
      { input: [[12, 18, 2, 5, 9], 18], expected: 1 },
      { input: [[12, 18, 2, 5, 9], 7], expected: -1 },
      { input: [[], 3], expected: -1 },
    ],
  ),
  p(
    'triples-summing-to-zero',
    'Triples Summing to Zero',
    'medium',
    `Find every unique triple of values that sums to zero.

Sort each triple ascending, and sort the list of triples, so the answer is deterministic. No triple may be repeated.

\`\`\`
nums = [-1, 0, 1, 2, -1, -4]  ->  [[-1, -1, 2], [-1, 0, 1]]
\`\`\``,
    'function triplesSummingToZero(nums)',
    [
      {
        input: [[-1, 0, 1, 2, -1, -4]],
        expected: [
          [-1, -1, 2],
          [-1, 0, 1],
        ],
      },
      { input: [[0, 0, 0, 0]], expected: [[0, 0, 0]] },
      { input: [[1, 2, 3]], expected: [] },
      { input: [[]], expected: [] },
    ],
  ),
  p(
    'largest-water-container',
    'Largest Water Container',
    'medium',
    `Each value is the height of a vertical line at that index. Pick two lines so the rectangle between them holds the most water, and return that area.

Area is the shorter line multiplied by the distance between them.

\`\`\`
heights = [1, 8, 6, 2, 5, 4, 8, 3, 7]  ->  49
\`\`\``,
    'function largestWaterContainer(heights)',
    [
      { input: [[1, 8, 6, 2, 5, 4, 8, 3, 7]], expected: 49 },
      { input: [[1, 1]], expected: 1 },
      { input: [[4, 3, 2, 1, 4]], expected: 16 },
      { input: [[1, 2, 1]], expected: 2 },
    ],
  ),
];
