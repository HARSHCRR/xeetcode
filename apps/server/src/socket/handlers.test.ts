import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { before, test } from 'node:test';

import type {
  ClientToServerEvents,
  LobbyCreatedPayload,
  LobbyErrorPayload,
  MatchFoundPayload,
  ServerToClientEvents,
} from '@xeetcode/shared';
import { Server } from 'socket.io';
import { io as ioClient, type Socket as ClientSocket } from 'socket.io-client';

import { loadProblems } from '../problems/repository.js';
import { createContext, registerHandlers } from './handlers.js';

/**
 * End-to-end socket tests over a real HTTP server and real client sockets.
 *
 * The unit tests cover queue and lobby logic in isolation; these exist to prove
 * the thing Phase 2 is actually for — that two independent clients end up in
 * the same match, with the same problem, through the real event plumbing.
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
 * Each test gets its own queue, lobby registry, and match registry. Sharing one
 * server across tests made them order-dependent: a player left waiting in one
 * test would silently pair with the first arrival in the next.
 */
async function withServer(body: (harness: Harness) => Promise<void>): Promise<void> {
  const httpServer = createServer();
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: { origin: '*' },
  });
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

/** Resolves with the next payload for `event`, or rejects after `timeoutMs`. */
function nextEvent<T>(client: TestClient, event: string, timeoutMs = 3000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timed out waiting for "${event}"`)), timeoutMs);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (client as any).once(event, (payload: T) => {
      clearTimeout(timer);
      resolve(payload);
    });
  });
}

test('two players queueing the same topic land in the same match', async () => {
  await withServer(async ({ connect }) => {
    const alice = await connect();
    const bob = await connect();

    const aliceMatch = nextEvent<MatchFoundPayload>(alice, 'match:found');
    const bobMatch = nextEvent<MatchFoundPayload>(bob, 'match:found');

    alice.emit('queue:join', { name: 'alice', topic: 'arrays' });
    bob.emit('queue:join', { name: 'bob', topic: 'arrays' });

    const [a, b] = await Promise.all([aliceMatch, bobMatch]);

    assert.equal(a.matchId, b.matchId, 'both players must be in the same match');
    assert.equal(a.problem.id, b.problem.id, 'both players must get the same problem');
    assert.equal(a.problem.topic, 'arrays');
    assert.equal(a.opponentName, 'bob');
    assert.equal(b.opponentName, 'alice');
    assert.notEqual(a.userId, b.userId, 'each player needs a distinct identity');
  });
});

test('the problem sent to clients never includes hidden test cases', async () => {
  await withServer(async ({ connect }) => {
    const one = await connect();
    const two = await connect();

    const found = nextEvent<MatchFoundPayload>(one, 'match:found');
    one.emit('queue:join', { name: 'one', topic: 'strings' });
    two.emit('queue:join', { name: 'two', topic: 'strings' });

    const payload = await found;
    assert.ok(!('testCases' in payload.problem), 'hidden tests must not cross the wire');
  });
});

test('a player queueing a different topic is not matched', async () => {
  await withServer(async ({ connect }) => {
    const arrays = await connect();
    const strings = await connect();

    const waiting = nextEvent(arrays, 'queue:waiting');
    arrays.emit('queue:join', { name: 'arrays-fan', topic: 'arrays' });
    await waiting;

    strings.emit('queue:join', { name: 'strings-fan', topic: 'strings' });

    await assert.rejects(
      () => nextEvent<MatchFoundPayload>(arrays, 'match:found', 500),
      /timed out/,
      'players on different topics must not be paired',
    );
  });
});

test('a random-queued player is not pulled into a topic queue', async () => {
  await withServer(async ({ connect }) => {
    const topical = await connect();
    const anyTopic = await connect();

    const waiting = nextEvent(topical, 'queue:waiting');
    topical.emit('queue:join', { name: 'binary-fan', topic: 'binary_search' });
    await waiting;

    anyTopic.emit('queue:join', { name: 'roulette', topic: 'random' });

    await assert.rejects(
      () => nextEvent<MatchFoundPayload>(topical, 'match:found', 500),
      /timed out/,
      'random must be its own queue',
    );
  });
});

test('a friend joining by lobby code reaches the same match as the host', async () => {
  await withServer(async ({ connect }) => {
    const host = await connect();
    const friend = await connect();

    const created = nextEvent<LobbyCreatedPayload>(host, 'lobby:created');
    host.emit('lobby:create', { name: 'host', topic: 'arrays' });
    const { code } = await created;

    assert.equal(code.length, 6);

    const hostMatch = nextEvent<MatchFoundPayload>(host, 'match:found');
    const friendMatch = nextEvent<MatchFoundPayload>(friend, 'match:found');
    friend.emit('lobby:join', { name: 'friend', code });

    const [h, f] = await Promise.all([hostMatch, friendMatch]);

    assert.equal(h.matchId, f.matchId);
    assert.equal(h.problem.id, f.problem.id);
    assert.equal(h.mode, 'friend');
    assert.equal(h.opponentName, 'friend');
    assert.equal(f.opponentName, 'host');
  });
});

test('lobby codes are accepted case-insensitively', async () => {
  await withServer(async ({ connect }) => {
    const host = await connect();
    const friend = await connect();

    const created = nextEvent<LobbyCreatedPayload>(host, 'lobby:created');
    host.emit('lobby:create', { name: 'host', topic: 'random' });
    const { code } = await created;

    const friendMatch = nextEvent<MatchFoundPayload>(friend, 'match:found');
    friend.emit('lobby:join', { name: 'friend', code: code.toLowerCase() });

    await friendMatch; // rejects on timeout if the lowercase code was refused
  });
});

test('an unknown lobby code returns an error rather than hanging', async () => {
  await withServer(async ({ connect }) => {
    const stranger = await connect();

    const failure = nextEvent<LobbyErrorPayload>(stranger, 'lobby:error');
    stranger.emit('lobby:join', { name: 'stranger', code: 'ZZZZZZ' });

    const { message } = await failure;
    assert.match(message, /invalid|expired/i);
  });
});

test('a lobby code cannot be reused by a third player', async () => {
  await withServer(async ({ connect }) => {
    const host = await connect();
    const friend = await connect();
    const gatecrasher = await connect();

    const created = nextEvent<LobbyCreatedPayload>(host, 'lobby:created');
    host.emit('lobby:create', { name: 'host', topic: 'arrays' });
    const { code } = await created;

    const friendMatch = nextEvent<MatchFoundPayload>(friend, 'match:found');
    friend.emit('lobby:join', { name: 'friend', code });
    await friendMatch;

    const failure = nextEvent<LobbyErrorPayload>(gatecrasher, 'lobby:error');
    gatecrasher.emit('lobby:join', { name: 'gatecrasher', code });

    const { message } = await failure;
    assert.match(message, /invalid|expired/i);
  });
});

test('cancelling removes a player from the queue', async () => {
  await withServer(async ({ connect }) => {
    const quitter = await connect();
    const later = await connect();

    const waiting = nextEvent(quitter, 'queue:waiting');
    quitter.emit('queue:join', { name: 'quitter', topic: 'strings' });
    await waiting;

    quitter.emit('queue:leave');
    // Give the server a moment to process the leave before the next join.
    await new Promise((resolve) => setTimeout(resolve, 50));

    const stillWaiting = nextEvent(later, 'queue:waiting');
    later.emit('queue:join', { name: 'later', topic: 'strings' });

    // If the cancel didn't take, these two would have been paired instead.
    await stillWaiting;
  });
});
