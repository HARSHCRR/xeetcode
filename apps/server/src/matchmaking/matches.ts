import { randomUUID } from 'node:crypto';

import { MATCH_DURATION_MS } from '@xeetcode/shared';
import type { ChatMessagePayload, MatchMode, Problem } from '@xeetcode/shared';

export interface MatchPlayer {
  userId: string;
  name: string;
  /** Current socket, or null while disconnected. */
  socketId: string | null;
  attemptCount: number;
  ratingBefore: number;
  /** Epoch ms before which further submissions are rejected. */
  cooldownUntil: number;
  /** Last source they submitted, so a refresh restores their work. */
  lastCode?: string;
}

export interface LiveMatch {
  id: string;
  problem: Problem;
  mode: MatchMode;
  players: [MatchPlayer, MatchPlayer];
  startedAt: number;
  endsAt: number;
  chat: ChatMessagePayload[];
  /** Set once the match is over, so late submissions can't resurrect it. */
  finished: boolean;
  timer?: NodeJS.Timeout;
}

/**
 * Live matches held in memory, indexed for the lookups the socket layer makes:
 * by match id, and by the socket that just did something.
 */
export class MatchRegistry {
  private readonly matches = new Map<string, LiveMatch>();

  create(options: {
    problem: Problem;
    mode: MatchMode;
    players: [
      Pick<MatchPlayer, 'userId' | 'name' | 'socketId' | 'ratingBefore'>,
      Pick<MatchPlayer, 'userId' | 'name' | 'socketId' | 'ratingBefore'>,
    ];
    durationMs?: number;
    /** Invoked when the clock runs out with nobody having solved it. */
    onExpire?: (match: LiveMatch) => void;
  }): LiveMatch {
    const startedAt = Date.now();
    const duration = options.durationMs ?? MATCH_DURATION_MS;

    const match: LiveMatch = {
      id: randomUUID(),
      problem: options.problem,
      mode: options.mode,
      players: [
        { ...options.players[0], attemptCount: 0, cooldownUntil: 0 },
        { ...options.players[1], attemptCount: 0, cooldownUntil: 0 },
      ],
      startedAt,
      endsAt: startedAt + duration,
      chat: [],
      finished: false,
    };

    // The server owns the clock. The client renders a countdown from `endsAt`,
    // but only this timer can actually end the match — otherwise a player could
    // stall their own clock by tampering with the page.
    if (options.onExpire) {
      match.timer = setTimeout(() => {
        if (!match.finished) options.onExpire?.(match);
      }, duration);
      match.timer.unref?.();
    }

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

  sides(match: LiveMatch, userId: string): { self: MatchPlayer; opponent: MatchPlayer } | undefined {
    const [a, b] = match.players;
    if (a.userId === userId) return { self: a, opponent: b };
    if (b.userId === userId) return { self: b, opponent: a };
    return undefined;
  }

  /** Marks a match over and stops its timer. Idempotent. */
  finish(match: LiveMatch): void {
    match.finished = true;
    if (match.timer) {
      clearTimeout(match.timer);
      match.timer = undefined;
    }
    // Keep the record briefly so a late rejoin sees the result rather than a
    // blank room, then release the memory.
    setTimeout(() => this.matches.delete(match.id), 60_000).unref?.();
  }

  detachSocket(socketId: string): { match: LiveMatch; player: MatchPlayer } | undefined {
    const match = this.findBySocket(socketId);
    if (!match) return undefined;

    const player = match.players.find((candidate) => candidate.socketId === socketId);
    if (!player) return undefined;

    player.socketId = null;
    return { match, player };
  }

  remove(matchId: string): void {
    const match = this.matches.get(matchId);
    if (match?.timer) clearTimeout(match.timer);
    this.matches.delete(matchId);
  }

  size(): number {
    return this.matches.size;
  }

  /** Clears every pending timer so a test process can exit promptly. */
  dispose(): void {
    for (const match of this.matches.values()) {
      if (match.timer) clearTimeout(match.timer);
    }
    this.matches.clear();
  }
}
