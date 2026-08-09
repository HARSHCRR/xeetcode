import { randomInt } from 'node:crypto';

import { LOBBY_CODE_ALPHABET, LOBBY_CODE_LENGTH, LOBBY_TTL_MS } from '@xeetcode/shared';
import type { TopicSelection } from '@xeetcode/shared';

export interface Lobby {
  code: string;
  hostSocketId: string;
  hostUserId: string;
  hostName: string;
  hostRating: number;
  topic: TopicSelection;
  createdAt: number;
}

export type JoinFailure = 'not_found' | 'own_lobby';

export type JoinResult = { ok: true; lobby: Lobby } | { ok: false; reason: JoinFailure };

/**
 * Private friend lobbies, keyed by a short shareable code.
 *
 * Codes are generated with `randomInt` rather than `Math.random`: they're the
 * only thing protecting a private lobby, and a predictable sequence would let
 * someone guess their way into a friend's match.
 */
export class LobbyRegistry {
  private readonly lobbies = new Map<string, Lobby>();
  private readonly expiryTimers = new Map<string, NodeJS.Timeout>();

  constructor(private readonly ttlMs: number = LOBBY_TTL_MS) {}

  private generateCode(): string {
    // Retry on collision. With a 32-character alphabet over 6 slots the space
    // is ~10^9, so this effectively never loops, but a duplicate code would
    // silently hijack someone else's lobby.
    for (let attempt = 0; attempt < 10; attempt++) {
      let code = '';
      for (let i = 0; i < LOBBY_CODE_LENGTH; i++) {
        code += LOBBY_CODE_ALPHABET[randomInt(LOBBY_CODE_ALPHABET.length)];
      }
      if (!this.lobbies.has(code)) return code;
    }
    throw new Error('Could not generate an unused lobby code');
  }

  create(host: Omit<Lobby, 'code' | 'createdAt'>): Lobby {
    // One lobby per host, so repeated clicks don't leak abandoned codes.
    this.removeByHostSocket(host.hostSocketId);

    const lobby: Lobby = { ...host, code: this.generateCode(), createdAt: Date.now() };
    this.lobbies.set(lobby.code, lobby);

    const timer = setTimeout(() => this.remove(lobby.code), this.ttlMs);
    // Don't hold the process open just because a lobby is pending.
    timer.unref?.();
    this.expiryTimers.set(lobby.code, timer);

    return lobby;
  }

  /**
   * Claims a lobby by code. Consumes it on success — a code is single-use, so
   * a third person with the link can't join an already-started match.
   */
  claim(code: string, joinerSocketId: string): JoinResult {
    const lobby = this.lobbies.get(this.normalize(code));
    if (!lobby) return { ok: false, reason: 'not_found' };
    if (lobby.hostSocketId === joinerSocketId) return { ok: false, reason: 'own_lobby' };

    this.remove(lobby.code);
    return { ok: true, lobby };
  }

  /** Codes are shown uppercase; accept whatever casing the user typed. */
  private normalize(code: string): string {
    return code.trim().toUpperCase();
  }

  remove(code: string): void {
    this.lobbies.delete(code);
    const timer = this.expiryTimers.get(code);
    if (timer) {
      clearTimeout(timer);
      this.expiryTimers.delete(code);
    }
  }

  /** Called when a host disconnects before anyone joins. */
  removeByHostSocket(socketId: string): Lobby | undefined {
    for (const lobby of this.lobbies.values()) {
      if (lobby.hostSocketId === socketId) {
        this.remove(lobby.code);
        return lobby;
      }
    }
    return undefined;
  }

  get(code: string): Lobby | undefined {
    return this.lobbies.get(this.normalize(code));
  }

  size(): number {
    return this.lobbies.size;
  }

  /** Clears pending timers so a test process can exit promptly. */
  dispose(): void {
    for (const timer of this.expiryTimers.values()) clearTimeout(timer);
    this.expiryTimers.clear();
    this.lobbies.clear();
  }
}
