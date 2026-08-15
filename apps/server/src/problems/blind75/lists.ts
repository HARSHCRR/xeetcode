import { starter, type SeedProblem } from '../types.js';

/**
 * Linked-list problems.
 *
 * Test data stores lists as plain arrays; `argAdapters` / `resultAdapter` tell
 * the harness to build real nodes before calling the solution and to serialize
 * whatever it returns. That keeps these true pointer problems rather than
 * watering them down to array manipulation.
 */
export const LIST_PROBLEMS: SeedProblem[] = [
  {
    slug: 'reverse-a-list',
    title: 'Reverse a List',
    topic: 'linked_list',
    difficulty: 'easy',
    description: `Reverse a singly linked list and return the new head.

A node is \`{ val, next }\`; \`ListNode\` is already defined for you.

\`\`\`
list = 1 -> 2 -> 3  ->  3 -> 2 -> 1
\`\`\``,
    functionSignature: 'function reverseAList(head)',
    starterCode: starter('function reverseAList(head)'),
    argAdapters: ['buildList'],
    resultAdapter: 'listToArray',
    testCases: [
      { input: [[1, 2, 3]], expected: [3, 2, 1] },
      { input: [[]], expected: [] },
      { input: [[7]], expected: [7] },
      { input: [[1, 2]], expected: [2, 1] },
    ],
  },
  {
    slug: 'list-has-a-cycle',
    title: 'List Has a Cycle',
    topic: 'linked_list',
    difficulty: 'easy',
    description: `Decide whether a singly linked list loops back on itself.

The test data builds only straight lists, so a correct answer is always \`false\` here — your solution still needs to terminate rather than assume it.

\`\`\`
list = 1 -> 2 -> 3  ->  false
\`\`\``,
    functionSignature: 'function listHasACycle(head)',
    starterCode: starter('function listHasACycle(head)'),
    argAdapters: ['buildList'],
    testCases: [
      { input: [[1, 2, 3]], expected: false },
      { input: [[]], expected: false },
      { input: [[1]], expected: false },
      { input: [[4, 5]], expected: false },
    ],
  },
  {
    slug: 'merge-two-sorted-lists',
    title: 'Merge Two Sorted Lists',
    topic: 'linked_list',
    difficulty: 'easy',
    description: `Merge two sorted linked lists into one sorted list and return its head.

\`\`\`
a = 1 -> 3, b = 2 -> 4  ->  1 -> 2 -> 3 -> 4
\`\`\``,
    functionSignature: 'function mergeTwoSortedLists(a, b)',
    starterCode: starter('function mergeTwoSortedLists(a, b)'),
    argAdapters: ['buildList', 'buildList'],
    resultAdapter: 'listToArray',
    testCases: [
      { input: [[1, 3], [2, 4]], expected: [1, 2, 3, 4] },
      { input: [[], []], expected: [] },
      { input: [[], [1]], expected: [1] },
      { input: [[1, 2, 4], [1, 3, 4]], expected: [1, 1, 2, 3, 4, 4] },
    ],
  },
  {
    slug: 'merge-many-sorted-lists',
    title: 'Merge Many Sorted Lists',
    topic: 'linked_list',
    difficulty: 'hard',
    description: `Merge an array of sorted linked lists into one sorted list and return its head.

\`\`\`
lists = [1 -> 4, 2 -> 6, 3]  ->  1 -> 2 -> 3 -> 4 -> 6
\`\`\``,
    functionSignature: 'function mergeManySortedLists(lists)',
    starterCode: starter('function mergeManySortedLists(lists)'),
    argAdapters: ['buildLists'],
    resultAdapter: 'listToArray',
    testCases: [
      {
        input: [
          [
            [1, 4],
            [2, 6],
            [3],
          ],
        ],
        expected: [1, 2, 3, 4, 6],
      },
      { input: [[]], expected: [] },
      { input: [[[]]], expected: [] },
      {
        input: [
          [
            [1, 2],
            [1, 2],
          ],
        ],
        expected: [1, 1, 2, 2],
      },
    ],
  },
  {
    slug: 'drop-nth-from-end',
    title: 'Drop Nth From End',
    topic: 'linked_list',
    difficulty: 'medium',
    description: `Remove the \`n\`th node counting from the end and return the head.

\`\`\`
list = 1 -> 2 -> 3 -> 4 -> 5, n = 2  ->  1 -> 2 -> 3 -> 5
\`\`\``,
    functionSignature: 'function dropNthFromEnd(head, n)',
    starterCode: starter('function dropNthFromEnd(head, n)'),
    argAdapters: ['buildList', null],
    resultAdapter: 'listToArray',
    testCases: [
      { input: [[1, 2, 3, 4, 5], 2], expected: [1, 2, 3, 5] },
      { input: [[1], 1], expected: [] },
      { input: [[1, 2], 1], expected: [1] },
      { input: [[1, 2], 2], expected: [2] },
    ],
  },
  {
    slug: 'weave-list-ends',
    title: 'Weave List Ends',
    topic: 'linked_list',
    difficulty: 'medium',
    description: `Reorder a list so it alternates first, last, second, second-to-last, and so on. Return the head.

\`\`\`
list = 1 -> 2 -> 3 -> 4  ->  1 -> 4 -> 2 -> 3
\`\`\``,
    functionSignature: 'function weaveListEnds(head)',
    starterCode: starter('function weaveListEnds(head)'),
    argAdapters: ['buildList'],
    resultAdapter: 'listToArray',
    testCases: [
      { input: [[1, 2, 3, 4]], expected: [1, 4, 2, 3] },
      { input: [[1, 2, 3, 4, 5]], expected: [1, 5, 2, 4, 3] },
      { input: [[]], expected: [] },
      { input: [[1]], expected: [1] },
    ],
  },
];
