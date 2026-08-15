import { starter, type SeedProblem } from "../types.js";

const p = (
  slug: string,
  title: string,
  topic: SeedProblem["topic"],
  difficulty: SeedProblem["difficulty"],
  description: string,
  signature: string,
  testCases: SeedProblem["testCases"],
): SeedProblem => ({
  slug,
  title,
  topic,
  difficulty,
  description,
  functionSignature: signature,
  starterCode: starter(signature),
  testCases,
});

export const INTERVAL_PROBLEMS: SeedProblem[] = [
  p(
    "merge-overlapping-spans",
    "Merge Overlapping Spans",
    "intervals",
    "medium",
    `Given \`[start, end]\` spans, merge every group that overlaps or touches. Return the result sorted by start.

\`\`\`
spans = [[1, 4], [7, 9], [3, 5]]  ->  [[1, 5], [7, 9]]
\`\`\``,
    "function mergeOverlappingSpans(spans)",
    [
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
      { input: [[]], expected: [] },
    ],
  ),
  p(
    "insert-into-spans",
    "Insert Into Spans",
    "intervals",
    "medium",
    `Given non-overlapping spans sorted by start, insert a new span and merge where needed.

\`\`\`
spans = [[1, 3], [6, 9]], span = [2, 5]  ->  [[1, 5], [6, 9]]
\`\`\``,
    "function insertIntoSpans(spans, span)",
    [
      {
        input: [
          [
            [1, 3],
            [6, 9],
          ],
          [2, 5],
        ],
        expected: [
          [1, 5],
          [6, 9],
        ],
      },
      { input: [[], [4, 8]], expected: [[4, 8]] },
      {
        input: [[[1, 5]], [6, 8]],
        expected: [
          [1, 5],
          [6, 8],
        ],
      },
      { input: [[[1, 5]], [2, 3]], expected: [[1, 5]] },
    ],
  ),
  p(
    "fewest-spans-to-drop",
    "Fewest Spans to Drop",
    "intervals",
    "medium",
    `Return the minimum number of spans to remove so none of the rest overlap. Spans that merely touch at an endpoint do not overlap.

\`\`\`
spans = [[1, 2], [2, 3], [3, 4], [1, 3]]  ->  1
\`\`\``,
    "function fewestSpansToDrop(spans)",
    [
      {
        input: [
          [
            [1, 2],
            [2, 3],
            [3, 4],
            [1, 3],
          ],
        ],
        expected: 1,
      },
      {
        input: [
          [
            [1, 2],
            [1, 2],
            [1, 2],
          ],
        ],
        expected: 2,
      },
      {
        input: [
          [
            [1, 2],
            [2, 3],
          ],
        ],
        expected: 0,
      },
      { input: [[]], expected: 0 },
    ],
  ),
  p(
    "can-attend-every-meeting",
    "Can Attend Every Meeting",
    "intervals",
    "easy",
    `Given meeting \`[start, end]\` times, decide whether one person can attend them all. A meeting ending exactly when another starts is fine.

\`\`\`
meetings = [[0, 30], [5, 10]]  ->  false
\`\`\``,
    "function canAttendEveryMeeting(meetings)",
    [
      {
        input: [
          [
            [0, 30],
            [5, 10],
          ],
        ],
        expected: false,
      },
      {
        input: [
          [
            [7, 10],
            [2, 4],
          ],
        ],
        expected: true,
      },
      { input: [[]], expected: true },
      {
        input: [
          [
            [1, 2],
            [2, 3],
          ],
        ],
        expected: true,
      },
    ],
  ),
  p(
    "rooms-needed",
    "Rooms Needed",
    "intervals",
    "medium",
    `Given meeting \`[start, end]\` times, return the fewest rooms needed to hold them all. A room frees up the instant its meeting ends.

\`\`\`
meetings = [[0, 30], [5, 10], [15, 20]]  ->  2
\`\`\``,
    "function roomsNeeded(meetings)",
    [
      {
        input: [
          [
            [0, 30],
            [5, 10],
            [15, 20],
          ],
        ],
        expected: 2,
      },
      {
        input: [
          [
            [7, 10],
            [2, 4],
          ],
        ],
        expected: 1,
      },
      { input: [[]], expected: 0 },
      {
        input: [
          [
            [1, 5],
            [2, 6],
            [3, 7],
          ],
        ],
        expected: 3,
      },
    ],
  ),
];

export const MATRIX_PROBLEMS: SeedProblem[] = [
  p(
    "zero-out-rows-and-columns",
    "Zero Out Rows and Columns",
    "matrix",
    "medium",
    `If a cell is \`0\`, set its whole row and column to \`0\`. Return the resulting grid.

Base the decision on the *original* grid, not on zeros you write as you go.

\`\`\`
grid = [[1, 1, 1], [1, 0, 1], [1, 1, 1]]
  ->  [[1, 0, 1], [0, 0, 0], [1, 0, 1]]
\`\`\``,
    "function zeroOutRowsAndColumns(grid)",
    [
      {
        input: [
          [
            [1, 1, 1],
            [1, 0, 1],
            [1, 1, 1],
          ],
        ],
        expected: [
          [1, 0, 1],
          [0, 0, 0],
          [1, 0, 1],
        ],
      },
      {
        input: [
          [
            [0, 1],
            [1, 1],
          ],
        ],
        expected: [
          [0, 0],
          [0, 1],
        ],
      },
      { input: [[[1]]], expected: [[1]] },
      { input: [[]], expected: [] },
    ],
  ),
  p(
    "read-grid-in-spiral",
    "Read Grid in Spiral",
    "matrix",
    "medium",
    `Return every value in the grid, walking it in a clockwise spiral from the top-left.

\`\`\`
grid = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
  ->  [1, 2, 3, 6, 9, 8, 7, 4, 5]
\`\`\``,
    "function readGridInSpiral(grid)",
    [
      {
        input: [
          [
            [1, 2, 3],
            [4, 5, 6],
            [7, 8, 9],
          ],
        ],
        expected: [1, 2, 3, 6, 9, 8, 7, 4, 5],
      },
      { input: [[[1, 2, 3, 4]]], expected: [1, 2, 3, 4] },
      { input: [[]], expected: [] },
      {
        input: [
          [
            [1, 2],
            [3, 4],
          ],
        ],
        expected: [1, 2, 4, 3],
      },
    ],
  ),
  p(
    "rotate-grid-clockwise",
    "Rotate Grid Clockwise",
    "matrix",
    "medium",
    `Rotate a square grid 90 degrees clockwise and return it.

\`\`\`
grid = [[1, 2], [3, 4]]  ->  [[3, 1], [4, 2]]
\`\`\``,
    "function rotateGridClockwise(grid)",
    [
      {
        input: [
          [
            [1, 2],
            [3, 4],
          ],
        ],
        expected: [
          [3, 1],
          [4, 2],
        ],
      },
      {
        input: [
          [
            [1, 2, 3],
            [4, 5, 6],
            [7, 8, 9],
          ],
        ],
        expected: [
          [7, 4, 1],
          [8, 5, 2],
          [9, 6, 3],
        ],
      },
      { input: [[[5]]], expected: [[5]] },
      { input: [[]], expected: [] },
    ],
  ),
  p(
    "word-in-grid",
    "Word in Grid",
    "matrix",
    "medium",
    `Decide whether a word can be spelled by walking the grid from cell to adjacent cell, moving up, down, left, or right. A cell may not be reused within one word.

\`\`\`
grid = [["A","B"],["C","D"]], word = "ABD"  ->  true
\`\`\``,
    "function wordInGrid(grid, word)",
    [
      {
        input: [
          [
            ["A", "B"],
            ["C", "D"],
          ],
          "ABD",
        ],
        expected: true,
      },
      {
        input: [
          [
            ["A", "B"],
            ["C", "D"],
          ],
          "ABC",
        ],
        expected: false,
      },
      {
        input: [
          [
            ["A", "A"],
            ["A", "A"],
          ],
          "AAAAA",
        ],
        expected: false,
      },
      { input: [[["X"]], "X"], expected: true },
    ],
  ),
];
