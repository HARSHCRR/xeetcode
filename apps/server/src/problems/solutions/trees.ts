/* eslint-disable @typescript-eslint/no-explicit-any */
import { buildTree, treeToArray, type TreeNode } from './structures.js';

const node = (val: number): TreeNode => ({ val, left: null, right: null });

export const TREE_SOLUTIONS: Record<string, (...args: any[]) => unknown> = {
  'tree-depth': function depth(root: TreeNode | null): number {
    if (!root) return 0;
    return 1 + Math.max(depth(root.left), depth(root.right));
  },

  'trees-are-identical': function same(a: TreeNode | null, b: TreeNode | null): boolean {
    if (!a || !b) return a === b;
    return a.val === b.val && same(a.left, b.left) && same(a.right, b.right);
  },

  'mirror-a-tree': function mirror(root: TreeNode | null): TreeNode | null {
    if (!root) return null;
    const swapped: TreeNode = { val: root.val, left: mirror(root.right), right: mirror(root.left) };
    return swapped;
  },

  'best-path-sum': (root: TreeNode | null) => {
    let best = -Infinity;
    const walk = (n: TreeNode | null): number => {
      if (!n) return 0;
      // A branch contributing a negative total is better left out entirely.
      const left = Math.max(0, walk(n.left));
      const right = Math.max(0, walk(n.right));
      best = Math.max(best, n.val + left + right);
      return n.val + Math.max(left, right);
    };
    walk(root);
    return best === -Infinity ? 0 : best;
  },

  'values-by-level': (root: TreeNode | null) => {
    if (!root) return [];
    const out: number[][] = [];
    let level: TreeNode[] = [root];
    while (level.length) {
      out.push(level.map((n) => n.val));
      const next: TreeNode[] = [];
      for (const n of level) {
        if (n.left) next.push(n.left);
        if (n.right) next.push(n.right);
      }
      level = next;
    }
    return out;
  },

  // Round trip through the same level-order encoding the tests use.
  'flatten-and-rebuild': (root: TreeNode | null) => buildTree(treeToArray(root)),

  'contains-subtree': (tree: TreeNode | null, part: TreeNode | null) => {
    const same = (a: TreeNode | null, b: TreeNode | null): boolean => {
      if (!a || !b) return a === b;
      return a.val === b.val && same(a.left, b.left) && same(a.right, b.right);
    };
    const walk = (n: TreeNode | null): boolean => {
      if (!n) return part === null;
      return same(n, part) || walk(n.left) || walk(n.right);
    };
    return walk(tree);
  },

  'rebuild-from-orders': (preorder: number[], inorder: number[]) => {
    const position = new Map<number, number>();
    inorder.forEach((value, index) => position.set(value, index));
    let cursor = 0;

    const build = (lo: number, hi: number): TreeNode | null => {
      if (lo > hi) return null;
      const value = preorder[cursor++]!;
      const n = node(value);
      const mid = position.get(value)!;
      n.left = build(lo, mid - 1);
      n.right = build(mid + 1, hi);
      return n;
    };

    return build(0, inorder.length - 1);
  },

  'is-a-search-tree': (root: TreeNode | null) => {
    const walk = (n: TreeNode | null, low: number, high: number): boolean => {
      if (!n) return true;
      if (n.val <= low || n.val >= high) return false;
      return walk(n.left, low, n.val) && walk(n.right, n.val, high);
    };
    return walk(root, -Infinity, Infinity);
  },

  'kth-smallest-in-bst': (root: TreeNode | null, k: number) => {
    const values: number[] = [];
    const walk = (n: TreeNode | null) => {
      if (!n) return;
      walk(n.left);
      values.push(n.val);
      walk(n.right);
    };
    walk(root);
    return values[k - 1];
  },

  'shared-ancestor-in-bst': (root: TreeNode | null, a: number, b: number) => {
    let n = root;
    while (n) {
      if (a < n.val && b < n.val) n = n.left;
      else if (a > n.val && b > n.val) n = n.right;
      else return n.val;
    }
    return -1;
  },

  'prefix-tree-lookups': (words: string[], queries: string[][]) => {
    const stored = new Set(words);
    const out: boolean[] = [];
    for (const [op, arg] of queries) {
      if (op === 'insert') {
        stored.add(arg!);
        continue;
      }
      if (op === 'search') out.push(stored.has(arg!));
      else if (op === 'startsWith') out.push([...stored].some((w) => w.startsWith(arg!)));
    }
    return out;
  },

  'wildcard-word-search': (words: string[], patterns: string[]) =>
    patterns.map((pattern) =>
      words.some(
        (word) =>
          word.length === pattern.length &&
          [...pattern].every((ch, i) => ch === '.' || ch === word[i]),
      ),
    ),

  'find-words-in-grid': (grid: string[][], words: string[]) => {
    if (grid.length === 0) return [];
    const rows = grid.length;
    const cols = grid[0]!.length;

    const canSpell = (word: string): boolean => {
      const walk = (r: number, c: number, i: number, seen: Set<string>): boolean => {
        if (i === word.length) return true;
        if (r < 0 || c < 0 || r >= rows || c >= cols) return false;
        const key = `${r},${c}`;
        if (seen.has(key) || grid[r]![c] !== word[i]) return false;
        seen.add(key);
        const found =
          walk(r + 1, c, i + 1, seen) ||
          walk(r - 1, c, i + 1, seen) ||
          walk(r, c + 1, i + 1, seen) ||
          walk(r, c - 1, i + 1, seen);
        seen.delete(key);
        return found;
      };
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) if (walk(r, c, 0, new Set())) return true;
      }
      return false;
    };

    return words.filter(canSpell);
  },
};
