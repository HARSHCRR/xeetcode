import { starter, type SeedProblem } from "../types.js";

const p = (
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
  topic: "bit_manipulation",
  difficulty,
  description,
  functionSignature: signature,
  starterCode: starter(signature),
  testCases,
  ...extra,
});

export const BIT_PROBLEMS: SeedProblem[] = [
  p(
    "add-without-plus",
    "Add Without Plus",
    "medium",
    `Add two integers without using \`+\` or \`-\`.

Use bitwise operations: XOR gives the sum without carries, AND shifted left gives the carries.

\`\`\`
a = 5, b = 3  ->  8
\`\`\``,
    "function addWithoutPlus(a, b)",
    [
      { input: [5, 3], expected: 8 },
      { input: [0, 0], expected: 0 },
      { input: [-3, 7], expected: 4 },
      { input: [-2, -6], expected: -8 },
    ],
    {
      cppDeclaration: "int addWithoutPlus(int a, int b)",
      cppTypes: { params: ["int", "int"], returns: "int" },
    },
  ),
  p(
    "count-set-bits",
    "Count Set Bits",
    "easy",
    `Return how many bits are set to 1 in the binary form of a non-negative integer.

\`\`\`
n = 11   (binary 1011)  ->  3
\`\`\``,
    "function countSetBits(n)",
    [
      { input: [11], expected: 3 },
      { input: [0], expected: 0 },
      { input: [128], expected: 1 },
      { input: [4294967293], expected: 31 },
    ],
  ),
  p(
    "set-bits-up-to",
    "Set Bits Up To N",
    "easy",
    `For every integer from \`0\` to \`n\`, count its set bits. Return the counts as an array.

\`\`\`
n = 5  ->  [0, 1, 1, 2, 1, 2]
\`\`\``,
    "function setBitsUpTo(n)",
    [
      { input: [5], expected: [0, 1, 1, 2, 1, 2] },
      { input: [0], expected: [0] },
      { input: [2], expected: [0, 1, 1] },
      { input: [8], expected: [0, 1, 1, 2, 1, 2, 2, 3, 1] },
    ],
    {
      cppDeclaration: "vector<int> setBitsUpTo(int n)",
      cppTypes: { params: ["int"], returns: "int[]" },
    },
  ),
  p(
    "missing-from-range",
    "Missing From Range",
    "easy",
    `An array holds \`n\` distinct integers drawn from \`0\` to \`n\`. Exactly one value is absent — return it.

\`\`\`
nums = [3, 0, 1]  ->  2
\`\`\``,
    "function missingFromRange(nums)",
    [
      { input: [[3, 0, 1]], expected: 2 },
      { input: [[0]], expected: 1 },
      { input: [[1]], expected: 0 },
      { input: [[9, 6, 4, 2, 3, 5, 7, 0, 1]], expected: 8 },
    ],
    {
      cppDeclaration: "int missingFromRange(vector<int>& nums)",
      cppTypes: { params: ["int[]"], returns: "int" },
    },
  ),
  p(
    "reverse-32-bits",
    "Reverse 32 Bits",
    "easy",
    `Reverse the order of the 32 bits of an unsigned integer and return the result as an unsigned number.

\`\`\`
n = 1  ->  2147483648
\`\`\``,
    "function reverse32Bits(n)",
    [
      { input: [1], expected: 2147483648 },
      { input: [0], expected: 0 },
      { input: [4294967295], expected: 4294967295 },
      { input: [43261596], expected: 964176192 },
    ],
  ),
];
