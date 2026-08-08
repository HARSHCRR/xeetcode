import { randomUUID } from 'node:crypto';

import { isTopicSelection, toPublicProblem } from '@xeetcode/shared';
import type {
  ClientToServerEvents,
  MatchFoundPayload,
  ServerToClientEvents,
  TopicSelection,
} from '@xeetcode/shared';
import type { Server, Socket } from 'socket.io';

import { LobbyRegistry } from '../matchmaking/lobby.js';
import { MatchRegistry } from '../matchmaking/matches.js';
import type { LiveMatch } from '../matchmaking/matches.js';
import { MatchmakingQueue } from '../matchmaking/queue.js';
import type { QueuedPlayer } from '../matchmaking/queue.js';
import { pickProblem } from '../problems/repository.js';

type XeetSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
type XeetServer = Server<ClientToServerEvents, ServerToClientEvents>;

const MAX_NAME_LENGTH = 20;

/** Trims and bounds a client-supplied display name. */
function sanitizeName(raw: unknown): string {
  if (typeof raw !== 'string') return 'Anonymous';
  const trimmed = raw.trim().slice(0, MAX_NAME_LENGTH);
  return trimmed.length > 0 ? trimmed : 'Anonymous';
}

export interface HandlerContext {
  queue: MatchmakingQueue;
  lobbies: LobbyRegistry;
  matches: MatchRegistry;
}

export function createContext(): HandlerContext {
  return {
    queue: new MatchmakingQueue(),
    lobbies: new LobbyRegistry(),
    matches: new MatchRegistry(),
  };
}

/** Builds the per-player `match:found` payload (each side sees the other's name). */
function matchFoundFor(match: LiveMatch, userId: string): MatchFoundPayload | undefined {
  const [a, b] = match.players;
  const self = a.userId === userId ? a : b.userId === userId ? b : undefined;
  const opponent = a.userId === userId ? b : a;
  if (!self) return undefined;

  return {
    matchId: match.id,
    userId: self.userId,
    problem: toPublicProblem(match.problem),
    opponentName: opponent.name,
    mode: match.mode,
    startedAt: match.startedAt,
    endsAt: match.endsAt,
  };
}

/**
 * Creates a match from two paired players and tells both about it.
 * Shared by the matchmaking and friend-lobby paths so they can't diverge.
 */
function startMatch(
  io: XeetServer,
  ctx: HandlerContext,
  mode: 'online' | 'friend',
  topic: TopicSelection,
  first: { socketId: string; userId: string; name: string },
  second: { socketId: string; userId: string; name: string },
): void {
  const problem = pickProblem(topic);
  if (!problem) {
    const message = 'No problems are available right now.';
    io.to(first.socketId).emit('lobby:error', { message });
    io.to(second.socketId).emit('lobby:error', { message });
    return;
  }

  const match = ctx.matches.create({
    problem,
    mode,
    players: [
      { userId: first.userId, name: first.name, socketId: first.socketId },
      { userId: second.userId, name: second.name, socketId: second.socketId },
    ],
  });

  for (const player of match.players) {
    if (!player.socketId) continue;
    io.sockets.sockets.get(player.socketId)?.join(match.id);
    const payload = matchFoundFor(match, player.userId);
    if (payload) io.to(player.socketId).emit('match:found', payload);
  }

  console.log(`[match] ${match.id} started (${mode}, ${problem.slug})`);
}

export function registerHandlers(io: XeetServer, ctx: HandlerContext): void {
  io.on('connection', (socket: XeetSocket) => {
    console.log(`[socket] connected: ${socket.id}`);

    socket.on('queue:join', (payload) => {
      const topic: TopicSelection = isTopicSelection(payload?.topic) ? payload.topic : 'random';
      const player: QueuedPlayer = {
        socketId: socket.id,
        userId: randomUUID(),
        name: sanitizeName(payload?.name),
        topic,
        joinedAt: Date.now(),
      };

      const pairing = ctx.queue.join(player);

      if (!pairing) {
        socket.emit('queue:waiting', { topic, queueSize: ctx.queue.size(topic) });
        return;
      }

      startMatch(io, ctx, 'online', topic, pairing.first, pairing.second);
    });

    socket.on('queue:leave', () => {
      ctx.queue.leaveBySocket(socket.id);
    });

    socket.on('lobby:create', (payload) => {
      const topic: TopicSelection = isTopicSelection(payload?.topic) ? payload.topic : 'random';
      const lobby = ctx.lobbies.create({
        hostSocketId: socket.id,
        hostUserId: randomUUID(),
        hostName: sanitizeName(payload?.name),
        topic,
      });

      socket.emit('lobby:created', { code: lobby.code });
    });

    socket.on('lobby:join', (payload) => {
      const code = typeof payload?.code === 'string' ? payload.code : '';
      const result = ctx.lobbies.claim(code, socket.id);

      if (!result.ok) {
        socket.emit('lobby:error', {
          message:
            result.reason === 'own_lobby'
              ? "That's your own lobby code — share it with a friend."
              : 'That lobby code is invalid or has expired.',
        });
        return;
      }

      const { lobby } = result;

      // The host may have closed the tab while waiting.
      if (!io.sockets.sockets.get(lobby.hostSocketId)) {
        socket.emit('lobby:error', { message: 'The host is no longer connected.' });
        return;
      }

      startMatch(
        io,
        ctx,
        'friend',
        lobby.topic,
        {
          socketId: lobby.hostSocketId,
          userId: lobby.hostUserId,
          name: lobby.hostName,
        },
        { socketId: socket.id, userId: randomUUID(), name: sanitizeName(payload?.name) },
      );
    });

    socket.on('match:rejoin', (payload) => {
      const match = payload?.matchId ? ctx.matches.get(payload.matchId) : undefined;
      if (!match || !payload?.userId) return;

      const sides = ctx.matches.sides(match, payload.userId);
      if (!sides) return;

      sides.self.socketId = socket.id;
      socket.join(match.id);

      socket.emit('match:state', {
        matchId: match.id,
        problem: toPublicProblem(match.problem),
        opponentName: sides.opponent.name,
        mode: match.mode,
        startedAt: match.startedAt,
        endsAt: match.endsAt,
        attemptCount: sides.self.attemptCount,
        opponentAttemptCount: sides.opponent.attemptCount,
        chatHistory: [],
      });

      if (sides.opponent.socketId) {
        io.to(sides.opponent.socketId).emit('opponent:reconnected');
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`[socket] disconnected: ${socket.id} (${reason})`);

      ctx.queue.leaveBySocket(socket.id);
      ctx.lobbies.removeByHostSocket(socket.id);

      // Detach rather than end: Phase 4 adds the grace timer and forfeit.
      const detached = ctx.matches.detachSocket(socket.id);
      if (!detached) return;

      const opponent = detached.match.players.find((player) => player !== detached.player);
      if (opponent?.socketId) {
        io.to(opponent.socketId).emit('opponent:disconnected', { gracePeriodMs: 0 });
      }
    });
  });
}
