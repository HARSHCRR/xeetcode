import assert from 'node:assert/strict';
import { test } from 'node:test';

import { applyMatchResult, expectedScore, updateRating } from './elo.js';

test('equal ratings expect a 50% score', () => {
  assert.equal(expectedScore(1200, 1200), 0.5);
});

test('a higher-rated player is expected to score above 50%', () => {
  assert.ok(expectedScore(1400, 1200) > 0.5);
  assert.ok(expectedScore(1200, 1400) < 0.5);
});

test('expected scores of the two sides sum to 1', () => {
  const a = expectedScore(1337, 1042);
  const b = expectedScore(1042, 1337);
  assert.ok(Math.abs(a + b - 1) < 1e-9);
});

test('evenly matched win moves the rating by half the K-factor', () => {
  assert.equal(updateRating(1200, 1200, 1), 1216);
  assert.equal(updateRating(1200, 1200, 0), 1184);
});

test('a draw between equal players is a no-op', () => {
  assert.equal(updateRating(1200, 1200, 0.5), 1200);
});

test('beating a much stronger player gains more than beating a peer', () => {
  const upset = updateRating(1000, 1600, 1) - 1000;
  const expected = updateRating(1000, 1000, 1) - 1000;
  assert.ok(upset > expected);
});

test('losing to a much weaker player costs more than losing to a peer', () => {
  const badLoss = 1600 - updateRating(1600, 1000, 0);
  const normalLoss = 1600 - updateRating(1600, 1600, 0);
  assert.ok(badLoss > normalLoss);
});

test('applyMatchResult is symmetric — points won equal points lost', () => {
  const { winnerRating, loserRating } = applyMatchResult(1200, 1200);
  assert.equal(winnerRating - 1200, 1200 - loserRating);
});

test('applyMatchResult uses pre-match ratings for both sides', () => {
  const { winnerRating, loserRating } = applyMatchResult(1500, 1300);
  assert.equal(winnerRating, updateRating(1500, 1300, 1));
  assert.equal(loserRating, updateRating(1300, 1500, 0));
});
