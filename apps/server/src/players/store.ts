import { DEFAULT_RATING } from '@xeetcode/shared';

import { getPool } from '../db/client.js';

export interface Player {
  id: string;
  name: string;
  rating: number;
}

/**
 * Ratings for players who have no database behind them.
 *
 * Local development runs without DATABASE_URL, and Elo changes are far easier
 * to see working if they survive at least the process lifetime.
 */
const memoryPlayers = new Map<string, Player>();

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/**
 * Loads a player by their browser-held id, creating them at the default rating
 * on first sight. The name is refreshed each time, so changing it on the
 * landing page carries into the next match.
 */
export async function getOrCreatePlayer(id: string, name: string): Promise<Player> {
  const pool = getPool();

  // The id column is a UUID; a client sending anything else would error the
  // query, so fall back to memory rather than rejecting the player.
  if (!pool || !isUuid(id)) {
    const existing = memoryPlayers.get(id);
    const player: Player = { id, name, rating: existing?.rating ?? DEFAULT_RATING };
    memoryPlayers.set(id, player);
    return player;
  }

  try {
    const result = await pool.query<{ id: string; name: string; rating: number }>(
      `INSERT INTO users (id, name)
       VALUES ($1, $2)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
       RETURNING id, name, rating`,
      [id, name],
    );

    const row = result.rows[0];
    if (row) return { id: row.id, name: row.name, rating: row.rating };
  } catch (error) {
    console.error('[players] lookup failed, falling back to memory:', error);
  }

  const player: Player = { id, name, rating: memoryPlayers.get(id)?.rating ?? DEFAULT_RATING };
  memoryPlayers.set(id, player);
  return player;
}

/** Writes a player's new rating after a decisive match. */
export async function saveRating(id: string, rating: number): Promise<void> {
  const cached = memoryPlayers.get(id);
  if (cached) memoryPlayers.set(id, { ...cached, rating });

  const pool = getPool();
  if (!pool || !isUuid(id)) return;

  try {
    await pool.query('UPDATE users SET rating = $2 WHERE id = $1', [id, rating]);
  } catch (error) {
    console.error('[players] rating update failed:', error);
  }
}

export interface MatchRecord {
  id: string;
  problemId: string;
  topic: string;
  mode: 'online' | 'friend';
  player1Id: string;
  player2Id: string;
  winnerId: string | null;
  player1RatingBefore: number;
  player2RatingBefore: number;
  player1RatingAfter: number;
  player2RatingAfter: number;
  status: 'completed' | 'draw' | 'abandoned';
  startedAt: Date;
  endedAt: Date;
}

/**
 * Records a finished match. Best-effort: a persistence failure must not stop
 * the result screen from reaching the players.
 */
export async function recordMatch(record: MatchRecord): Promise<void> {
  const pool = getPool();
  if (!pool) return;

  try {
    await pool.query(
      `INSERT INTO matches (
         id, problem_id, topic, mode, player1_id, player2_id, winner_id,
         player1_rating_before, player2_rating_before,
         player1_rating_after, player2_rating_after,
         status, started_at, ended_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       ON CONFLICT (id) DO NOTHING`,
      [
        record.id,
        record.problemId,
        record.topic,
        record.mode,
        record.player1Id,
        record.player2Id,
        record.winnerId,
        record.player1RatingBefore,
        record.player2RatingBefore,
        record.player1RatingAfter,
        record.player2RatingAfter,
        record.status,
        record.startedAt,
        record.endedAt,
      ],
    );
  } catch (error) {
    console.error('[matches] persistence failed:', error);
  }
}

/** Test seam. */
export function resetPlayersForTesting(): void {
  memoryPlayers.clear();
}
