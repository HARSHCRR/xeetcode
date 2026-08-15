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
  topic: "strings",
  difficulty,
  description,
  functionSignature: signature,
  starterCode: starter(signature),
  testCases,
  ...extra,
});

export const STRING_PROBLEMS: SeedProblem[] = [
  p(
    "longest-unique-window",
    "Longest Unique Window",
    "medium",
    `Find the length of the longest stretch of consecutive characters containing no repeats.

\`\`\`
s = "abcabcbb"  ->  3
\`\`\``,
    "function longestUniqueWindow(s)",
    [
      { input: ["abcabcbb"], expected: 3 },
      { input: ["bbbbb"], expected: 1 },
      { input: [""], expected: 0 },
      { input: ["pwwkew"], expected: 3 },
    ],
  ),
  p(
    "longest-run-after-swaps",
    "Longest Run After Swaps",
    "medium",
    `You may replace up to \`k\` characters with any uppercase letter. Return the length of the longest run of one repeated character you can produce.

\`\`\`
s = "AABABBA", k = 1  ->  4
\`\`\``,
    "function longestRunAfterSwaps(s, k)",
    [
      { input: ["AABABBA", 1], expected: 4 },
      { input: ["ABAB", 2], expected: 4 },
      { input: ["AAAA", 0], expected: 4 },
      { input: ["", 2], expected: 0 },
    ],
  ),
  p(
    "smallest-covering-window",
    "Smallest Covering Window",
    "hard",
    `Return the shortest substring of \`s\` containing every character of \`t\`, counting duplicates. If none exists, return \`""\`.

\`\`\`
s = "ADOBECODEBANC", t = "ABC"  ->  "BANC"
\`\`\``,
    "function smallestCoveringWindow(s, t)",
    [
      { input: ["ADOBECODEBANC", "ABC"], expected: "BANC" },
      { input: ["a", "a"], expected: "a" },
      { input: ["a", "aa"], expected: "" },
      { input: ["", "x"], expected: "" },
    ],
  ),
  p(
    "same-letters-reordered",
    "Same Letters, Reordered",
    "easy",
    `Decide whether two strings use exactly the same letters with the same counts. Case-sensitive.

\`\`\`
a = "listen", b = "silent"  ->  true
\`\`\``,
    "function sameLettersReordered(a, b)",
    [
      { input: ["listen", "silent"], expected: true },
      { input: ["rat", "car"], expected: false },
      { input: ["", ""], expected: true },
      { input: ["Abc", "abc"], expected: false },
    ],
  ),
  p(
    "group-by-letters",
    "Group by Letters",
    "medium",
    `Group words that are rearrangements of each other.

Order doesn't matter — neither between groups nor within one.

\`\`\`
words = ["tab", "bat", "cat", "act"]  ->  [["act", "cat"], ["bat", "tab"]]
\`\`\``,
    "function groupByLetters(words)",
    [
      {
        input: [["tab", "bat", "cat", "act"]],
        expected: [
          ["act", "cat"],
          ["bat", "tab"],
        ],
      },
      { input: [[]], expected: [] },
      { input: [["solo"]], expected: [["solo"]] },
      { input: [["ab", "ba", "abc"]], expected: [["ab", "ba"], ["abc"]] },
    ],
    { unorderedResult: true },
  ),
  p(
    "balanced-brackets",
    "Balanced Brackets",
    "easy",
    `A string contains only \`()[]{}\`. Decide whether every bracket closes with its matching type, in order.

\`\`\`
s = "{[()]}"  ->  true
s = "([)]"    ->  false
\`\`\``,
    "function balancedBrackets(s)",
    [
      { input: ["{[()]}"], expected: true },
      { input: ["([)]"], expected: false },
      { input: [""], expected: true },
      { input: ["("], expected: false },
    ],
  ),
  p(
    "clean-palindrome-check",
    "Clean Palindrome Check",
    "easy",
    `Decide whether a string reads the same both ways, considering only letters and digits and ignoring case.

\`\`\`
s = "Red rum, sir, is murder!"  ->  true
\`\`\``,
    "function cleanPalindromeCheck(s)",
    [
      { input: ["Red rum, sir, is murder!"], expected: true },
      { input: ["hello"], expected: false },
      { input: [""], expected: true },
      { input: ["A1b  2 c1a"], expected: false },
    ],
  ),
  p(
    "longest-mirror-substring",
    "Longest Mirror Substring",
    "medium",
    `Return the longest substring that reads the same both ways.

If several tie in length, return the one that starts earliest.

\`\`\`
s = "babad"  ->  "bab"
\`\`\``,
    "function longestMirrorSubstring(s)",
    [
      { input: ["babad"], expected: "bab" },
      { input: ["cbbd"], expected: "bb" },
      { input: ["a"], expected: "a" },
      { input: [""], expected: "" },
    ],
  ),
  p(
    "count-mirror-substrings",
    "Count Mirror Substrings",
    "medium",
    `Count how many substrings read the same both ways. Substrings at different positions count separately, even if identical.

\`\`\`
s = "aaa"  ->  6
\`\`\``,
    "function countMirrorSubstrings(s)",
    [
      { input: ["aaa"], expected: 6 },
      { input: ["abc"], expected: 3 },
      { input: [""], expected: 0 },
      { input: ["abba"], expected: 6 },
    ],
  ),
  p(
    "join-and-split",
    "Join and Split",
    "medium",
    `Write \`joinAndSplit(words)\` that encodes an array of strings into one string and decodes it straight back, returning the original array.

Any character may appear in a word, including whatever you pick as a separator — so a plain \`join\` will not survive the round trip.

\`\`\`
words = ["hi", "there#you"]  ->  ["hi", "there#you"]
\`\`\``,
    "function joinAndSplit(words)",
    [
      { input: [["hi", "there#you"]], expected: ["hi", "there#you"] },
      { input: [[]], expected: [] },
      { input: [[""]], expected: [""] },
      { input: [["a", "", "b##c", "  "]], expected: ["a", "", "b##c", "  "] },
    ],
  ),
];
