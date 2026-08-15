/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * TypeScript mirrors of the sandbox prelude's structure helpers.
 *
 * The bank test feeds reference solutions through these, so a reference solution
 * receives exactly what a player's code would. That also means the two
 * implementations are cross-checked: if the prelude and these ever disagree
 * about, say, the level-order encoding, a test case's expected value stops
 * matching and the suite fails.
 */

export interface ListNode {
  val: number;
  next: ListNode | null;
}

export interface TreeNode {
  val: number;
  left: TreeNode | null;
  right: TreeNode | null;
}

export function buildList(values: number[] | null): ListNode | null {
  if (!values || values.length === 0) return null;
  const head: ListNode = { val: values[0]!, next: null };
  let node = head;
  for (let i = 1; i < values.length; i++) {
    node.next = { val: values[i]!, next: null };
    node = node.next;
  }
  return head;
}

export function buildLists(arrays: number[][] | null): (ListNode | null)[] {
  return (arrays ?? []).map(buildList);
}

export function listToArray(node: ListNode | null): number[] {
  const out: number[] = [];
  let current = node;
  let guard = 0;
  while (current && guard++ < 100000) {
    out.push(current.val);
    current = current.next;
  }
  return out;
}

/** Level-order with nulls, e.g. [1, 2, 3, null, 4]. */
export function buildTree(values: (number | null)[] | null): TreeNode | null {
  if (!values || values.length === 0 || values[0] === null) return null;
  const root: TreeNode = { val: values[0]!, left: null, right: null };
  const queue: TreeNode[] = [root];
  let i = 1;
  while (i < values.length) {
    const node = queue.shift()!;
    if (i < values.length) {
      const v = values[i++];
      if (v !== null && v !== undefined) {
        node.left = { val: v, left: null, right: null };
        queue.push(node.left);
      }
    }
    if (i < values.length) {
      const v = values[i++];
      if (v !== null && v !== undefined) {
        node.right = { val: v, left: null, right: null };
        queue.push(node.right);
      }
    }
  }
  return root;
}

export function treeToArray(root: TreeNode | null): (number | null)[] {
  if (!root) return [];
  const out: (number | null)[] = [];
  const queue: (TreeNode | null)[] = [root];
  while (queue.length) {
    const node = queue.shift()!;
    if (node === null) {
      out.push(null);
      continue;
    }
    out.push(node.val);
    queue.push(node.left ?? null, node.right ?? null);
  }
  while (out.length && out[out.length - 1] === null) out.pop();
  return out;
}

export const ADAPTERS: Record<string, (value: any) => unknown> = {
  buildList,
  buildLists,
  buildTree,
  listToArray,
  treeToArray,
};
