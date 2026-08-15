/* eslint-disable @typescript-eslint/no-explicit-any */
import { ARRAY_SOLUTIONS } from './arrays.js';
import { DP_SOLUTIONS } from './dp.js';
import { GRAPH_SOLUTIONS } from './graphs.js';
import { INTERVAL_SOLUTIONS } from './intervals.js';
import { LIST_SOLUTIONS } from './lists.js';
import { STRING_SOLUTIONS } from './strings.js';
import { TREE_SOLUTIONS } from './trees.js';

/** Every reference solution, keyed by problem slug. */
export const REFERENCE_SOLUTIONS: Record<string, (...args: any[]) => unknown> = {
  ...ARRAY_SOLUTIONS,
  ...STRING_SOLUTIONS,
  ...INTERVAL_SOLUTIONS,
  ...DP_SOLUTIONS,
  ...LIST_SOLUTIONS,
  ...TREE_SOLUTIONS,
  ...GRAPH_SOLUTIONS,
};
