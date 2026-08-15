/** Points per hidden test passed on the player's best submission. */
export const POINTS_PER_TEST = 10;

/** Points deducted per submission, rewarding thinking over brute force. */
export const PENALTY_PER_ATTEMPT = 2;

/** One-off bonus for passing every test. */
export const FULL_PASS_BONUS = 50;

export interface ScoreInput {
  /** Best number of tests passed across all of this player's submissions. */
  bestPassedCount: number;
  totalTests: number;
  attempts: number;
}

/**
 * Match score for one player.
 *
 * Uses the player's *best* submission rather than their latest, so trying a
 * riskier idea after a partial success can't lose them ground they'd already
 * earned. Attempts still cost, which is what keeps it from being free to
 * shotgun submissions.
 *
 * Floored at zero: a negative score reads as a bug to a player, and the
 * ordering above zero is what decides the match anyway.
 */
export function matchScore({ bestPassedCount, totalTests, attempts }: ScoreInput): number {
  const solved = totalTests > 0 && bestPassedCount === totalTests;
  const raw =
    bestPassedCount * POINTS_PER_TEST -
    attempts * PENALTY_PER_ATTEMPT +
    (solved ? FULL_PASS_BONUS : 0);

  return Math.max(0, raw);
}
