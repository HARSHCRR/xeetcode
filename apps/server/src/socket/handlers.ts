import {
  applyMatchResult,
  isLanguage,
  isTimedDuration,
  SUBMISSION_COOLDOWN_MS,
  toPublicProblem,
} from '@xeetcode/shared';
import type {
  ChatMessagePayload,
  ClientToServerEvents,
  MatchFormat,
  MatchFoundPayload,
  ServerToClientEvents,
} from '@xeetcode/shared';
import type { Server, Socket } from 'socket.io';

import { judgeSubmission } from '../judge/index.js';
import { LobbyRegistry } from '../matchmaking/lobby.js';
import { MatchRegistry, playerScore } from '../matchmaking/matches.js';
import type { LiveMatch, MatchPlayer } from '../matchmaking/matches.js';
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

/** Narrows an untrusted format, falling back to the default timed match. */
function sanitizeFormat(raw: unknown): MatchFormat {
  const value = (raw ?? {}) as Partial<MatchFormat>;
  if (value.timed === false) return { timed: false };
  return { timed: true, minutes: isTimedDuration(value.minutes) ? value.minutes : 15 };
}

export interface HandlerContext {
  lobbies: LobbyRegistry;
  matches: MatchRegistry;
}

export function createContext(): HandlerContext {
  return { lobbies: new LobbyRegistry(), matches: new MatchRegistry() };
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
 * Ends a match: decides the winner, settles Elo, persists, and notifies.
 *
 * Who wins depends on how the match ended, which the caller states explicitly
 * rather than this function guessing from the clock.
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

  // Draws and abandoned matches leave ratings untouched, per the design.
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
    await Promise.all([
      saveRating(first.userId, firstAfter),
      saveRating(second.userId, secondAfter),
    ]);
  }

  for (const player of match.players) {
    if (!player.socketId) continue;
    const opponent = player === first ? second : first;
    const after = player === first ? firstAfter : secondAfter;
    const won = winner?.userId === player.userId;

    io.to(player.socketId).emit('match:end', {
      matchId: match.id,
      result: status === 'draw' ? 'draw' : won ? 'win' : 'loss',
      status,
      score: playerScore(match, player),
      opponentScore: playerScore(match, opponent),
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
    endedAt: new Date(),
  });

  console.log(`[match] ${match.id} ended (${status})`);
}

/** Decides a finished timed match on score, or calls it a draw. */
function endOnScore(io: XeetServer, ctx: HandlerContext, match: LiveMatch): Promise<void> {
  const [a, b] = match.players;
  const scoreA = playerScore(match, a);
  const scoreB = playerScore(match, b);

  if (scoreA === scoreB) return endMatch(io, ctx, match, { status: 'draw' });
  return endMatch(io, ctx, match, {
    winner: scoreA > scoreB ? a : b,
    status: 'completed',
  });
}

function startMatch(
  io: XeetServer,
  ctx: HandlerContext,
  format: MatchFormat,
  first: { socketId: string; userId: string; name: string; rating: number },
  second: { socketId: string; userId: string; name: string; rating: number },
): void {
  const problem = pickProblem('random');
  if (!problem) {
    const message = 'No problems are available right now.';
    io.to(first.socketId).emit('lobby:error', { message });
    io.to(second.socketId).emit('lobby:error', { message });
    return;
  }

  const match = ctx.matches.create({
    problem,
    mode: 'friend',
    players: [
      { userId: first.userId, name: first.name, socketId: first.socketId, ratingBefore: first.rating },
      {
        userId: second.userId,
        name: second.name,
        socketId: second.socketId,
        ratingBefore: second.rating,
      },
    ],
    durationMs: format.timed ? (format.minutes ?? 15) * 60 * 1000 : null,
    // Clock ran out: whoever scored higher takes it.
    onExpire: (expired) => void endOnScore(io, ctx, expired),
  });

  for (const player of match.players) {
    if (!player.socketId) continue;
    io.sockets.sockets.get(player.socketId)?.join(match.id);
    const payload = matchFoundFor(match, player.userId);
    if (payload) io.to(player.socketId).emit('match:found', payload);
  }

  console.log(
    `[match] ${match.id} started (${problem.slug}, ${format.timed ? `${format.minutes}m` : 'untimed'})`,
  );
}

export function registerHandlers(io: XeetServer, ctx: HandlerContext): void {
  io.on('connection', (socket: XeetSocket) => {
    console.log(`[socket] connected: ${socket.id}`);

    socket.on('lobby:create', (payload) => {
      void (async () => {
        const identity = await getOrCreatePlayer(
          String(payload?.playerId ?? ''),
          sanitizeName(payload?.name),
        );

        const lobby = ctx.lobbies.create({
          hostSocketId: socket.id,
          hostUserId: identity.id,
          hostName: identity.name,
          hostRating: identity.rating,
          format: sanitizeFormat(payload?.format),
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
                ? "That's your own code — share it with a friend."
                : 'That code is invalid or has expired.',
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
          lobby.format,
          {
            socketId: lobby.hostSocketId,
            userId: lobby.hostUserId,
            name: lobby.hostName,
            rating: lobby.hostRating,
          },
          { socketId: socket.id, userId: joiner.id, name: joiner.name, rating: joiner.rating },
        );
      })();
    });

    socket.on('match:submit', (payload) => {
      void (async () => {
        const match = payload?.matchId ? ctx.matches.get(payload.matchId) : undefined;
        if (!match || match.finished) return;

        const player = match.players.find((candidate) => candidate.socketId === socket.id);
        if (!player) return;

        // Once solved, the score is locked in — further attempts would only
        // subtract from it, so the button is disabled client-side too.
        if (player.solved) return;

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
        const language = isLanguage(payload.language) ? payload.language : 'javascript';
        player.lastCode = code;
        player.attemptCount += 1;

        // Submit judges the hidden set and reveals nothing about the data.
        const verdict = await judgeSubmission(
          match.problem,
          code,
          language,
          match.problem.testCases,
          false,
        );
        if (match.finished) return; // the clock may have run out mid-judge

        player.bestPassedCount = Math.max(player.bestPassedCount, verdict.passedCount);
        if (verdict.passed) player.solved = true;

        const score = playerScore(match, player);
        const opponent = match.players.find((candidate) => candidate !== player)!;

        socket.emit('match:submissionResult', {
          ...verdict,
          bestPassedCount: player.bestPassedCount,
          score,
          attemptCount: player.attemptCount,
          ...(verdict.passed ? {} : { cooldownUntil: Date.now() + SUBMISSION_COOLDOWN_MS }),
        });

        if (!verdict.passed) player.cooldownUntil = Date.now() + SUBMISSION_COOLDOWN_MS;

        if (opponent.socketId) {
          // The opponent sees the public score and nothing about the code.
          io.to(opponent.socketId).emit('match:opponentSubmitted', {
            attemptCount: player.attemptCount,
            score,
            solved: player.solved,
          });
        }

        if (!verdict.passed) return;

        // Untimed: first full pass takes it. Timed: play on unless both are
        // done, since the opponent can still out-score a sloppy win.
        if (match.endsAt === null) {
          await endMatch(io, ctx, match, { winner: player, status: 'completed' });
        } else if (match.players.every((candidate) => candidate.solved)) {
          await endOnScore(io, ctx, match);
        }
      })();
    });

    socket.on('match:run', (payload) => {
      void (async () => {
        const match = payload?.matchId ? ctx.matches.get(payload.matchId) : undefined;
        if (!match || match.finished) return;

        const player = match.players.find((candidate) => candidate.socketId === socket.id);
        if (!player) return;

        const code = typeof payload.code === 'string' ? payload.code.slice(0, MAX_CODE_LENGTH) : '';
        const language = isLanguage(payload.language) ? payload.language : 'javascript';

        // Run is a debugging aid: it costs no attempt, moves no score, and the
        // opponent is not told about it.
        const verdict = await judgeSubmission(
          match.problem,
          code,
          language,
          match.problem.sampleCases,
          true,
        );

        socket.emit('match:runResult', {
          passedCount: verdict.passedCount,
          totalCount: verdict.totalCount,
          cases: verdict.cases ?? [],
          ...(verdict.errorKind ? { errorKind: verdict.errorKind } : {}),
          ...(verdict.errorDetail ? { errorDetail: verdict.errorDetail } : {}),
        });
      })();
    });

    socket.on('chat:message', (payload) => {
      const match = payload?.matchId ? ctx.matches.get(payload.matchId) : undefined;
      if (!match) return;

      const player = match.players.find((candidate) => candidate.socketId === socket.id);
      if (!player) return;

      const text =
        typeof payload.text === 'string' ? payload.text.trim().slice(0, MAX_CHAT_LENGTH) : '';
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
        score: playerScore(match, sides.self),
        opponentScore: playerScore(match, sides.opponent),
        bestPassedCount: sides.self.bestPassedCount,
        solved: sides.self.solved,
        ...(sides.self.lastCode ? { lastCode: sides.self.lastCode } : {}),
        chatHistory: match.chat,
      });

      if (sides.opponent.socketId) io.to(sides.opponent.socketId).emit('opponent:reconnected');
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
