import type { Difficulty, ProblemTopic, TestCase } from '@xeetcode/shared';

/**
 * The seed problem bank.
 *
 * These are well-known DSA exercises, but every description, signature, and
 * test case here is written from scratch for this project — nothing is copied
 * from LeetCode or any other source.
 *
 * Each problem needs enough tests to catch the obvious wrong answers: an empty
 * or single-element input, a case that defeats a naive greedy approach, and at
 * least one larger case where an O(n^2) solution is still correct but the
 * answer isn't guessable.
 */
export interface SeedProblem {
  slug: string;
  title: string;
  topic: ProblemTopic;
  difficulty: Difficulty;
  /** Markdown. */
  description: string;
  functionSignature: string;
  starterCode: string;
  testCases: TestCase[];
}

export const PROBLEM_BANK: SeedProblem[] = [
  // -------------------------------------------------------------------------
  // Arrays
  // -------------------------------------------------------------------------
  {
    slug: 'pair-sums-to-target',
    title: 'Pair Sums to Target',
    topic: 'arrays',
    difficulty: 'easy',
    description: `Given an array of integers and a target value, find the two positions whose values add up to the target.

Return the two indices as an array in increasing order. Exactly one pair will work, and you may not reuse the same position twice.

**Example**

\`\`\`
nums = [4, 7, 1, 9], target = 5
-> [0, 2]     because 4 + 1 = 5
\`\`\``,
    functionSignature: 'function pairSumsToTarget(nums, target)',
    starterCode: `function pairSumsToTarget(nums, target) {
  // your code here
}`,
    testCases: [
      { input: [[4, 7, 1, 9], 8], expected: [1, 2] },
      { input: [[3, 3], 6], expected: [0, 1] },
      { input: [[-2, 5, 11, -6], -8], expected: [0, 3] },
      { input: [[0, 4, 3, 0], 0], expected: [0, 3] },
      { input: [[10, 20, 30, 40, 50], 90], expected: [3, 4] },
    ],
  },
  {
    slug: 'best-single-trade',
    title: 'Best Single Trade',
    topic: 'arrays',
    difficulty: 'easy',
    description: `You are given daily prices of a stock, in order. Buy on one day and sell on a strictly later day.

Return the largest profit possible. If no trade can make a profit, return \`0\`.

**Example**

\`\`\`
prices = [8, 3, 6, 1, 9]
-> 8          buy at 1, sell at 9
\`\`\``,
    functionSignature: 'function bestSingleTrade(prices)',
    starterCode: `function bestSingleTrade(prices) {
  // your code here
}`,
    testCases: [
      { input: [[8, 3, 6, 1, 9]], expected: 8 },
      { input: [[9, 8, 7, 6]], expected: 0 },
      { input: [[5]], expected: 0 },
      { input: [[]], expected: 0 },
      { input: [[2, 4, 1, 7, 3, 9]], expected: 8 },
    ],
  },
  {
    slug: 'largest-run-sum',
    title: 'Largest Run Sum',
    topic: 'arrays',
    difficulty: 'medium',
    description: `Given an array of integers, find the contiguous run of one or more elements with the largest sum, and return that sum.

The array may be entirely negative, in which case the answer is the least-negative single element.

**Example**

\`\`\`
nums = [2, -5, 4, -1, 3, -2]
-> 6          the run [4, -1, 3]
\`\`\``,
    functionSignature: 'function largestRunSum(nums)',
    starterCode: `function largestRunSum(nums) {
  // your code here
}`,
    testCases: [
      { input: [[2, -5, 4, -1, 3, -2]], expected: 6 },
      { input: [[-4, -2, -9]], expected: -2 },
      { input: [[7]], expected: 7 },
      { input: [[1, 2, 3, 4]], expected: 10 },
      { input: [[-1, 5, -3, 5, -1]], expected: 7 },
    ],
  },
  {
    slug: 'shift-zeros-back',
    title: 'Shift Zeros Back',
    topic: 'arrays',
    difficulty: 'easy',
    description: `Move every zero in the array to the end, keeping all non-zero values in their original relative order.

Return the resulting array.

**Example**

\`\`\`
nums = [1, 0, 3, 0, 0, 8]
-> [1, 3, 8, 0, 0, 0]
\`\`\``,
    functionSignature: 'function shiftZerosBack(nums)',
    starterCode: `function shiftZerosBack(nums) {
  // your code here
}`,
    testCases: [
      { input: [[1, 0, 3, 0, 0, 8]], expected: [1, 3, 8, 0, 0, 0] },
      { input: [[0, 0, 0]], expected: [0, 0, 0] },
      { input: [[4, 5, 6]], expected: [4, 5, 6] },
      { input: [[]], expected: [] },
      { input: [[0, -1, 0, 2]], expected: [-1, 2, 0, 0] },
    ],
  },
  {
    slug: 'product-of-the-rest',
    title: 'Product of the Rest',
    topic: 'arrays',
    difficulty: 'medium',
    description: `For each position in the array, compute the product of every *other* element.

Return the array of those products. Solve it without using division.

**Example**

\`\`\`
nums = [2, 3, 4]
-> [12, 8, 6]
\`\`\``,
    functionSignature: 'function productOfTheRest(nums)',
    starterCode: `function productOfTheRest(nums) {
  // your code here
}`,
    testCases: [
      { input: [[2, 3, 4]], expected: [12, 8, 6] },
      { input: [[1, 2, 3, 4]], expected: [24, 12, 8, 6] },
      { input: [[5, 0]], expected: [0, 5] },
      { input: [[0, 0, 3]], expected: [0, 0, 0] },
      { input: [[-2, 3, -4]], expected: [-12, 8, -6] },
    ],
  },
  {
    slug: 'find-the-repeat',
    title: 'Find the Repeat',
    topic: 'arrays',
    difficulty: 'easy',
    description: `An array holds \`n + 1\` integers, each between \`1\` and \`n\`. By the pigeonhole principle at least one value must repeat.

Exactly one value repeats — though it may appear more than twice. Return that value.

**Example**

\`\`\`
nums = [3, 1, 4, 2, 4]
-> 4
\`\`\``,
    functionSignature: 'function findTheRepeat(nums)',
    starterCode: `function findTheRepeat(nums) {
  // your code here
}`,
    testCases: [
      { input: [[3, 1, 4, 2, 4]], expected: 4 },
      { input: [[1, 1]], expected: 1 },
      { input: [[2, 5, 3, 5, 1, 4]], expected: 5 },
      { input: [[1, 3, 3, 3, 2]], expected: 3 },
      { input: [[6, 1, 2, 3, 4, 5, 6]], expected: 6 },
    ],
  },
  {
    slug: 'merge-overlapping-spans',
    title: 'Merge Overlapping Spans',
    topic: 'arrays',
    difficulty: 'medium',
    description: `Given a list of \`[start, end]\` spans, merge every group that overlaps or touches, and return the merged list sorted by start.

Two spans overlap when one begins at or before the other ends.

**Example**

\`\`\`
spans = [[1, 4], [7, 9], [3, 5]]
-> [[1, 5], [7, 9]]
\`\`\``,
    functionSignature: 'function mergeOverlappingSpans(spans)',
    starterCode: `function mergeOverlappingSpans(spans) {
  // your code here
}`,
    testCases: [
      {
        input: [
          [
            [1, 4],
            [7, 9],
            [3, 5],
          ],
        ],
        expected: [
          [1, 5],
          [7, 9],
        ],
      },
      {
        input: [
          [
            [1, 2],
            [2, 3],
          ],
        ],
        expected: [[1, 3]],
      },
      { input: [[[5, 6]]], expected: [[5, 6]] },
      {
        input: [
          [
            [8, 10],
            [1, 3],
            [2, 6],
            [15, 18],
          ],
        ],
        expected: [
          [1, 6],
          [8, 10],
          [15, 18],
        ],
      },
      {
        input: [
          [
            [1, 10],
            [2, 3],
            [4, 5],
          ],
        ],
        expected: [[1, 10]],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // Strings
  // -------------------------------------------------------------------------
  {
    slug: 'clean-palindrome-check',
    title: 'Clean Palindrome Check',
    topic: 'strings',
    difficulty: 'easy',
    description: `Decide whether a string reads the same forwards and backwards, considering only letters and digits and ignoring case.

Return \`true\` or \`false\`.

**Example**

\`\`\`
s = "Red rum, sir, is murder!"
-> true
\`\`\``,
    functionSignature: 'function cleanPalindromeCheck(s)',
    starterCode: `function cleanPalindromeCheck(s) {
  // your code here
}`,
    testCases: [
      { input: ['Red rum, sir, is murder!'], expected: true },
      { input: ['hello'], expected: false },
      { input: [''], expected: true },
      { input: ['A1b  2 c1a'], expected: false },
      { input: ['Was it a car or a cat I saw?'], expected: true },
    ],
  },
  {
    slug: 'longest-unique-window',
    title: 'Longest Unique Window',
    topic: 'strings',
    difficulty: 'medium',
    description: `Find the length of the longest stretch of consecutive characters in which no character repeats.

**Example**

\`\`\`
s = "abcabcbb"
-> 3          the window "abc"
\`\`\``,
    functionSignature: 'function longestUniqueWindow(s)',
    starterCode: `function longestUniqueWindow(s) {
  // your code here
}`,
    testCases: [
      { input: ['abcabcbb'], expected: 3 },
      { input: ['bbbbb'], expected: 1 },
      { input: [''], expected: 0 },
      { input: ['pwwkew'], expected: 3 },
      { input: ['dvdf'], expected: 3 },
    ],
  },
  {
    slug: 'same-letters-reordered',
    title: 'Same Letters, Reordered',
    topic: 'strings',
    difficulty: 'easy',
    description: `Decide whether two strings use exactly the same letters with the same counts, just in a different order.

Return \`true\` or \`false\`. Comparison is case-sensitive.

**Example**

\`\`\`
a = "listen", b = "silent"
-> true
\`\`\``,
    functionSignature: 'function sameLettersReordered(a, b)',
    starterCode: `function sameLettersReordered(a, b) {
  // your code here
}`,
    testCases: [
      { input: ['listen', 'silent'], expected: true },
      { input: ['rat', 'car'], expected: false },
      { input: ['', ''], expected: true },
      { input: ['aabb', 'abab'], expected: true },
      { input: ['Abc', 'abc'], expected: false },
    ],
  },
  {
    slug: 'first-unrepeated-character',
    title: 'First Unrepeated Character',
    topic: 'strings',
    difficulty: 'easy',
    description: `Return the index of the first character that appears exactly once in the string.

If every character repeats, return \`-1\`.

**Example**

\`\`\`
s = "swiss"
-> 1          'w' is the first character that never repeats
\`\`\``,
    functionSignature: 'function firstUnrepeatedCharacter(s)',
    starterCode: `function firstUnrepeatedCharacter(s) {
  // your code here
}`,
    testCases: [
      { input: ['swiss'], expected: 1 },
      { input: ['aabb'], expected: -1 },
      { input: ['x'], expected: 0 },
      { input: [''], expected: -1 },
      { input: ['aabbcdd'], expected: 4 },
    ],
  },
  {
    slug: 'collapse-repeats',
    title: 'Collapse Repeats',
    topic: 'strings',
    difficulty: 'easy',
    description: `Compress a string by replacing each run of the same character with that character followed by the run length.

If the compressed form is not strictly shorter than the original, return the original unchanged.

**Example**

\`\`\`
s = "aaaabbc"
-> "a4b2c1"

s = "abc"
-> "abc"      because "a1b1c1" is longer
\`\`\``,
    functionSignature: 'function collapseRepeats(s)',
    starterCode: `function collapseRepeats(s) {
  // your code here
}`,
    testCases: [
      { input: ['aaaabbc'], expected: 'a4b2c1' },
      { input: ['abc'], expected: 'abc' },
      { input: [''], expected: '' },
      { input: ['aabb'], expected: 'aabb' },
      { input: ['wwwwwwwwwwww'], expected: 'w12' },
    ],
  },
  {
    slug: 'reverse-word-order',
    title: 'Reverse Word Order',
    topic: 'strings',
    difficulty: 'easy',
    description: `Reverse the order of words in a sentence.

Words are separated by one or more spaces. The result must have exactly one space between words and no leading or trailing spaces.

**Example**

\`\`\`
s = "  the   sky is  blue "
-> "blue is sky the"
\`\`\``,
    functionSignature: 'function reverseWordOrder(s)',
    starterCode: `function reverseWordOrder(s) {
  // your code here
}`,
    testCases: [
      { input: ['  the   sky is  blue '], expected: 'blue is sky the' },
      { input: ['hello'], expected: 'hello' },
      { input: ['   '], expected: '' },
      { input: ['a b'], expected: 'b a' },
      { input: ['one  two   three'], expected: 'three two one' },
    ],
  },
  {
    slug: 'balanced-brackets',
    title: 'Balanced Brackets',
    topic: 'strings',
    difficulty: 'medium',
    description: `A string contains only the characters \`()[]{}\`. Decide whether every bracket is closed by the matching type, in the correct order.

Return \`true\` or \`false\`.

**Example**

\`\`\`
s = "{[()]}"
-> true

s = "([)]"
-> false
\`\`\``,
    functionSignature: 'function balancedBrackets(s)',
    starterCode: `function balancedBrackets(s) {
  // your code here
}`,
    testCases: [
      { input: ['{[()]}'], expected: true },
      { input: ['([)]'], expected: false },
      { input: [''], expected: true },
      { input: ['('], expected: false },
      { input: ['(){}[]'], expected: true },
    ],
  },
  {
    slug: 'group-by-letters',
    title: 'Group by Letters',
    topic: 'strings',
    difficulty: 'medium',
    description: `Group words that are rearrangements of each other.

Return an array of groups. Sort each group alphabetically, then sort the groups by their first word, so the result is deterministic.

**Example**

\`\`\`
words = ["tab", "bat", "cat", "act"]
-> [["act", "cat"], ["bat", "tab"]]
\`\`\``,
    functionSignature: 'function groupByLetters(words)',
    starterCode: `function groupByLetters(words) {
  // your code here
}`,
    testCases: [
      {
        input: [['tab', 'bat', 'cat', 'act']],
        expected: [
          ['act', 'cat'],
          ['bat', 'tab'],
        ],
      },
      { input: [[]], expected: [] },
      { input: [['solo']], expected: [['solo']] },
      {
        input: [['ab', 'ba', 'abc']],
        expected: [['ab', 'ba'], ['abc']],
      },
      {
        input: [['x', 'y', 'x']],
        expected: [['x', 'x'], ['y']],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // Binary Search
  // -------------------------------------------------------------------------
  {
    slug: 'locate-in-sorted',
    title: 'Locate in Sorted',
    topic: 'binary_search',
    difficulty: 'easy',
    description: `Given a sorted array of distinct integers and a target, return the index of the target.

If it is not present, return \`-1\`. Your solution must run in logarithmic time.

**Example**

\`\`\`
nums = [-3, 0, 4, 9, 21], target = 9
-> 3
\`\`\``,
    functionSignature: 'function locateInSorted(nums, target)',
    starterCode: `function locateInSorted(nums, target) {
  // your code here
}`,
    testCases: [
      { input: [[-3, 0, 4, 9, 21], 9], expected: 3 },
      { input: [[-3, 0, 4, 9, 21], 5], expected: -1 },
      { input: [[], 1], expected: -1 },
      { input: [[7], 7], expected: 0 },
      { input: [[1, 2, 3, 4, 5, 6], 1], expected: 0 },
    ],
  },
  {
    slug: 'insertion-point',
    title: 'Insertion Point',
    topic: 'binary_search',
    difficulty: 'easy',
    description: `Given a sorted array of distinct integers and a target, return the index where the target is — or where it would need to be inserted to keep the array sorted.

**Example**

\`\`\`
nums = [1, 3, 5, 6], target = 2
-> 1
\`\`\``,
    functionSignature: 'function insertionPoint(nums, target)',
    starterCode: `function insertionPoint(nums, target) {
  // your code here
}`,
    testCases: [
      { input: [[1, 3, 5, 6], 2], expected: 1 },
      { input: [[1, 3, 5, 6], 7], expected: 4 },
      { input: [[1, 3, 5, 6], 0], expected: 0 },
      { input: [[], 4], expected: 0 },
      { input: [[1, 3, 5, 6], 5], expected: 2 },
    ],
  },
  {
    slug: 'span-of-a-value',
    title: 'Span of a Value',
    topic: 'binary_search',
    difficulty: 'medium',
    description: `A sorted array may contain a value several times. Return the first and last index of the target as \`[first, last]\`.

If the target is absent, return \`[-1, -1]\`. Aim for logarithmic time.

**Example**

\`\`\`
nums = [2, 4, 4, 4, 7], target = 4
-> [1, 3]
\`\`\``,
    functionSignature: 'function spanOfAValue(nums, target)',
    starterCode: `function spanOfAValue(nums, target) {
  // your code here
}`,
    testCases: [
      { input: [[2, 4, 4, 4, 7], 4], expected: [1, 3] },
      { input: [[2, 4, 4, 4, 7], 5], expected: [-1, -1] },
      { input: [[], 1], expected: [-1, -1] },
      { input: [[6], 6], expected: [0, 0] },
      { input: [[1, 1, 1, 1], 1], expected: [0, 3] },
    ],
  },
  {
    slug: 'smallest-in-rotated',
    title: 'Smallest in Rotated',
    topic: 'binary_search',
    difficulty: 'medium',
    description: `A sorted array of distinct integers has been rotated left an unknown number of times. Return its smallest value.

Aim for logarithmic time.

**Example**

\`\`\`
nums = [12, 18, 2, 5, 9]
-> 2
\`\`\``,
    functionSignature: 'function smallestInRotated(nums)',
    starterCode: `function smallestInRotated(nums) {
  // your code here
}`,
    testCases: [
      { input: [[12, 18, 2, 5, 9]], expected: 2 },
      { input: [[1, 2, 3]], expected: 1 },
      { input: [[4]], expected: 4 },
      { input: [[5, 1, 2, 3, 4]], expected: 1 },
      { input: [[2, 3, 4, 5, 1]], expected: 1 },
    ],
  },
  {
    slug: 'integer-square-root',
    title: 'Integer Square Root',
    topic: 'binary_search',
    difficulty: 'easy',
    description: `Given a non-negative integer, return the largest integer whose square is not greater than it — the square root, rounded down.

Do not use \`Math.sqrt\`.

**Example**

\`\`\`
n = 20
-> 4          because 4*4 = 16 <= 20 < 25
\`\`\``,
    functionSignature: 'function integerSquareRoot(n)',
    starterCode: `function integerSquareRoot(n) {
  // your code here
}`,
    testCases: [
      { input: [20], expected: 4 },
      { input: [0], expected: 0 },
      { input: [1], expected: 1 },
      { input: [49], expected: 7 },
      { input: [2147395600], expected: 46340 },
    ],
  },
  {
    slug: 'search-rotated-sorted',
    title: 'Search a Rotated Array',
    topic: 'binary_search',
    difficulty: 'medium',
    description: `A sorted array of distinct integers has been rotated left an unknown number of times. Given a target, return its index, or \`-1\` if it is absent.

Aim for logarithmic time.

**Example**

\`\`\`
nums = [12, 18, 2, 5, 9], target = 5
-> 3
\`\`\``,
    functionSignature: 'function searchRotatedSorted(nums, target)',
    starterCode: `function searchRotatedSorted(nums, target) {
  // your code here
}`,
    testCases: [
      { input: [[12, 18, 2, 5, 9], 5], expected: 3 },
      { input: [[12, 18, 2, 5, 9], 18], expected: 1 },
      { input: [[12, 18, 2, 5, 9], 7], expected: -1 },
      { input: [[], 3], expected: -1 },
      { input: [[1, 2, 3, 4, 5], 5], expected: 4 },
    ],
  },
];
