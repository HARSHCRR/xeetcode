import type { ArgAdapter, Difficulty, ProblemTopic, ResultAdapter, TestCase } from '@xeetcode/shared';

/**
 * A problem as authored in the bank.
 *
 * Every description here is written for this project. The problem *ideas* are
 * the well-known Blind 75 set, but none of the wording or test data is copied
 * from LeetCode or anywhere else.
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
  argAdapters?: (ArgAdapter | null)[];
  resultAdapter?: ResultAdapter;
  unorderedResult?: boolean;
}

/** Builds the boilerplate starter body so authoring stays terse. */
export function starter(signature: string): string {
  return `${signature} {\n  // your code here\n}`;
}
