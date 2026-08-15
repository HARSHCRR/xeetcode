import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { before, test } from 'node:test';

import type {
  ClientToServerEvents,
  LobbyCreatedPayload,
  LobbyErrorPayload,
  MatchEndPayload,
  MatchFoundPayload,
  ServerToClientEvents,
  SubmissionResultPayload,
} from '@xeetcode/shared';
import { Server } from 'socket.io';
import { io as ioClient, type Socket as ClientSocket } from 'socket.io-client';

import { resetPlayersForTesting } from '../players/store.js';
import { loadProblems, setProblemsForTesting } from '../problems/repository.js';
import { createContext, registerHandlers } from './handlers.js';

/**
 * End-to-end socket tests over a real HTTP server and real client sockets.
 *
 * These prove the thing the product is for: two independent clients sharing a
 * code end up in the same match, and the score decides it.
 */

type TestClient = ClientSocket<ServerToClientEvents, ClientToServerEvents>;

before(async () => {
  await loadProblems(); // no DATABASE_URL in tests -> bundled bank
});

interface Harness {
  connect: () => Promise<TestClient>;
}

/**
 * Runs `body` against a server with completely fresh state.
 *
 * Each test gets its own lobby and match registries. Sharing one server made
 * tests order-dependent: state left behind by one leaked into the next.
 */
async function withServer(body: (harness: Harness) => Promise<void>): Promise<void> {
  const httpServer = createServer();
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: { origin: '*' },
  });
  resetPlayersForTesting();
  registerHandlers(io, createContext());

  const port = await new Promise<number>((resolve) => {
    httpServer.listen(0, () => {
      const address = httpServer.address();
      resolve(typeof address === 'object' && address ? address.port : 0);
    });
  });

  const clients: TestClient[] = [];
  const connect = async (): Promise<TestClient> => {
    const client: TestClient = ioClient(`http://localhost:${port}`, {
      transports: ['websocket'],
      forceNew: true,
    });
    clients.push(client);
    await new Promise<void>((resolve, reject) => {
      client.on('connect', resolve);
      client.on('connect_error', reject);
    });
    return client;
  };

  try {
    await body({ connect });
  } finally {
    for (const client of clients) client.disconnect();
    io.close();
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));
  }
}

function nextEvent<T>(client: TestClient, event: string, timeoutMs = 15000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timed out waiting for "${event}"`)), timeoutMs);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (client as any).once(event, (payload: T) => {
      clearTimeout(timer);
      resolve(payload);
    });
  });
}

/** Hosts a lobby and joins it, returning both clients and the host's payload. */
async function pairUp(
  harness: Harness,
  format: { timed: boolean; minutes?: number } = { timed: true, minutes: 15 },
) {
  const host = await harness.connect();
  const guest = await harness.connect();

  const created = nextEvent<LobbyCreatedPayload>(host, 'lobby:created');
  host.emit('lobby:create', { playerId: crypto.randomUUID(), name: 'host', format });
  const { code } = await created;

  const hostMatch = nextEvent<MatchFoundPayload>(host, 'match:found');
  const guestMatch = nextEvent<MatchFoundPayload>(guest, 'match:found');
  guest.emit('lobby:join', { playerId: crypto.randomUUID(), name: 'guest', code });

  const [h, g] = await Promise.all([hostMatch, guestMatch]);
  return { host, guest, h, g, code };
}

test('a shared code puts both players in the same match', async () => {
  await withServer(async (harness) => {
    const { h, g } = await pairUp(harness);

    assert.equal(h.matchId, g.matchId, 'both players must be in the same match');
    assert.equal(h.problem.id, g.problem.id, 'both players must get the same problem');
    assert.equal(h.opponentName, 'guest');
    assert.equal(g.opponentName, 'host');
    assert.notEqual(h.userId, g.userId, 'each player needs a distinct identity');
  });
});

test('hidden test cases never cross the wire', async () => {
  await withServer(async (harness) => {
    const { h } = await pairUp(harness);
    assert.ok(!('testCases' in h.problem), 'hidden tests must not reach the browser');
  });
});

test('a timed match carries a deadline; an untimed one does not', async () => {
  await withServer(async (harness) => {
    const timed = await pairUp(harness, { timed: true, minutes: 30 });
    assert.ok(timed.h.endsAt, 'a timed match needs a deadline');
    assert.equal(Math.round((timed.h.endsAt! - timed.h.startedAt) / 60000), 30);
  });

  await withServer(async (harness) => {
    const untimed = await pairUp(harness, { timed: false });
    assert.equal(untimed.h.endsAt, null, 'an untimed match has no deadline');
  });
});

test('an unrecognised duration falls back rather than being trusted', async () => {
  await withServer(async (harness) => {
    // 999 is not an offered option; the server must not honour it.
    const { h } = await pairUp(harness, { timed: true, minutes: 999 });
    assert.equal(Math.round((h.endsAt! - h.startedAt) / 60000), 15);
  });
});

test('a code is single-use, so a third player cannot join', async () => {
  await withServer(async (harness) => {
    const { code } = await pairUp(harness);
    const gatecrasher = await harness.connect();

    const failure = nextEvent<LobbyErrorPayload>(gatecrasher, 'lobby:error');
    gatecrasher.emit('lobby:join', { playerId: crypto.randomUUID(), name: 'third', code });

    const { message } = await failure;
    assert.match(message, /invalid|expired/i);
  });
});

test('an unknown code errors rather than hanging', async () => {
  await withServer(async ({ connect }) => {
    const stranger = await connect();
    const failure = nextEvent<LobbyErrorPayload>(stranger, 'lobby:error');
    stranger.emit('lobby:join', { playerId: crypto.randomUUID(), name: 'stranger', code: 'ZZZZZZ' });

    const { message } = await failure;
    assert.match(message, /invalid|expired/i);
  });
});

test('a failed submission scores, penalises the attempt, and starts a cooldown', async () => {
  await withServer(async (harness) => {
    const { host, guest, h } = await pairUp(harness);

    const opponentNotice = nextEvent<{ attemptCount: number; score: number; solved: boolean }>(
      guest,
      'match:opponentSubmitted',
    );
    const verdict = nextEvent<SubmissionResultPayload>(host, 'match:submissionResult');

    host.emit('match:submit', { matchId: h.matchId, code: 'function nope() {}', language: 'javascript' });

    const result = await verdict;
    assert.equal(result.passed, false);
    assert.equal(result.attemptCount, 1);
    assert.ok(result.cooldownUntil, 'a failed attempt should start a cooldown');
    // 0 tests passed, 1 attempt -> -2, floored at 0.
    assert.equal(result.score, 0);

    const notice = await opponentNotice;
    assert.equal(notice.attemptCount, 1);
    assert.equal(notice.solved, false);
    // The opponent sees the score, never the code or which tests failed.
    assert.deepEqual(Object.keys(notice).sort(), ['attemptCount', 'score', 'solved']);
  });
});

/**
 * Pins a trivial problem so a test can submit a genuinely correct solution.
 * Restored by `loadProblems()` in the next test that needs the real bank.
 */
function pinTrivialProblem() {
  setProblemsForTesting([
    {
      id: 'pinned',
      slug: 'pinned',
      title: 'Pinned',
      topic: 'arrays',
      difficulty: 'easy',
      description: '',
      starters: { javascript: '' },
      sampleCases: [],
      jsFunctionName: 'pinned',
      testCases: [
        { input: [1], expected: 2 },
        { input: [5], expected: 6 },
      ],
    },
  ]);
}

test('an untimed match ends the moment someone solves it', async () => {
  pinTrivialProblem();
  try {
    await withServer(async (harness) => {
      const { host, guest, h } = await pairUp(harness, { timed: false });

      const hostEnd = nextEvent<MatchEndPayload>(host, 'match:end');
      const guestEnd = nextEvent<MatchEndPayload>(guest, 'match:end');

      host.emit('match:submit', { matchId: h.matchId, code: 'function pinned(n) { return n + 1; }', language: 'javascript' });

      const [hostResult, guestResult] = await Promise.all([hostEnd, guestEnd]);
      assert.equal(hostResult.result, 'win', 'the solver wins immediately');
      assert.equal(guestResult.result, 'loss');
      // 2 tests x 10, minus 1 attempt x 2, plus the 50 full-pass bonus.
      assert.equal(hostResult.score, 68);
      assert.equal(hostResult.ratingChange, 16);
    });
  } finally {
    await loadProblems();
  }
});

test('a timed match keeps going after one player solves, then decides on score', async () => {
  pinTrivialProblem();
  try {
    await withServer(async (harness) => {
      const { host, guest, h } = await pairUp(harness, { timed: true, minutes: 15 });

      const solved = nextEvent<SubmissionResultPayload>(host, 'match:submissionResult');
      host.emit('match:submit', { matchId: h.matchId, code: 'function pinned(n) { return n + 1; }', language: 'javascript' });
      const verdict = await solved;
      assert.equal(verdict.passed, true);

      // A solve alone must not end a timed match — the opponent can still score.
      await assert.rejects(
        () => nextEvent<MatchEndPayload>(host, 'match:end', 600),
        /timed out/,
        'a timed match should run on after a single solve',
      );

      // Once both are done there is nothing left to gain, so it settles.
      const hostEnd = nextEvent<MatchEndPayload>(host, 'match:end');
      guest.emit('match:submit', { matchId: h.matchId, code: 'function pinned(n) { return n + 1; }', language: 'javascript' });

      const result = await hostEnd;
      assert.equal(result.score, 68);
      assert.equal(result.opponentScore, 68);
      assert.equal(result.status, 'draw', 'equal scores are a draw');
      assert.equal(result.ratingChange, 0, 'draws leave ratings alone');
    });
  } finally {
    await loadProblems();
  }
});

test('a solved player cannot submit again and decay their score', async () => {
  pinTrivialProblem();
  try {
    await withServer(async (harness) => {
      const { host, h } = await pairUp(harness, { timed: true, minutes: 15 });

      const first = nextEvent<SubmissionResultPayload>(host, 'match:submissionResult');
      host.emit('match:submit', { matchId: h.matchId, code: 'function pinned(n) { return n + 1; }', language: 'javascript' });
      assert.equal((await first).score, 68);

      // A further attempt must be ignored rather than costing 2 points.
      host.emit('match:submit', { matchId: h.matchId, code: 'function pinned() { return 0; }', language: 'javascript' });
      await assert.rejects(
        () => nextEvent<SubmissionResultPayload>(host, 'match:submissionResult', 600),
        /timed out/,
        'submissions after solving should be refused',
      );
    });
  } finally {
    await loadProblems();
  }
});

test('leaving concedes and moves both ratings by an equal, opposite amount', async () => {
  await withServer(async (harness) => {
    const { host, guest, h } = await pairUp(harness);

    const hostEnd = nextEvent<MatchEndPayload>(host, 'match:end');
    const guestEnd = nextEvent<MatchEndPayload>(guest, 'match:end');

    host.emit('match:leave', { matchId: h.matchId });

    const [hostResult, guestResult] = await Promise.all([hostEnd, guestEnd]);
    assert.equal(guestResult.result, 'win');
    assert.equal(hostResult.result, 'loss');
    // Both start at 1200, so the swing is half the K-factor.
    assert.equal(guestResult.ratingChange, 16);
    assert.equal(hostResult.ratingChange, -16);
    assert.equal(guestResult.ratingChange + hostResult.ratingChange, 0, 'Elo must be zero-sum');
  });
});

test('chat reaches both players tagged with the sender', async () => {
  await withServer(async (harness) => {
    const { host, guest, h } = await pairUp(harness);

    const toGuest = nextEvent<{ from: string; text: string; fromUserId: string }>(
      guest,
      'chat:message',
    );
    host.emit('chat:message', { matchId: h.matchId, text: 'good luck' });

    const message = await toGuest;
    assert.equal(message.text, 'good luck');
    assert.equal(message.from, 'host');
    assert.equal(message.fromUserId, h.userId);
  });
});

test('rejoining restores score, attempts, and chat', async () => {
  await withServer(async (harness) => {
    const { host, h } = await pairUp(harness);

    host.emit('chat:message', { matchId: h.matchId, text: 'hello' });
    const verdict = nextEvent<SubmissionResultPayload>(host, 'match:submissionResult');
    host.emit('match:submit', { matchId: h.matchId, code: 'function nope() {}', language: 'javascript' });
    await verdict;

    const state = nextEvent<{
      attemptCount: number;
      score: number;
      chatHistory: unknown[];
      lastCode?: string;
    }>(host, 'match:state');
    host.emit('match:rejoin', { matchId: h.matchId, userId: h.userId });

    const restored = await state;
    assert.equal(restored.attemptCount, 1);
    assert.equal(restored.chatHistory.length, 1);
    assert.equal(restored.lastCode, 'function nope() {}');
  });
});
