/**
 * Helpers injected into every sandbox run, before the player's code.
 *
 * Test cases are plain JSON so they can live in a JSONB column, but a third of
 * Blind 75 operates on linked lists and binary trees. Rather than water those
 * problems down to array manipulation, tests describe the structure as an array
 * and the harness builds the real nodes before calling the solution — and
 * converts any node returned back to an array so comparison stays structural.
 *
 * Trees use the level-order-with-nulls convention these problems are normally
 * written against.
 */
export const STRUCTURE_PRELUDE = `
function ListNode(val, next) { this.val = val === undefined ? 0 : val; this.next = next === undefined ? null : next; }

function TreeNode(val, left, right) {
  this.val = val === undefined ? 0 : val;
  this.left = left === undefined ? null : left;
  this.right = right === undefined ? null : right;
}

function __buildList(values) {
  if (!values || values.length === 0) return null;
  const head = new ListNode(values[0]);
  let node = head;
  for (let i = 1; i < values.length; i++) { node.next = new ListNode(values[i]); node = node.next; }
  return head;
}

function __listToArray(node) {
  const out = [];
  // Bound the walk so a submission that builds a cycle can't hang the judge.
  let guard = 0;
  while (node && guard++ < 100000) { out.push(node.val); node = node.next; }
  return out;
}

/** Level-order with nulls, e.g. [1, 2, 3, null, 4]. */
function __buildTree(values) {
  if (!values || values.length === 0 || values[0] === null) return null;
  const root = new TreeNode(values[0]);
  const queue = [root];
  let i = 1;
  while (i < values.length) {
    const node = queue.shift();
    if (i < values.length) { const v = values[i++]; if (v !== null) { node.left = new TreeNode(v); queue.push(node.left); } }
    if (i < values.length) { const v = values[i++]; if (v !== null) { node.right = new TreeNode(v); queue.push(node.right); } }
  }
  return root;
}

function __treeToArray(root) {
  if (!root) return [];
  const out = [];
  const queue = [root];
  while (queue.length) {
    const node = queue.shift();
    if (node === null) { out.push(null); continue; }
    out.push(node.val);
    queue.push(node.left ?? null, node.right ?? null);
  }
  while (out.length && out[out.length - 1] === null) out.pop();
  return out;
}

/** Builds several lists at once, for problems taking a list of lists. */
function __buildLists(arrays) { return (arrays || []).map(__buildList); }
`;
