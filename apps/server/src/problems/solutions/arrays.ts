/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Reference solutions for the array and bit problems.
 *
 * These exist to machine-check the seed data: a hand-written `expected` value
 * that is subtly wrong would otherwise stay invisible until it failed a
 * player's correct submission and looked like a judge bug.
 */
export const ARRAY_SOLUTIONS: Record<string, (...args: any[]) => unknown> = {
  'pair-sums-to-target': (nums: number[], target: number) => {
    const seen = new Map<number, number>();
    for (let i = 0; i < nums.length; i++) {
      const partner = seen.get(target - nums[i]!);
      if (partner !== undefined) return [partner, i];
      seen.set(nums[i]!, i);
    }
    return [];
  },

  'best-single-trade': (prices: number[]) => {
    let best = 0;
    let cheapest = Infinity;
    for (const price of prices) {
      cheapest = Math.min(cheapest, price);
      best = Math.max(best, price - cheapest);
    }
    return best;
  },

  'has-any-duplicate': (nums: number[]) => new Set(nums).size !== nums.length,

  'product-of-the-rest': (nums: number[]) => {
    const out = Array<number>(nums.length).fill(1);
    let prefix = 1;
    for (let i = 0; i < nums.length; i++) {
      out[i] = prefix;
      prefix *= nums[i]!;
    }
    let suffix = 1;
    for (let i = nums.length - 1; i >= 0; i--) {
      out[i]! *= suffix;
      suffix *= nums[i]!;
    }
    return out;
  },

  'largest-run-sum': (nums: number[]) => {
    if (nums.length === 0) return 0;
    let best = nums[0]!;
    let running = nums[0]!;
    for (let i = 1; i < nums.length; i++) {
      running = Math.max(nums[i]!, running + nums[i]!);
      best = Math.max(best, running);
    }
    return best;
  },

  'largest-run-product': (nums: number[]) => {
    if (nums.length === 0) return 0;
    let best = nums[0]!;
    let hi = nums[0]!;
    let lo = nums[0]!;
    for (let i = 1; i < nums.length; i++) {
      const n = nums[i]!;
      const candidates = [n, hi * n, lo * n];
      hi = Math.max(...candidates);
      lo = Math.min(...candidates);
      best = Math.max(best, hi);
    }
    return best;
  },

  'smallest-in-rotated': (nums: number[]) => {
    let lo = 0;
    let hi = nums.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (nums[mid]! > nums[hi]!) lo = mid + 1;
      else hi = mid;
    }
    return nums[lo];
  },

  'search-rotated-sorted': (nums: number[], target: number) => {
    let lo = 0;
    let hi = nums.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (nums[mid] === target) return mid;
      if (nums[lo]! <= nums[mid]!) {
        if (nums[lo]! <= target && target < nums[mid]!) hi = mid - 1;
        else lo = mid + 1;
      } else {
        if (nums[mid]! < target && target <= nums[hi]!) lo = mid + 1;
        else hi = mid - 1;
      }
    }
    return -1;
  },

  'triples-summing-to-zero': (nums: number[]) => {
    const sorted = [...nums].sort((a, b) => a - b);
    const out: number[][] = [];
    for (let i = 0; i < sorted.length - 2; i++) {
      if (i > 0 && sorted[i] === sorted[i - 1]) continue;
      let lo = i + 1;
      let hi = sorted.length - 1;
      while (lo < hi) {
        const sum = sorted[i]! + sorted[lo]! + sorted[hi]!;
        if (sum === 0) {
          out.push([sorted[i]!, sorted[lo]!, sorted[hi]!]);
          while (lo < hi && sorted[lo] === sorted[lo + 1]) lo++;
          while (lo < hi && sorted[hi] === sorted[hi - 1]) hi--;
          lo++;
          hi--;
        } else if (sum < 0) lo++;
        else hi--;
      }
    }
    return out;
  },

  'largest-water-container': (heights: number[]) => {
    let lo = 0;
    let hi = heights.length - 1;
    let best = 0;
    while (lo < hi) {
      best = Math.max(best, Math.min(heights[lo]!, heights[hi]!) * (hi - lo));
      if (heights[lo]! < heights[hi]!) lo++;
      else hi--;
    }
    return best;
  },

  // --- bits ---
  'add-without-plus': (a: number, b: number) => {
    let x = a;
    let y = b;
    while (y !== 0) {
      const carry = (x & y) << 1;
      x ^= y;
      y = carry;
    }
    return x;
  },

  'count-set-bits': (n: number) => {
    let count = 0;
    let value = n;
    while (value > 0) {
      count += value % 2;
      value = Math.floor(value / 2);
    }
    return count;
  },

  'set-bits-up-to': (n: number) => {
    const out = [0];
    for (let i = 1; i <= n; i++) out.push(out[i >> 1]! + (i & 1));
    return out;
  },

  'missing-from-range': (nums: number[]) => {
    const n = nums.length;
    return (n * (n + 1)) / 2 - nums.reduce((sum, v) => sum + v, 0);
  },

  'reverse-32-bits': (n: number) => {
    let out = 0;
    let value = n;
    for (let i = 0; i < 32; i++) {
      out = out * 2 + (value % 2);
      value = Math.floor(value / 2);
    }
    return out;
  },
};
