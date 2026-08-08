import { randomUUID } from 'node:crypto';

import { MATCH_DURATION_MS } from '@xeetcode/shared';
import type { MatchMode, Problem } from '@xeetcode/shared';

export interface MatchPlayer {
  userId: string;
  name: string;
  /** Current socket, or null while disconnected inside the grace window. */
  socketId: string | null;
  attemptCount: number;
}

export interface LiveMatch {
  id: string;
  problem: Problem;
  mode: MatchMode;
  players: [MatchPlayer, MatchPlayer];
  startedAt: number;
  endsAt: number;
}

/**
 * Live matches held in memory, indexed for the two lookups the socket layer
 * actually performs: by match id, and by the socket that just did something.
 *
 * Phase 2 only tracks membership and routing. The timer, judging, chat history,
 * and result persistence arrive in Phases 3 and 4.
 */
export class MatchRegistry {
  private readonly matches = new Map<string, LiveMatch>();

  create(options: {
    problem: Problem;
    mode: MatchMode;
    players: [Omit<MatchPlayer, 'attemptCount'>, Omit<MatchPlayer, 'attemptCount'>];
    durationMs?: number;
  }): LiveMatch {
    const startedAt = Date.now();
    const match: LiveMatch = {
      id: randomUUID(),
      problem: options.problem,
      mode: options.mode,
      players: [
        { ...options.players[0], attemptCount: 0 },
        { ...options.players[1], attemptCount: 0 },
      ],
      startedAt,
      endsAt: startedAt + (options.durationMs ?? MATCH_DURATION_MS),
    };

    this.matches.set(match.id, match);
    return match;
  }

  get(matchId: string): LiveMatch | undefined {
    return this.matches.get(matchId);
  }

  findBySocket(socketId: string): LiveMatch | undefined {
    for (const match of this.matches.values()) {
      if (match.players.some((player) => player.socketId === socketId)) return match;
    }
    return undefined;
  }

  /** The player in `match` identified by `userId`, and their opponent. */
  sides(match: LiveMatch, userId: string): { self: MatchPlayer; opponent: MatchPlayer } | undefined {
    const [a, b] = match.players;
    if (a.userId === userId) return { self: a, opponent: b };
    if (b.userId === userId) return { self: b, opponent: a };
    return undefined;
  }

  /** Detaches a socket without ending the match, so a rejoin can reattach. */
  detachSocket(socketId: string): { match: LiveMatch; player: MatchPlayer } | undefined {
    const match = this.findBySocket(socketId);
    if (!match) return undefined;

    const player = match.players.find((candidate) => candidate.socketId === socketId);
    if (!player) return undefined;

    player.socketId = null;
    return { match, player };
  }

  remove(matchId: string): void {
    this.matches.delete(matchId);
  }

  size(): number {
    return this.matches.size;
  }
}
