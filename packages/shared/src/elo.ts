import { ELO_K_FACTOR } from './constants.js';

/** Score from the perspective of one player. */
export type EloScore = 0 | 0.5 | 1;

export interface EloOutcome {
  playerRating: number;
  opponentRating: number;
}

/**
 * Expected score for `playerRating` against `opponentRating`, in [0, 1].
 * Standard Elo logistic curve with a 400-point scale.
 */
export function expectedScore(playerRating: number, opponentRating: number): number {
  return 1 / (1 + 10 ** ((opponentRating - playerRating) / 400));
}

/**
 * New rating for a single player after one game.
 *
 * Rounded to an integer because ratings are stored as INTEGER; rounding here
 * (rather than at the DB boundary) keeps the two players' deltas consistent
 * with what each of them is shown on the result screen.
 */
export function updateRating(
  playerRating: number,
  opponentRating: number,
  score: EloScore,
  kFactor: number = ELO_K_FACTOR,
): number {
  const expected = expectedScore(playerRating, opponentRating);
  return Math.round(playerRating + kFactor * (score - expected));
}

/**
 * Both players' new ratings after a decisive match.
 *
 * Both are computed from the *pre-match* ratings, so the pair of updates is
 * symmetric regardless of the order they're applied in.
 */
export function applyMatchResult(
  winnerRating: number,
  loserRating: number,
  kFactor: number = ELO_K_FACTOR,
): { winnerRating: number; loserRating: number } {
  return {
    winnerRating: updateRating(winnerRating, loserRating, 1, kFactor),
    loserRating: updateRating(loserRating, winnerRating, 0, kFactor),
  };
}
