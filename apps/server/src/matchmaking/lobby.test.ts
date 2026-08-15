import assert from 'node:assert/strict';
import { test } from 'node:test';

import { LOBBY_CODE_ALPHABET, LOBBY_CODE_LENGTH } from '@xeetcode/shared';

import { LobbyRegistry } from './lobby.js';

const host = (socketId = 'host-socket') => ({
  hostSocketId: socketId,
  hostUserId: 'host-user',
  hostName: 'alice',
  hostRating: 1200,
  format: { timed: true, minutes: 15 },
});

test('a created lobby has a well-formed code', () => {
  const lobbies = new LobbyRegistry();
  const lobby = lobbies.create(host());

  assert.equal(lobby.code.length, LOBBY_CODE_LENGTH);
  for (const ch of lobby.code) {
    assert.ok(LOBBY_CODE_ALPHABET.includes(ch), `unexpected character ${ch}`);
  }
  lobbies.dispose();
});

test('codes avoid characters that are ambiguous when read aloud', () => {
  const lobbies = new LobbyRegistry();
  for (let i = 0; i < 200; i++) {
    const lobby = lobbies.create(host(`host-${i}`));
    for (const ambiguous of ['0', 'O', '1', 'I']) {
      assert.ok(!lobby.code.includes(ambiguous), `code ${lobby.code} contains ${ambiguous}`);
    }
  }
  lobbies.dispose();
});

test('codes are unique across many lobbies', () => {
  const lobbies = new LobbyRegistry();
  const seen = new Set<string>();
  for (let i = 0; i < 300; i++) {
    seen.add(lobbies.create(host(`host-${i}`)).code);
  }
  assert.equal(seen.size, 300);
  lobbies.dispose();
});

test('a friend can claim the lobby by code', () => {
  const lobbies = new LobbyRegistry();
  const lobby = lobbies.create(host());

  const result = lobbies.claim(lobby.code, 'friend-socket');
  assert.ok(result.ok);
  assert.equal(result.lobby.hostName, 'alice');
  lobbies.dispose();
});

test('a code is single-use, so a third person cannot join', () => {
  const lobbies = new LobbyRegistry();
  const lobby = lobbies.create(host());

  assert.ok(lobbies.claim(lobby.code, 'friend-socket').ok);

  const third = lobbies.claim(lobby.code, 'gatecrasher');
  assert.equal(third.ok, false);
  assert.equal(lobbies.size(), 0);
  lobbies.dispose();
});

test('the host cannot claim their own lobby', () => {
  const lobbies = new LobbyRegistry();
  const lobby = lobbies.create(host('host-socket'));

  const result = lobbies.claim(lobby.code, 'host-socket');
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.reason, 'own_lobby');
  // The lobby must survive a self-join attempt.
  assert.equal(lobbies.size(), 1);
  lobbies.dispose();
});

test('an unknown code is rejected', () => {
  const lobbies = new LobbyRegistry();
  const result = lobbies.claim('ZZZZZZ', 'friend-socket');
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.reason, 'not_found');
  lobbies.dispose();
});

test('codes are accepted regardless of casing or stray whitespace', () => {
  const lobbies = new LobbyRegistry();
  const lobby = lobbies.create(host());

  const result = lobbies.claim(`  ${lobby.code.toLowerCase()} `, 'friend-socket');
  assert.ok(result.ok);
  lobbies.dispose();
});

test('creating a second lobby replaces the host first one', () => {
  const lobbies = new LobbyRegistry();
  const first = lobbies.create(host());
  const second = lobbies.create(host());

  assert.equal(lobbies.size(), 1, 'the abandoned code should not linger');
  assert.equal(lobbies.get(first.code), undefined);
  assert.ok(lobbies.get(second.code));
  lobbies.dispose();
});

test('a lobby expires after its TTL', async () => {
  const lobbies = new LobbyRegistry(20);
  const lobby = lobbies.create(host());

  await new Promise((resolve) => setTimeout(resolve, 60));

  assert.equal(lobbies.get(lobby.code), undefined);
  assert.equal(lobbies.claim(lobby.code, 'friend-socket').ok, false);
  lobbies.dispose();
});

test('a disconnecting host removes their pending lobby', () => {
  const lobbies = new LobbyRegistry();
  const lobby = lobbies.create(host('host-socket'));

  assert.equal(lobbies.removeByHostSocket('host-socket')?.code, lobby.code);
  assert.equal(lobbies.size(), 0);
  lobbies.dispose();
});
