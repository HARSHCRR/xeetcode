/** Tunables shared by client and server, so both agree without duplication. */

/** Match lengths a player may pick, in minutes. */
export const TIMED_DURATION_MINUTES = [15, 20, 30] as const;
export type TimedDurationMinutes = (typeof TIMED_DURATION_MINUTES)[number];

/** Default when nothing is chosen. */
export const MATCH_DURATION_MS = 15 * 60 * 1000;

/** Narrows untrusted client input to an allowed duration. */
export function isTimedDuration(value: unknown): value is TimedDurationMinutes {
  return (
    typeof value === 'number' && (TIMED_DURATION_MINUTES as readonly number[]).includes(value)
  );
}

/** Cooldown enforced after a failed submission, to discourage brute-forcing tests. */
export const SUBMISSION_COOLDOWN_MS = 15 * 1000;

/** How long a disconnected player has to rejoin before forfeiting. */
export const RECONNECT_GRACE_MS = 20 * 1000;

/** Unclaimed friend lobbies expire after this long. */
export const LOBBY_TTL_MS = 10 * 60 * 1000;

/** Length of a shareable friend-lobby code. */
export const LOBBY_CODE_LENGTH = 6;

/**
 * Alphabet for lobby codes. Excludes 0/O/1/I so codes are unambiguous when
 * read aloud or retyped from a screenshot.
 */
export const LOBBY_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Starting rating for a brand-new player. */
export const DEFAULT_RATING = 1200;

/** Elo K-factor. */
export const ELO_K_FACTOR = 32;
