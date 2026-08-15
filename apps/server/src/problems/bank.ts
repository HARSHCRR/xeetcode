import { ARRAY_PROBLEMS } from './blind75/arrays.js';
import { BIT_PROBLEMS } from './blind75/bits.js';
import { DP_PROBLEMS, HEAP_PROBLEMS } from './blind75/dp.js';
import { GRAPH_PROBLEMS } from './blind75/graphs.js';
import { INTERVAL_PROBLEMS, MATRIX_PROBLEMS } from './blind75/intervals.js';
import { LIST_PROBLEMS } from './blind75/lists.js';
import { STRING_PROBLEMS } from './blind75/strings.js';
import { TREE_PROBLEMS } from './blind75/trees.js';
import type { SeedProblem } from './types.js';

export type { SeedProblem } from './types.js';

/**
 * The seed problem bank — the Blind 75 set.
 *
 * The problem *ideas* are the well-known list, but every description, starter,
 * and test case here is written for this project rather than copied.
 */
export const PROBLEM_BANK: SeedProblem[] = [
  ...ARRAY_PROBLEMS,
  ...BIT_PROBLEMS,
  ...STRING_PROBLEMS,
  ...INTERVAL_PROBLEMS,
  ...MATRIX_PROBLEMS,
  ...DP_PROBLEMS,
  ...HEAP_PROBLEMS,
  ...LIST_PROBLEMS,
  ...TREE_PROBLEMS,
  ...GRAPH_PROBLEMS,
];
