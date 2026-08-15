/* eslint-disable @typescript-eslint/no-explicit-any */

export const STRING_SOLUTIONS: Record<string, (...args: any[]) => unknown> = {
  'longest-unique-window': (s: string) => {
    const lastSeen = new Map<string, number>();
    let best = 0;
    let start = 0;
    for (let i = 0; i < s.length; i++) {
      const ch = s[i]!;
      const prev = lastSeen.get(ch);
      if (prev !== undefined && prev >= start) start = prev + 1;
      lastSeen.set(ch, i);
      best = Math.max(best, i - start + 1);
    }
    return best;
  },

  'longest-run-after-swaps': (s: string, k: number) => {
    const counts = new Map<string, number>();
    let best = 0;
    let start = 0;
    let mostCommon = 0;
    for (let i = 0; i < s.length; i++) {
      const ch = s[i]!;
      counts.set(ch, (counts.get(ch) ?? 0) + 1);
      mostCommon = Math.max(mostCommon, counts.get(ch)!);
      while (i - start + 1 - mostCommon > k) {
        const out = s[start]!;
        counts.set(out, counts.get(out)! - 1);
        start++;
      }
      best = Math.max(best, i - start + 1);
    }
    return best;
  },

  'smallest-covering-window': (s: string, t: string) => {
    if (!t || s.length < t.length) return '';
    const need = new Map<string, number>();
    for (const ch of t) need.set(ch, (need.get(ch) ?? 0) + 1);

    let missing = t.length;
    let bestStart = 0;
    let bestLength = Infinity;
    let start = 0;

    for (let i = 0; i < s.length; i++) {
      const ch = s[i]!;
      const required = need.get(ch);
      if (required !== undefined) {
        if (required > 0) missing--;
        need.set(ch, required - 1);
      }

      while (missing === 0) {
        if (i - start + 1 < bestLength) {
          bestLength = i - start + 1;
          bestStart = start;
        }
        const out = s[start]!;
        const outCount = need.get(out);
        if (outCount !== undefined) {
          need.set(out, outCount + 1);
          if (outCount + 1 > 0) missing++;
        }
        start++;
      }
    }

    return bestLength === Infinity ? '' : s.slice(bestStart, bestStart + bestLength);
  },

  'same-letters-reordered': (a: string, b: string) =>
    a.length === b.length && [...a].sort().join('') === [...b].sort().join(''),

  'group-by-letters': (words: string[]) => {
    const groups = new Map<string, string[]>();
    for (const word of words) {
      const key = [...word].sort().join('');
      const bucket = groups.get(key);
      if (bucket) bucket.push(word);
      else groups.set(key, [word]);
    }
    return [...groups.values()];
  },

  'balanced-brackets': (s: string) => {
    const closers: Record<string, string> = { ')': '(', ']': '[', '}': '{' };
    const stack: string[] = [];
    for (const ch of s) {
      if (ch === '(' || ch === '[' || ch === '{') stack.push(ch);
      else if (stack.pop() !== closers[ch]) return false;
    }
    return stack.length === 0;
  },

  'clean-palindrome-check': (s: string) => {
    const cleaned = s.toLowerCase().replace(/[^a-z0-9]/g, '');
    return cleaned === [...cleaned].reverse().join('');
  },

  'longest-mirror-substring': (s: string) => {
    if (s.length === 0) return '';
    let bestStart = 0;
    let bestLength = 1;

    const expand = (left: number, right: number) => {
      let l = left;
      let r = right;
      while (l >= 0 && r < s.length && s[l] === s[r]) {
        l--;
        r++;
      }
      const length = r - l - 1;
      if (length > bestLength) {
        bestLength = length;
        bestStart = l + 1;
      }
    };

    for (let i = 0; i < s.length; i++) {
      expand(i, i);
      expand(i, i + 1);
    }
    return s.slice(bestStart, bestStart + bestLength);
  },

  'count-mirror-substrings': (s: string) => {
    let count = 0;
    const expand = (left: number, right: number) => {
      let l = left;
      let r = right;
      while (l >= 0 && r < s.length && s[l] === s[r]) {
        count++;
        l--;
        r++;
      }
    };
    for (let i = 0; i < s.length; i++) {
      expand(i, i);
      expand(i, i + 1);
    }
    return count;
  },

  // Length-prefixed encoding survives any separator appearing inside a word.
  'join-and-split': (words: string[]) => {
    const encoded = words.map((word) => `${word.length}#${word}`).join('');
    const out: string[] = [];
    let i = 0;
    while (i < encoded.length) {
      const hash = encoded.indexOf('#', i);
      const length = Number(encoded.slice(i, hash));
      out.push(encoded.slice(hash + 1, hash + 1 + length));
      i = hash + 1 + length;
    }
    return out;
  },
};
