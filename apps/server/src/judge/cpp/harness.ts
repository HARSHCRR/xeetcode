import type { Problem, TestCase, ValueType } from '@xeetcode/shared';

import { CPP_PRELUDE } from './prelude.js';

export const RESULT_MARKER = '__XEETCODE_RESULT__';

/** C++ declaration for a parameter of the given type. */
const CPP_TYPE: Record<ValueType, string> = {
  int: 'int',
  double: 'double',
  bool: 'bool',
  string: 'string',
  'int[]': 'vector<int>',
  'double[]': 'vector<double>',
  'string[]': 'vector<string>',
  'int[][]': 'vector<vector<int>>',
  'string[][]': 'vector<vector<string>>',
  list: 'ListNode*',
  'list[]': 'vector<ListNode*>',
  tree: 'TreeNode*',
};

/** The literal a test value becomes in generated C++. */
function literal(type: ValueType, value: unknown): string {
  switch (type) {
    case 'int':
      // `null` inside tree/list data is the level-order hole sentinel.
      return value === null ? 'xc::NUL' : String(value);
    case 'double':
      return String(value);
    case 'bool':
      return value ? 'true' : 'false';
    case 'string':
      return JSON.stringify(String(value));
    case 'int[]':
    case 'list':
    case 'tree':
      return `vector<int>{${(value as unknown[]).map((v) => literal('int', v)).join(',')}}`;
    case 'double[]':
      return `vector<double>{${(value as number[]).join(',')}}`;
    case 'string[]':
      return `vector<string>{${(value as string[]).map((v) => JSON.stringify(v)).join(',')}}`;
    case 'int[][]':
    case 'list[]':
      return `vector<vector<int>>{${(value as unknown[][])
        .map((row) => `{${row.map((v) => literal('int', v)).join(',')}}`)
        .join(',')}}`;
    case 'string[][]':
      return `vector<vector<string>>{${(value as string[][])
        .map((row) => `{${row.map((v) => JSON.stringify(v)).join(',')}}`)
        .join(',')}}`;
    default:
      return '{}';
  }
}

/** Wraps a raw literal so the solution receives the structure it expects. */
function toArgument(type: ValueType, raw: string): string {
  if (type === 'list') return `xc::buildList(${raw})`;
  if (type === 'list[]') return `xc::buildLists(${raw})`;
  if (type === 'tree') return `xc::buildTree(${raw})`;
  return raw;
}

/** Converts the solution's return value back to something comparable. */
function fromResult(type: ValueType, expression: string): string {
  if (type === 'list') return `xc::listToVector(${expression})`;
  if (type === 'tree') return `xc::treeToVector(${expression})`;
  return expression;
}

/** The type the comparison actually happens in (structures compare as vectors). */
function comparableType(type: ValueType): string {
  if (type === 'list' || type === 'tree') return 'vector<int>';
  return CPP_TYPE[type];
}

export interface CppSignature {
  params: ValueType[];
  returns: ValueType;
}

/**
 * Builds a complete C++ program: prelude, the player's code, and a runner that
 * executes each case and prints one JSON verdict line.
 *
 * Test data is emitted as C++ literals rather than parsed at runtime, so the
 * program needs no JSON library and a malformed case fails at compile time
 * here rather than silently at judge time.
 */
export function buildCppHarness(
  problem: Problem,
  userCode: string,
  cases: TestCase[],
  /** Visible samples may report the produced value; hidden ones never do. */
  revealActual: boolean,
): string {
  const signature = problem.cppSignature;
  if (!signature) throw new Error(`${problem.slug} has no C++ signature`);

  const fn = problem.cppFunctionName ?? 'solve';
  const compare = problem.unorderedResult ? 'xc::eqUnordered' : 'xc::eq';

  const runners = cases
    .map((testCase) => {
      // Each argument is bound to a named local first. LeetCode-style
      // signatures take `vector<int>&`, and a non-const reference cannot bind
      // to a temporary, so passing the literal inline fails to compile.
      const locals = signature.params
        .map(
          (type, i) =>
            `        auto arg${i} = ${toArgument(type, literal(type, testCase.input[i]))};`,
        )
        .join('\n');
      const args = signature.params.map((_, i) => `arg${i}`).join(', ');

      const expected = `${comparableType(signature.returns)} expected = ${literal(
        signature.returns,
        testCase.expected,
      )};`;

      return `
    try {
        Solution solution;
        ${expected}
${locals}
        auto raw = solution.${fn}(${args});
        auto actual = ${fromResult(signature.returns, 'raw')};
        bool pass = ${compare}(actual, expected);
        results.push_back(string("{\\"pass\\":") + (pass ? "true" : "false") +
            ${revealActual
              ? `(pass ? string("") : string(",\\"actual\\":\\"") + xc::escape(xc::show(actual)) + "\\"" +
                 string(",\\"expected\\":\\"") + xc::escape(xc::show(expected)) + "\\"")`
              : 'string("")'} + "}");
    } catch (...) {
        results.push_back("{\\"pass\\":false}");
    }`;
    })
    .join('\n');

  return `${CPP_PRELUDE}

${userCode}

int main() {
    vector<string> results;
${runners}

    string out = "${RESULT_MARKER}{\\"results\\":[";
    for (size_t i = 0; i < results.size(); i++) { if (i) out += ","; out += results[i]; }
    out += "]}";
    cout << out << endl;
    return 0;
}
`;
}
