/* eslint-disable @typescript-eslint/no-explicit-any */

export const INTERVAL_SOLUTIONS: Record<string, (...args: any[]) => unknown> = {
  'merge-overlapping-spans': (spans: number[][]) => {
    const sorted = [...spans].sort((a, b) => a[0]! - b[0]!);
    const out: number[][] = [];
    for (const span of sorted) {
      const last = out[out.length - 1];
      if (last && span[0]! <= last[1]!) last[1] = Math.max(last[1]!, span[1]!);
      else out.push([...span]);
    }
    return out;
  },

  'insert-into-spans': (spans: number[][], span: number[]) => {
    const merged = [...spans, span].sort((a, b) => a[0]! - b[0]!);
    const out: number[][] = [];
    for (const current of merged) {
      const last = out[out.length - 1];
      if (last && current[0]! <= last[1]!) last[1] = Math.max(last[1]!, current[1]!);
      else out.push([...current]);
    }
    return out;
  },

  'fewest-spans-to-drop': (spans: number[][]) => {
    if (spans.length === 0) return 0;
    // Keep the span that frees up earliest; everything overlapping it goes.
    const sorted = [...spans].sort((a, b) => a[1]! - b[1]!);
    let kept = 1;
    let end = sorted[0]![1]!;
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i]![0]! >= end) {
        kept++;
        end = sorted[i]![1]!;
      }
    }
    return spans.length - kept;
  },

  'can-attend-every-meeting': (meetings: number[][]) => {
    const sorted = [...meetings].sort((a, b) => a[0]! - b[0]!);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i]![0]! < sorted[i - 1]![1]!) return false;
    }
    return true;
  },

  'rooms-needed': (meetings: number[][]) => {
    const starts = meetings.map((m) => m[0]!).sort((a, b) => a - b);
    const ends = meetings.map((m) => m[1]!).sort((a, b) => a - b);
    let rooms = 0;
    let best = 0;
    let e = 0;
    for (const start of starts) {
      while (e < ends.length && ends[e]! <= start) {
        rooms--;
        e++;
      }
      rooms++;
      best = Math.max(best, rooms);
    }
    return best;
  },

  'zero-out-rows-and-columns': (grid: number[][]) => {
    const rows = new Set<number>();
    const cols = new Set<number>();
    grid.forEach((row, r) =>
      row.forEach((value, c) => {
        if (value === 0) {
          rows.add(r);
          cols.add(c);
        }
      }),
    );
    return grid.map((row, r) => row.map((value, c) => (rows.has(r) || cols.has(c) ? 0 : value)));
  },

  'read-grid-in-spiral': (grid: number[][]) => {
    if (grid.length === 0) return [];
    const out: number[] = [];
    let top = 0;
    let bottom = grid.length - 1;
    let left = 0;
    let right = grid[0]!.length - 1;

    while (top <= bottom && left <= right) {
      for (let c = left; c <= right; c++) out.push(grid[top]![c]!);
      top++;
      for (let r = top; r <= bottom; r++) out.push(grid[r]![right]!);
      right--;
      if (top <= bottom) {
        for (let c = right; c >= left; c--) out.push(grid[bottom]![c]!);
        bottom--;
      }
      if (left <= right) {
        for (let r = bottom; r >= top; r--) out.push(grid[r]![left]!);
        left++;
      }
    }
    return out;
  },

  'rotate-grid-clockwise': (grid: number[][]) => {
    const n = grid.length;
    return Array.from({ length: n }, (_, r) =>
      Array.from({ length: n }, (_, c) => grid[n - 1 - c]![r]!),
    );
  },

  'word-in-grid': (grid: string[][], word: string) => {
    if (word.length === 0) return true;
    if (grid.length === 0) return false;
    const rows = grid.length;
    const cols = grid[0]!.length;

    const walk = (r: number, c: number, index: number, seen: Set<string>): boolean => {
      if (index === word.length) return true;
      if (r < 0 || c < 0 || r >= rows || c >= cols) return false;
      const key = `${r},${c}`;
      if (seen.has(key) || grid[r]![c] !== word[index]) return false;

      seen.add(key);
      const found =
        walk(r + 1, c, index + 1, seen) ||
        walk(r - 1, c, index + 1, seen) ||
        walk(r, c + 1, index + 1, seen) ||
        walk(r, c - 1, index + 1, seen);
      seen.delete(key);
      return found;
    };

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (walk(r, c, 0, new Set())) return true;
      }
    }
    return false;
  },
};
