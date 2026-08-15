/** Marker both harnesses print their JSON verdict behind. */
export const RESULT_MARKER = '__XEETCODE_RESULT__';

export interface CaseVerdict {
  pass: boolean;
  /** Only ever populated for visible sample cases. */
  actual?: string;
  expected?: string;
}

export interface RawVerdict {
  results: CaseVerdict[];
  error?: string;
}

/**
 * Extracts the verdict from stdout, ignoring anything the player printed.
 *
 * Reads the *last* marker so a submission that prints a fake verdict of its own
 * cannot win the match — the real one is always emitted last.
 */
export function parseVerdict(stdout: string): RawVerdict | undefined {
  const start = stdout.lastIndexOf(RESULT_MARKER);
  if (start === -1) return undefined;

  const line = stdout.slice(start + RESULT_MARKER.length).split('\n')[0];
  if (!line) return undefined;

  try {
    const parsed: unknown = JSON.parse(line);
    if (typeof parsed === 'object' && parsed !== null && 'results' in parsed) {
      return parsed as RawVerdict;
    }
  } catch {
    // Malformed — the caller treats this as a failed run.
  }
  return undefined;
}
