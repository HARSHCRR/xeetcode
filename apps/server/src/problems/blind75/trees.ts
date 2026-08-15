import { starter, type SeedProblem } from '../types.js';

/** Trees arrive as level-order arrays with `null` holes; the harness builds nodes. */
const t = (
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
  topic: 'trees',
  difficulty,
  description,
  functionSignature: signature,
  starterCode: starter(signature),
  argAdapters: ['buildTree'],
  testCases,
  ...extra,
});

const NODE_NOTE = `A node is \`{ val, left, right }\`; \`TreeNode\` is already defined for you.`;

export const TREE_PROBLEMS: SeedProblem[] = [
  t(
    'tree-depth',
    'Tree Depth',
    'easy',
    `Return the number of nodes on the longest path from the root down to a leaf.

${NODE_NOTE}

\`\`\`
tree = [3, 9, 20, null, null, 15, 7]  ->  3
\`\`\``,
    'function treeDepth(root)',
    [
      { input: [[3, 9, 20, null, null, 15, 7]], expected: 3 },
      { input: [[]], expected: 0 },
      { input: [[1]], expected: 1 },
      { input: [[1, 2, null, 3]], expected: 3 },
    ],
  ),
  t(
    'trees-are-identical',
    'Trees Are Identical',
    'easy',
    `Decide whether two trees have the same shape and the same values.

${NODE_NOTE}

\`\`\`
a = [1, 2, 3], b = [1, 2, 3]  ->  true
\`\`\``,
    'function treesAreIdentical(a, b)',
    [
      { input: [[1, 2, 3], [1, 2, 3]], expected: true },
      { input: [[1, 2], [1, null, 2]], expected: false },
      { input: [[], []], expected: true },
      { input: [[1, 2, 1], [1, 1, 2]], expected: false },
    ],
    { argAdapters: ['buildTree', 'buildTree'] },
  ),
  t(
    'mirror-a-tree',
    'Mirror a Tree',
    'easy',
    `Swap every node's left and right child, top to bottom, and return the root.

${NODE_NOTE}

\`\`\`
tree = [4, 2, 7]  ->  [4, 7, 2]
\`\`\``,
    'function mirrorATree(root)',
    [
      { input: [[4, 2, 7]], expected: [4, 7, 2] },
      { input: [[]], expected: [] },
      { input: [[1, 2]], expected: [1, null, 2] },
      { input: [[4, 2, 7, 1, 3, 6, 9]], expected: [4, 7, 2, 9, 6, 3, 1] },
    ],
    { resultAdapter: 'treeToArray' },
  ),
  t(
    'best-path-sum',
    'Best Path Sum',
    'hard',
    `A path is any chain of connected nodes; it need not pass through the root. Return the largest sum any path can reach.

${NODE_NOTE}

\`\`\`
tree = [-10, 9, 20, null, null, 15, 7]  ->  42
\`\`\``,
    'function bestPathSum(root)',
    [
      { input: [[-10, 9, 20, null, null, 15, 7]], expected: 42 },
      { input: [[1, 2, 3]], expected: 6 },
      { input: [[-3]], expected: -3 },
      { input: [[2, -1]], expected: 2 },
    ],
  ),
  t(
    'values-by-level',
    'Values by Level',
    'medium',
    `Return the node values level by level, top to bottom, each level left to right.

${NODE_NOTE}

\`\`\`
tree = [3, 9, 20, null, null, 15, 7]  ->  [[3], [9, 20], [15, 7]]
\`\`\``,
    'function valuesByLevel(root)',
    [
      { input: [[3, 9, 20, null, null, 15, 7]], expected: [[3], [9, 20], [15, 7]] },
      { input: [[]], expected: [] },
      { input: [[1]], expected: [[1]] },
      { input: [[1, 2, 3, 4]], expected: [[1], [2, 3], [4]] },
    ],
  ),
  t(
    'flatten-and-rebuild',
    'Flatten and Rebuild',
    'hard',
    `Write \`flattenAndRebuild(root)\` that serialises a tree to a string and rebuilds it, returning the reconstructed root.

Any node value may appear, so a format that cannot tell values from structure will not survive the round trip.

${NODE_NOTE}

\`\`\`
tree = [1, 2, 3, null, null, 4, 5]  ->  same tree back
\`\`\``,
    'function flattenAndRebuild(root)',
    [
      { input: [[1, 2, 3, null, null, 4, 5]], expected: [1, 2, 3, null, null, 4, 5] },
      { input: [[]], expected: [] },
      { input: [[1]], expected: [1] },
      { input: [[1, null, 2]], expected: [1, null, 2] },
    ],
    { resultAdapter: 'treeToArray' },
  ),
  t(
    'contains-subtree',
    'Contains Subtree',
    'easy',
    `Decide whether \`tree\` contains a subtree identical in shape and values to \`part\`.

${NODE_NOTE}

\`\`\`
tree = [3, 4, 5, 1, 2], part = [4, 1, 2]  ->  true
\`\`\``,
    'function containsSubtree(tree, part)',
    [
      { input: [[3, 4, 5, 1, 2], [4, 1, 2]], expected: true },
      { input: [[3, 4, 5, 1, 2, null, null, null, null, 0], [4, 1, 2]], expected: false },
      { input: [[1], [1]], expected: true },
      { input: [[], [1]], expected: false },
    ],
    { argAdapters: ['buildTree', 'buildTree'] },
  ),
  t(
    'rebuild-from-orders',
    'Rebuild From Orders',
    'medium',
    `Given a tree's preorder and inorder traversals, rebuild the tree and return its root. All values are distinct.

${NODE_NOTE}

\`\`\`
preorder = [3, 9, 20, 15, 7], inorder = [9, 3, 15, 20, 7]
  ->  [3, 9, 20, null, null, 15, 7]
\`\`\``,
    'function rebuildFromOrders(preorder, inorder)',
    [
      {
        input: [
          [3, 9, 20, 15, 7],
          [9, 3, 15, 20, 7],
        ],
        expected: [3, 9, 20, null, null, 15, 7],
      },
      { input: [[], []], expected: [] },
      { input: [[1], [1]], expected: [1] },
      { input: [[1, 2], [2, 1]], expected: [1, 2] },
    ],
    { argAdapters: [null, null], resultAdapter: 'treeToArray' },
  ),
  t(
    'is-a-search-tree',
    'Is a Search Tree',
    'medium',
    `Decide whether a tree is a valid binary search tree: every value in a node's left subtree is smaller, every value on the right is larger, throughout.

${NODE_NOTE}

\`\`\`
tree = [2, 1, 3]  ->  true
tree = [5, 1, 4, null, null, 3, 6]  ->  false
\`\`\``,
    'function isASearchTree(root)',
    [
      { input: [[2, 1, 3]], expected: true },
      { input: [[5, 1, 4, null, null, 3, 6]], expected: false },
      { input: [[]], expected: true },
      { input: [[2, 2]], expected: false },
    ],
  ),
  t(
    'kth-smallest-in-bst',
    'Kth Smallest in a BST',
    'medium',
    `Return the \`k\`th smallest value in a binary search tree, counting from 1.

${NODE_NOTE}

\`\`\`
tree = [3, 1, 4, null, 2], k = 1  ->  1
\`\`\``,
    'function kthSmallestInBst(root, k)',
    [
      { input: [[3, 1, 4, null, 2], 1], expected: 1 },
      { input: [[5, 3, 6, 2, 4, null, null, 1], 3], expected: 3 },
      { input: [[1], 1], expected: 1 },
      { input: [[3, 1, 4, null, 2], 4], expected: 4 },
    ],
    { argAdapters: ['buildTree', null] },
  ),
  t(
    'shared-ancestor-in-bst',
    'Shared Ancestor in a BST',
    'medium',
    `In a binary search tree, return the value of the deepest node that has both \`a\` and \`b\` somewhere beneath it. A node counts as its own descendant.

${NODE_NOTE}

\`\`\`
tree = [6, 2, 8, 0, 4, 7, 9], a = 2, b = 8  ->  6
\`\`\``,
    'function sharedAncestorInBst(root, a, b)',
    [
      { input: [[6, 2, 8, 0, 4, 7, 9], 2, 8], expected: 6 },
      { input: [[6, 2, 8, 0, 4, 7, 9], 2, 4], expected: 2 },
      { input: [[2, 1], 2, 1], expected: 2 },
      { input: [[6, 2, 8, 0, 4, 7, 9], 0, 4], expected: 2 },
    ],
    { argAdapters: ['buildTree', null, null] },
  ),
  {
    slug: 'prefix-tree-lookups',
    title: 'Prefix Tree Lookups',
    topic: 'trees',
    difficulty: 'medium',
    description: `Build a prefix tree from \`words\`, then answer each query.

A query is \`["insert", w]\`, \`["search", w]\` (exact word present?), or \`["startsWith", p]\` (any word with that prefix?). Return the answers to the \`search\` and \`startsWith\` queries in order.

\`\`\`
words = ["apple"], queries = [["search", "app"], ["startsWith", "app"]]
  ->  [false, true]
\`\`\``,
    functionSignature: 'function prefixTreeLookups(words, queries)',
    starterCode: starter('function prefixTreeLookups(words, queries)'),
    testCases: [
      {
        input: [
          ['apple'],
          [
            ['search', 'app'],
            ['startsWith', 'app'],
          ],
        ],
        expected: [false, true],
      },
      {
        input: [
          [],
          [
            ['insert', 'dog'],
            ['search', 'dog'],
            ['startsWith', 'do'],
          ],
        ],
        expected: [true, true],
      },
      { input: [['a'], [['search', 'b']]], expected: [false] },
      {
        input: [
          ['car', 'card'],
          [
            ['search', 'car'],
            ['search', 'ca'],
            ['startsWith', 'card'],
          ],
        ],
        expected: [true, false, true],
      },
    ],
  },
  {
    slug: 'wildcard-word-search',
    title: 'Wildcard Word Search',
    topic: 'trees',
    difficulty: 'medium',
    description: `Store \`words\`, then answer each pattern. A pattern may contain \`.\`, which matches any single character. Return one boolean per pattern.

\`\`\`
words = ["bad", "dad"], patterns = ["pad", ".ad", "b.."]
  ->  [false, true, true]
\`\`\``,
    functionSignature: 'function wildcardWordSearch(words, patterns)',
    starterCode: starter('function wildcardWordSearch(words, patterns)'),
    testCases: [
      { input: [['bad', 'dad'], ['pad', '.ad', 'b..']], expected: [false, true, true] },
      { input: [[], ['a']], expected: [false] },
      { input: [['a'], ['.']], expected: [true] },
      { input: [['abc'], ['ab', 'abc.']], expected: [false, false] },
    ],
  },
  {
    slug: 'find-words-in-grid',
    title: 'Find Words in Grid',
    topic: 'trees',
    difficulty: 'hard',
    description: `Return every word from \`words\` that can be spelled by walking the grid between adjacent cells (up, down, left, right), never reusing a cell within one word.

Order does not matter.

\`\`\`
grid = [["o","a"],["e","t"]], words = ["oat", "eat"]  ->  ["oat"]
\`\`\``,
    functionSignature: 'function findWordsInGrid(grid, words)',
    starterCode: starter('function findWordsInGrid(grid, words)'),
    unorderedResult: true,
    testCases: [
      {
        input: [
          [
            ['o', 'a'],
            ['e', 't'],
          ],
          ['oat', 'eat'],
        ],
        expected: ['oat'],
      },
      { input: [[['a']], ['a', 'b']], expected: ['a'] },
      { input: [[], ['x']], expected: [] },
      {
        input: [
          [
            ['a', 'b'],
            ['c', 'd'],
          ],
          ['abdc', 'acdb'],
        ],
        expected: ['abdc', 'acdb'],
      },
    ],
  },
];
