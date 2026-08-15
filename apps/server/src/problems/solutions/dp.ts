/* eslint-disable @typescript-eslint/no-explicit-any */

export const DP_SOLUTIONS: Record<string, (...args: any[]) => unknown> = {
  'ways-up-the-stairs': (n: number) => {
    let a = 1;
    let b = 1;
    for (let i = 0; i < n; i++) [a, b] = [b, a + b];
    return a;
  },

  'fewest-coins': (coins: number[], amount: number) => {
    const best = Array<number>(amount + 1).fill(Infinity);
    best[0] = 0;
    for (let value = 1; value <= amount; value++) {
      for (const coin of coins) {
        if (coin <= value) best[value] = Math.min(best[value]!, best[value - coin]! + 1);
      }
    }
    return best[amount] === Infinity ? -1 : best[amount];
  },

  'longest-rising-run': (nums: number[]) => {
    const tails: number[] = [];
    for (const n of nums) {
      let lo = 0;
      let hi = tails.length;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (tails[mid]! < n) lo = mid + 1;
        else hi = mid;
      }
      tails[lo] = n;
    }
    return tails.length;
  },

  'longest-shared-subsequence': (a: string, b: string) => {
    const table = Array.from({ length: a.length + 1 }, () => Array<number>(b.length + 1).fill(0));
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        table[i]![j] =
          a[i - 1] === b[j - 1]
            ? table[i - 1]![j - 1]! + 1
            : Math.max(table[i - 1]![j]!, table[i]![j - 1]!);
      }
    }
    return table[a.length]![b.length];
  },

  'splittable-into-words': (s: string, words: string[]) => {
    const reachable = Array<boolean>(s.length + 1).fill(false);
    reachable[0] = true;
    for (let i = 1; i <= s.length; i++) {
      for (const word of words) {
        if (i >= word.length && reachable[i - word.length] && s.startsWith(word, i - word.length)) {
          reachable[i] = true;
          break;
        }
      }
    }
    return reachable[s.length]!;
  },

  'ordered-sums-to-target': (nums: number[], target: number) => {
    const ways = Array<number>(target + 1).fill(0);
    ways[0] = 1;
    for (let total = 1; total <= target; total++) {
      for (const n of nums) if (n <= total) ways[total]! += ways[total - n]!;
    }
    return ways[target];
  },

  'best-loot-in-a-row': (amounts: number[]) => {
    let skip = 0;
    let take = 0;
    for (const amount of amounts) [skip, take] = [Math.max(skip, take), skip + amount];
    return Math.max(skip, take);
  },

  'best-loot-in-a-circle': (amounts: number[]) => {
    if (amounts.length === 0) return 0;
    if (amounts.length === 1) return amounts[0];

    const line = (values: number[]) => {
      let skip = 0;
      let take = 0;
      for (const value of values) [skip, take] = [Math.max(skip, take), skip + value];
      return Math.max(skip, take);
    };

    // Either the first house is off-limits, or the last is.
    return Math.max(line(amounts.slice(1)), line(amounts.slice(0, -1)));
  },

  'ways-to-read-digits': (s: string) => {
    if (s.length === 0) return 0;
    const ways = Array<number>(s.length + 1).fill(0);
    ways[0] = 1;
    ways[1] = s[0] === '0' ? 0 : 1;
    for (let i = 2; i <= s.length; i++) {
      if (s[i - 1] !== '0') ways[i]! += ways[i - 1]!;
      const pair = Number(s.slice(i - 2, i));
      if (pair >= 10 && pair <= 26) ways[i]! += ways[i - 2]!;
    }
    return ways[s.length];
  },

  'paths-across-grid': (m: number, n: number) => {
    const row = Array<number>(n).fill(1);
    for (let r = 1; r < m; r++) {
      for (let c = 1; c < n; c++) row[c]! += row[c - 1]!;
    }
    return row[n - 1];
  },

  'can-reach-the-end': (nums: number[]) => {
    let furthest = 0;
    for (let i = 0; i < nums.length; i++) {
      if (i > furthest) return false;
      furthest = Math.max(furthest, i + nums[i]!);
    }
    return true;
  },

  'k-most-frequent': (nums: number[], k: number) => {
    const counts = new Map<number, number>();
    for (const n of nums) counts.set(n, (counts.get(n) ?? 0) + 1);
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, k)
      .map(([value]) => value);
  },

  'running-median': (stream: number[]) => {
    const seen: number[] = [];
    const out: number[] = [];
    for (const value of stream) {
      // Insertion sort keeps this simple; the point is the medians, not the heap.
      let i = seen.length;
      while (i > 0 && seen[i - 1]! > value) i--;
      seen.splice(i, 0, value);

      const mid = seen.length >> 1;
      out.push(seen.length % 2 === 1 ? seen[mid]! : (seen[mid - 1]! + seen[mid]!) / 2);
    }
    return out;
  },
};
