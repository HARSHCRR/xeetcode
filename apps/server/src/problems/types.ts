import type {
  ArgAdapter,
  Difficulty,
  Language,
  ProblemTopic,
  ResultAdapter,
  TestCase,
  ValueType,
} from '@xeetcode/shared';

/**
 * A problem as authored in the bank.
 *
 * Every description here is written for this project. The problem *ideas* are
 * the well-known Blind 75 set, but none of the wording or test data is copied.
 *
 * C++ metadata is optional so the bank can be migrated a batch at a time: a
 * problem without it is simply offered in JavaScript only.
 */
export interface SeedProblem {
  slug: string;
  title: string;
  topic: ProblemTopic;
  difficulty: Difficulty;
  /** Markdown. */
  description: string;
  /** JS signature, e.g. `function twoSum(nums, target)`. */
  functionSignature: string;
  starterCode: string;
  /** Visible examples run by "Run". Falls back to the first hidden cases. */
  sampleCases?: TestCase[];
  /** Hidden edge cases run by "Submit". */
  testCases: TestCase[];
  /** Declaration inside `class Solution`, e.g. `vector<int> twoSum(vector<int>& nums, int t)`. */
  cppDeclaration?: string;
  cppTypes?: { params: ValueType[]; returns: ValueType };
  argAdapters?: (ArgAdapter | null)[];
  resultAdapter?: ResultAdapter;
  unorderedResult?: boolean;
}

/** Builds the boilerplate starter body so authoring stays terse. */
export function starter(signature: string): string {
  return `${signature} {\n  // your code here\n}`;
}

/** Parses the method name out of a C++ declaration. */
export function cppFunctionName(declaration: string): string {
  return declaration.match(/(\w+)\s*\(/)?.[1] ?? 'solve';
}

/** The C++ starter a player sees: a Solution class with an empty method. */
export function cppStarter(declaration: string): string {
  return `class Solution {\npublic:\n    ${declaration} {\n        // your code here\n    }\n};`;
}

/** Starter code for whichever languages a problem supports. */
export function startersFor(problem: SeedProblem): Partial<Record<Language, string>> {
  const starters: Partial<Record<Language, string>> = { javascript: problem.starterCode };
  if (problem.cppDeclaration) starters.cpp = cppStarter(problem.cppDeclaration);
  return starters;
}
