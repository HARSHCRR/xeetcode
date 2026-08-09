import {
  applyMatchResult,
  isTopicSelection,
  SUBMISSION_COOLDOWN_MS,
  toPublicProblem,
} from '@xeetcode/shared';
import type {
  ChatMessagePayload,
  ClientToServerEvents,
  MatchFoundPayload,
  ServerToClientEvents,
  TopicSelection,
} from '@xeetcode/shared';
import type { Server, Socket } from 'socket.io';

import { judgeSubmission } from '../judge/index.js';
import { LobbyRegistry } from '../matchmaking/lobby.js';
import { MatchRegistry } from '../matchmaking/matches.js';
import type { LiveMatch, MatchPlayer } from '../matchmaking/matches.js';
import { MatchmakingQueue } from '../matchmaking/queue.js';
import type { QueuedPlayer } from '../matchmaking/queue.js';
import { getOrCreatePlayer, recordMatch, saveRating } from '../players/store.js';
import { pickProblem } from '../problems/repository.js';

type XeetSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
type XeetServer = Server<ClientToServerEvents, ServerToClientEvents>;

const MAX_NAME_LENGTH = 20;
const MAX_CHAT_LENGTH = 500;
const MAX_CODE_LENGTH = 20_000;
const MAX_CHAT_HISTORY = 200;

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
    rating: self.ratingBefore,
    opponentRating: opponent.ratingBefore,
    mode: match.mode,
    startedAt: match.startedAt,
    endsAt: match.endsAt,
  };
}

/**
 * Ends a match: settles Elo, persists the record, and tells both players.
 *
 * Ratings are computed from the values captured at match start, so the pair of
 * updates is symmetric no matter what else either player has been doing.
 */
async function endMatch(
  io: XeetServer,
  ctx: HandlerContext,
  match: LiveMatch,
  outcome: { winner?: MatchPlayer; status: 'completed' | 'draw' | 'abandoned' },
): Promise<void> {
  if (match.finished) return;
  ctx.matches.finish(match);

  const [first, second] = match.players;
  const { winner, status } = outcome;

  let firstAfter = first.ratingBefore;
  let secondAfter = second.ratingBefore;

  // A draw or an abandoned match leaves ratings untouched, per the design.
  if (winner && status === 'completed') {
    const loser = winner === first ? second : first;
    const settled = applyMatchResult(winner.ratingBefore, loser.ratingBefore);

    if (winner === first) {
      firstAfter = settled.winnerRating;
      secondAfter = settled.loserRating;
    } else {
      secondAfter = settled.winnerRating;
      firstAfter = settled.loserRating;
    }

    await Promise.all([saveRating(first.userId, firstAfter), saveRating(second.userId, secondAfter)]);
  }

  const endedAt = new Date();

  for (const player of match.players) {
    const after = player === first ? firstAfter : secondAfter;
    const won = winner?.userId === player.userId;

    if (!player.socketId) continue;
    io.to(player.socketId).emit('match:end', {
      matchId: match.id,
      result: status === 'draw' ? 'draw' : won ? 'win' : status === 'abandoned' ? 'win' : 'loss',
      status,
      winnerId: winner?.userId ?? null,
      winnerName: winner?.name ?? null,
      ratingBefore: player.ratingBefore,
      ratingAfter: after,
      ratingChange: after - player.ratingBefore,
    });
  }

  await recordMatch({
    id: match.id,
    problemId: match.problem.id,
    topic: match.problem.topic,
    mode: match.mode,
    player1Id: first.userId,
    player2Id: second.userId,
    winnerId: winner?.userId ?? null,
    player1RatingBefore: first.ratingBefore,
    player2RatingBefore: second.ratingBefore,
    player1RatingAfter: firstAfter,
    player2RatingAfter: secondAfter,
    status,
    startedAt: new Date(match.startedAt),
    endedAt,
  });

  console.log(`[match] ${match.id} ended (${status})`);
}

function startMatch(
  io: XeetServer,
  ctx: HandlerContext,
  mode: 'online' | 'friend',
  topic: TopicSelection,
  first: { socketId: string; userId: string; name: string; rating: number },
  second: { socketId: string; userId: string; name: string; rating: number },
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
      {
        userId: first.userId,
        name: first.name,
        socketId: first.socketId,
        ratingBefore: first.rating,
      },
      {
        userId: second.userId,
        name: second.name,
        socketId: second.socketId,
        ratingBefore: second.rating,
      },
    ],
    // Timer expiry with nobody solving it is a draw — no rating change.
    onExpire: (expired) => {
      void endMatch(io, ctx, expired, { status: 'draw' });
    },
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
      void (async () => {
        const topic: TopicSelection = isTopicSelection(payload?.topic) ? payload.topic : 'random';
        const identity = await getOrCreatePlayer(
          String(payload?.playerId ?? ''),
          sanitizeName(payload?.name),
        );

        const player: QueuedPlayer = {
          socketId: socket.id,
          userId: identity.id,
          name: identity.name,
          rating: identity.rating,
          topic,
          joinedAt: Date.now(),
        };

        const pairing = ctx.queue.join(player);
        if (!pairing) {
          socket.emit('queue:waiting', { topic, queueSize: ctx.queue.size(topic) });
          return;
        }

        startMatch(io, ctx, 'online', topic, pairing.first, pairing.second);
      })();
    });

    socket.on('queue:leave', () => {
      ctx.queue.leaveBySocket(socket.id);
    });

    socket.on('lobby:create', (payload) => {
      void (async () => {
        const topic: TopicSelection = isTopicSelection(payload?.topic) ? payload.topic : 'random';
        const identity = await getOrCreatePlayer(
          String(payload?.playerId ?? ''),
          sanitizeName(payload?.name),
        );

        const lobby = ctx.lobbies.create({
          hostSocketId: socket.id,
          hostUserId: identity.id,
          hostName: identity.name,
          hostRating: identity.rating,
          topic,
        });

        socket.emit('lobby:created', { code: lobby.code });
      })();
    });

    socket.on('lobby:join', (payload) => {
      void (async () => {
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
        if (!io.sockets.sockets.get(lobby.hostSocketId)) {
          socket.emit('lobby:error', { message: 'The host is no longer connected.' });
          return;
        }

        const joiner = await getOrCreatePlayer(
          String(payload?.playerId ?? ''),
          sanitizeName(payload?.name),
        );

        startMatch(
          io,
          ctx,
          'friend',
          lobby.topic,
          {
            socketId: lobby.hostSocketId,
            userId: lobby.hostUserId,
            name: lobby.hostName,
            rating: lobby.hostRating,
          },
          {
            socketId: socket.id,
            userId: joiner.id,
            name: joiner.name,
            rating: joiner.rating,
          },
        );
      })();
    });

    socket.on('match:submit', (payload) => {
      void (async () => {
        const match = payload?.matchId ? ctx.matches.get(payload.matchId) : undefined;
        if (!match || match.finished) return;

        const player = match.players.find((candidate) => candidate.socketId === socket.id);
        if (!player) return;

        const now = Date.now();
        if (now < player.cooldownUntil) {
          socket.emit('match:submissionResult', {
            passed: false,
            passedCount: 0,
            totalCount: match.problem.testCases.length,
            cooldownUntil: player.cooldownUntil,
          });
          return;
        }

        const code = typeof payload.code === 'string' ? payload.code.slice(0, MAX_CODE_LENGTH) : '';
        player.lastCode = code;
        player.attemptCount += 1;

        const opponent = match.players.find((candidate) => candidate !== player);
        if (opponent?.socketId) {
          // The opponent learns only that an attempt happened — never the code
          // or whether it passed.
          io.to(opponent.socketId).emit('match:opponentSubmitted', {
            attemptCount: player.attemptCount,
          });
        }

        const verdict = await judgeSubmission(match.problem, code);

        // The clock may have run out while the judge was running.
        if (match.finished) return;

        if (verdict.passed) {
          socket.emit('match:submissionResult', verdict);
          await endMatch(io, ctx, match, { winner: player, status: 'completed' });
          return;
        }

        player.cooldownUntil = Date.now() + SUBMISSION_COOLDOWN_MS;
        socket.emit('match:submissionResult', { ...verdict, cooldownUntil: player.cooldownUntil });
      })();
    });

    socket.on('chat:message', (payload) => {
      const match = payload?.matchId ? ctx.matches.get(payload.matchId) : undefined;
      if (!match) return;

      const player = match.players.find((candidate) => candidate.socketId === socket.id);
      if (!player) return;

      const text = typeof payload.text === 'string' ? payload.text.trim().slice(0, MAX_CHAT_LENGTH) : '';
      if (!text) return;

      const message: ChatMessagePayload = {
        fromUserId: player.userId,
        from: player.name,
        text,
        timestamp: Date.now(),
      };

      match.chat.push(message);
      if (match.chat.length > MAX_CHAT_HISTORY) match.chat.shift();

      io.to(match.id).emit('chat:message', message);
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
        userId: sides.self.userId,
        problem: toPublicProblem(match.problem),
        opponentName: sides.opponent.name,
        rating: sides.self.ratingBefore,
        opponentRating: sides.opponent.ratingBefore,
        mode: match.mode,
        startedAt: match.startedAt,
        endsAt: match.endsAt,
        attemptCount: sides.self.attemptCount,
        opponentAttemptCount: sides.opponent.attemptCount,
        ...(sides.self.lastCode ? { lastCode: sides.self.lastCode } : {}),
        chatHistory: match.chat,
      });

      if (sides.opponent.socketId) {
        io.to(sides.opponent.socketId).emit('opponent:reconnected');
      }
    });

    socket.on('match:leave', (payload) => {
      void (async () => {
        const match = payload?.matchId ? ctx.matches.get(payload.matchId) : undefined;
        if (!match || match.finished) return;

        const player = match.players.find((candidate) => candidate.socketId === socket.id);
        if (!player) return;

        const opponent = match.players.find((candidate) => candidate !== player);
        // Walking out hands the win to whoever stayed.
        await endMatch(io, ctx, match, { winner: opponent, status: 'completed' });
      })();
    });

    socket.on('disconnect', (reason) => {
      console.log(`[socket] disconnected: ${socket.id} (${reason})`);

      ctx.queue.leaveBySocket(socket.id);
      ctx.lobbies.removeByHostSocket(socket.id);

      const detached = ctx.matches.detachSocket(socket.id);
      if (!detached) return;

      const opponent = detached.match.players.find((player) => player !== detached.player);
      if (opponent?.socketId) {
        io.to(opponent.socketId).emit('opponent:disconnected', { gracePeriodMs: 0 });
      }
    });
  });
}
