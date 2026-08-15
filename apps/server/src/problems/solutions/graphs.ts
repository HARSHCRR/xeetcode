/* eslint-disable @typescript-eslint/no-explicit-any */

export const GRAPH_SOLUTIONS: Record<string, (...args: any[]) => unknown> = {
  'copy-adjacency': (graph: number[][]) => graph.map((neighbours) => [...neighbours]),

  'can-finish-courses': (n: number, prerequisites: number[][]) => {
    const next = Array.from({ length: n }, () => [] as number[]);
    const indegree = Array<number>(n).fill(0);
    for (const [course, needs] of prerequisites) {
      next[needs!]!.push(course!);
      indegree[course!]!++;
    }

    const queue = indegree.flatMap((count, i) => (count === 0 ? [i] : []));
    let done = 0;
    while (queue.length) {
      const course = queue.shift()!;
      done++;
      for (const dependent of next[course]!) {
        if (--indegree[dependent]! === 0) queue.push(dependent);
      }
    }
    return done === n;
  },

  'cells-reaching-both-edges': (heights: number[][]) => {
    if (heights.length === 0) return [];
    const rows = heights.length;
    const cols = heights[0]!.length;

    const flood = (starts: [number, number][]) => {
      const seen = new Set<string>();
      const stack = [...starts];
      while (stack.length) {
        const [r, c] = stack.pop()!;
        const key = `${r},${c}`;
        if (r < 0 || c < 0 || r >= rows || c >= cols || seen.has(key)) continue;
        seen.add(key);
        for (const [dr, dc] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]) {
          const nr = r + dr!;
          const nc = c + dc!;
          if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;
          // Walking uphill from the sea is the reverse of water flowing down.
          if (heights[nr]![nc]! >= heights[r]![c]!) stack.push([nr, nc]);
        }
      }
      return seen;
    };

    const topLeft: [number, number][] = [];
    const bottomRight: [number, number][] = [];
    for (let r = 0; r < rows; r++) {
      topLeft.push([r, 0]);
      bottomRight.push([r, cols - 1]);
    }
    for (let c = 0; c < cols; c++) {
      topLeft.push([0, c]);
      bottomRight.push([rows - 1, c]);
    }

    const a = flood(topLeft);
    const b = flood(bottomRight);
    const out: number[][] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const key = `${r},${c}`;
        if (a.has(key) && b.has(key)) out.push([r, c]);
      }
    }
    return out;
  },

  'count-islands': (grid: string[][]) => {
    if (grid.length === 0) return 0;
    const rows = grid.length;
    const cols = grid[0]!.length;
    const seen = new Set<string>();
    let islands = 0;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r]![c] !== '1' || seen.has(`${r},${c}`)) continue;
        islands++;
        const stack: [number, number][] = [[r, c]];
        while (stack.length) {
          const [cr, cc] = stack.pop()!;
          const key = `${cr},${cc}`;
          if (cr < 0 || cc < 0 || cr >= rows || cc >= cols) continue;
          if (seen.has(key) || grid[cr]![cc] !== '1') continue;
          seen.add(key);
          stack.push([cr + 1, cc], [cr - 1, cc], [cr, cc + 1], [cr, cc - 1]);
        }
      }
    }
    return islands;
  },

  'longest-consecutive-streak': (nums: number[]) => {
    const values = new Set(nums);
    let best = 0;
    for (const value of values) {
      // Only start counting from the bottom of a run.
      if (values.has(value - 1)) continue;
      let length = 1;
      while (values.has(value + length)) length++;
      best = Math.max(best, length);
    }
    return best;
  },

  'order-alien-alphabet': (words: string[]) => {
    const letters = new Set<string>();
    for (const word of words) for (const ch of word) letters.add(ch);

    const next = new Map<string, Set<string>>();
    const indegree = new Map<string, number>();
    for (const letter of letters) {
      next.set(letter, new Set());
      indegree.set(letter, 0);
    }

    for (let i = 0; i < words.length - 1; i++) {
      const a = words[i]!;
      const b = words[i + 1]!;
      // A longer word cannot sort before its own prefix.
      if (a.length > b.length && a.startsWith(b)) return '';
      for (let j = 0; j < Math.min(a.length, b.length); j++) {
        if (a[j] !== b[j]) {
          if (!next.get(a[j]!)!.has(b[j]!)) {
            next.get(a[j]!)!.add(b[j]!);
            indegree.set(b[j]!, indegree.get(b[j]!)! + 1);
          }
          break;
        }
      }
    }

    // Smallest-first pick makes the answer deterministic.
    const ready = [...letters].filter((l) => indegree.get(l) === 0).sort();
    let out = '';
    while (ready.length) {
      const letter = ready.shift()!;
      out += letter;
      for (const dependent of [...next.get(letter)!].sort()) {
        indegree.set(dependent, indegree.get(dependent)! - 1);
        if (indegree.get(dependent) === 0) ready.push(dependent);
      }
      ready.sort();
    }

    return out.length === letters.size ? out : '';
  },

  'edges-form-a-tree': (n: number, edges: number[][]) => {
    if (edges.length !== n - 1) return false;
    const parent = Array.from({ length: n }, (_, i) => i);
    const find = (x: number): number => {
      let root = x;
      while (parent[root] !== root) root = parent[root]!;
      return root;
    };
    for (const [a, b] of edges) {
      const ra = find(a!);
      const rb = find(b!);
      if (ra === rb) return false;
      parent[ra] = rb;
    }
    return true;
  },

  'count-connected-groups': (n: number, edges: number[][]) => {
    const parent = Array.from({ length: n }, (_, i) => i);
    const find = (x: number): number => {
      let root = x;
      while (parent[root] !== root) root = parent[root]!;
      return root;
    };
    let groups = n;
    for (const [a, b] of edges) {
      const ra = find(a!);
      const rb = find(b!);
      if (ra !== rb) {
        parent[ra] = rb;
        groups--;
      }
    }
    return groups;
  },
};
