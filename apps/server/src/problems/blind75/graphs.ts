import { starter, type SeedProblem } from "../types.js";

const g = (
  slug: string,
  title: string,
  difficulty: SeedProblem["difficulty"],
  description: string,
  signature: string,
  testCases: SeedProblem["testCases"],
  extra: Partial<SeedProblem> = {},
): SeedProblem => ({
  slug,
  title,
  topic: "graphs",
  difficulty,
  description,
  functionSignature: signature,
  starterCode: starter(signature),
  testCases,
  ...extra,
});

export const GRAPH_PROBLEMS: SeedProblem[] = [
  g(
    "copy-adjacency",
    "Copy an Adjacency List",
    "medium",
    `A graph is given as an adjacency list: \`graph[i]\` holds the neighbours of node \`i\`. Return a deep copy — a new structure with the same connections, sharing no arrays with the original.

\`\`\`
graph = [[1], [0]]  ->  [[1], [0]]
\`\`\``,
    "function copyAdjacency(graph)",
    [
      { input: [[[1], [0]]], expected: [[1], [0]] },
      { input: [[]], expected: [] },
      { input: [[[]]], expected: [[]] },
      { input: [[[1, 2], [0], [0]]], expected: [[1, 2], [0], [0]] },
    ],
  ),
  g(
    "can-finish-courses",
    "Can Finish Courses",
    "medium",
    `\`prerequisites[i] = [a, b]\` means course \`a\` requires course \`b\` first. Decide whether all \`n\` courses can be completed.

\`\`\`
n = 2, prerequisites = [[1, 0]]  ->  true
n = 2, prerequisites = [[1, 0], [0, 1]]  ->  false
\`\`\``,
    "function canFinishCourses(n, prerequisites)",
    [
      { input: [2, [[1, 0]]], expected: true },
      {
        input: [
          2,
          [
            [1, 0],
            [0, 1],
          ],
        ],
        expected: false,
      },
      { input: [1, []], expected: true },
      {
        input: [
          3,
          [
            [1, 0],
            [2, 1],
          ],
        ],
        expected: true,
      },
    ],
  ),
  g(
    "cells-reaching-both-edges",
    "Cells Reaching Both Edges",
    "medium",
    `Water flows from a cell to an equal-or-lower neighbour (up, down, left, right). The top and left edges border one ocean; the bottom and right edges border another.

Return every \`[row, col]\` from which water can reach both oceans. Order does not matter.

\`\`\`
heights = [[1, 2], [4, 3]]  ->  [[0,1],[1,0],[1,1]]
\`\`\``,
    "function cellsReachingBothEdges(heights)",
    [
      {
        input: [
          [
            [1, 2],
            [4, 3],
          ],
        ],
        expected: [
          [0, 1],
          [1, 0],
          [1, 1],
        ],
      },
      { input: [[[1]]], expected: [[0, 0]] },
      { input: [[]], expected: [] },
      {
        input: [
          [
            [1, 1],
            [1, 1],
          ],
        ],
        expected: [
          [0, 0],
          [0, 1],
          [1, 0],
          [1, 1],
        ],
      },
    ],
    { unorderedResult: true },
  ),
  g(
    "count-islands",
    "Count Islands",
    "medium",
    `The grid holds \`"1"\` for land and \`"0"\` for water. An island is land connected horizontally or vertically. Return how many islands there are.

\`\`\`
grid = [["1","1","0"],["0","1","0"],["0","0","1"]]  ->  2
\`\`\``,
    "function countIslands(grid)",
    [
      {
        input: [
          [
            ["1", "1", "0"],
            ["0", "1", "0"],
            ["0", "0", "1"],
          ],
        ],
        expected: 2,
      },
      { input: [[]], expected: 0 },
      { input: [[["0"]]], expected: 0 },
      {
        input: [
          [
            ["1", "0"],
            ["0", "1"],
          ],
        ],
        expected: 2,
      },
    ],
  ),
  g(
    "longest-consecutive-streak",
    "Longest Consecutive Streak",
    "medium",
    `Return the length of the longest run of consecutive integers present in the array, in any order.

\`\`\`
nums = [100, 4, 200, 1, 3, 2]  ->  4
\`\`\``,
    "function longestConsecutiveStreak(nums)",
    [
      { input: [[100, 4, 200, 1, 3, 2]], expected: 4 },
      { input: [[]], expected: 0 },
      { input: [[1, 1, 1]], expected: 1 },
      { input: [[9, 1, 4, 7, 3, 2, 6, 8]], expected: 4 },
    ],
  ),
  g(
    "order-alien-alphabet",
    "Order an Alien Alphabet",
    "hard",
    `Words are sorted by an unknown alphabet. Work out a letter order consistent with that sorting and return it as a string. Return \`""\` if the input contradicts itself.

Where several orders are possible, return the alphabetically smallest.

\`\`\`
words = ["wrt", "wrf", "er", "ett", "rftt"]  ->  "wertf"
\`\`\``,
    "function orderAlienAlphabet(words)",
    [
      { input: [["wrt", "wrf", "er", "ett", "rftt"]], expected: "wertf" },
      { input: [["z", "x"]], expected: "zx" },
      { input: [["z", "x", "z"]], expected: "" },
      { input: [["abc", "ab"]], expected: "" },
    ],
  ),
  g(
    "edges-form-a-tree",
    "Edges Form a Tree",
    "medium",
    `Given \`n\` nodes and a list of undirected edges, decide whether they form a single tree — fully connected, with no cycle.

\`\`\`
n = 4, edges = [[0,1],[0,2],[0,3]]  ->  true
\`\`\``,
    "function edgesFormATree(n, edges)",
    [
      {
        input: [
          4,
          [
            [0, 1],
            [0, 2],
            [0, 3],
          ],
        ],
        expected: true,
      },
      {
        input: [
          4,
          [
            [0, 1],
            [2, 3],
          ],
        ],
        expected: false,
      },
      {
        input: [
          3,
          [
            [0, 1],
            [1, 2],
            [2, 0],
          ],
        ],
        expected: false,
      },
      { input: [1, []], expected: true },
    ],
  ),
  g(
    "count-connected-groups",
    "Count Connected Groups",
    "medium",
    `Given \`n\` nodes and undirected edges, return how many separate connected groups there are.

\`\`\`
n = 5, edges = [[0,1],[1,2],[3,4]]  ->  2
\`\`\``,
    "function countConnectedGroups(n, edges)",
    [
      {
        input: [
          5,
          [
            [0, 1],
            [1, 2],
            [3, 4],
          ],
        ],
        expected: 2,
      },
      { input: [3, []], expected: 3 },
      { input: [0, []], expected: 0 },
      {
        input: [
          4,
          [
            [0, 1],
            [1, 2],
            [2, 3],
          ],
        ],
        expected: 1,
      },
    ],
  ),
];
