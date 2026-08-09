import type { TopicSelection } from '@xeetcode/shared';

export interface QueuedPlayer {
  socketId: string;
  userId: string;
  name: string;
  /** Captured at queue time so both sides settle Elo from match-start values. */
  rating: number;
  topic: TopicSelection;
  joinedAt: number;
}

export interface Pairing {
  first: QueuedPlayer;
  second: QueuedPlayer;
}

/**
 * In-memory matchmaking queues, one bucket per topic selection.
 *
 * `random` is its own bucket by product decision: a player who picks Random is
 * only paired with another Random player, never pulled into a specific-topic
 * queue. That keeps "I asked for Arrays" a promise rather than a preference.
 *
 * Single-process only, which is fine at this scale — see the Phase 0 design's
 * note on horizontal scaling needing Redis.
 */
export class MatchmakingQueue {
  private readonly buckets = new Map<TopicSelection, QueuedPlayer[]>();

  /**
   * Adds a player and returns a pairing if one is now possible.
   *
   * Pairs the two longest-waiting players (FIFO) so nobody starves behind a
   * steady stream of arrivals.
   */
  join(player: QueuedPlayer): Pairing | undefined {
    // A player re-queueing (double-click, reconnect) must not end up matched
    // against themselves or occupy two slots.
    this.leaveBySocket(player.socketId);

    const bucket = this.buckets.get(player.topic) ?? [];
    bucket.push(player);
    this.buckets.set(player.topic, bucket);

    if (bucket.length < 2) return undefined;

    const first = bucket.shift()!;
    const second = bucket.shift()!;
    return { first, second };
  }

  /** Removes a player from whichever bucket holds them. Safe to call blindly. */
  leaveBySocket(socketId: string): QueuedPlayer | undefined {
    for (const [topic, bucket] of this.buckets) {
      const index = bucket.findIndex((player) => player.socketId === socketId);
      if (index === -1) continue;

      const [removed] = bucket.splice(index, 1);
      if (bucket.length === 0) this.buckets.delete(topic);
      return removed;
    }
    return undefined;
  }

  /** How many players are waiting on a topic. */
  size(topic: TopicSelection): number {
    return this.buckets.get(topic)?.length ?? 0;
  }

  totalWaiting(): number {
    let total = 0;
    for (const bucket of this.buckets.values()) total += bucket.length;
    return total;
  }
}
