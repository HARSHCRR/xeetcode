import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { TopicSelection } from '@xeetcode/shared';

import { MatchmakingQueue } from './queue.js';

let counter = 0;
const player = (name: string, topic: TopicSelection) => ({
  socketId: `socket-${++counter}`,
  userId: `user-${counter}`,
  name,
  rating: 1200,
  topic,
  joinedAt: Date.now(),
});

test('a lone player waits', () => {
  const queue = new MatchmakingQueue();
  assert.equal(queue.join(player('alice', 'arrays')), undefined);
  assert.equal(queue.size('arrays'), 1);
});

test('two players on the same topic pair up and leave the queue', () => {
  const queue = new MatchmakingQueue();
  const alice = player('alice', 'arrays');
  const bob = player('bob', 'arrays');

  queue.join(alice);
  const pairing = queue.join(bob);

  assert.ok(pairing);
  assert.deepEqual(
    [pairing.first.name, pairing.second.name].sort(),
    ['alice', 'bob'],
  );
  assert.equal(queue.size('arrays'), 0);
});

test('players on different topics do not pair', () => {
  const queue = new MatchmakingQueue();
  queue.join(player('alice', 'arrays'));
  assert.equal(queue.join(player('bob', 'strings')), undefined);
  assert.equal(queue.totalWaiting(), 2);
});

test('random is its own bucket and never pulls from a topic queue', () => {
  const queue = new MatchmakingQueue();
  queue.join(player('alice', 'arrays'));

  // A random player must not be matched against the waiting arrays player.
  assert.equal(queue.join(player('bob', 'random')), undefined);
  assert.equal(queue.size('arrays'), 1);
  assert.equal(queue.size('random'), 1);

  // Two random players do pair with each other.
  const pairing = queue.join(player('carol', 'random'));
  assert.ok(pairing);
  assert.equal(queue.size('arrays'), 1, 'the arrays player is still waiting');
});

test('pairs the two longest-waiting players', () => {
  const queue = new MatchmakingQueue();
  const first = player('first', 'strings');
  const second = player('second', 'strings');

  queue.join(first);
  queue.join(second);
  queue.join(player('third', 'strings'));
  const pairing = queue.join(player('fourth', 'strings'));

  // first+second paired on `second`'s join; third+fourth pair here.
  assert.ok(pairing);
  assert.deepEqual([pairing.first.name, pairing.second.name], ['third', 'fourth']);
});

test('leaving removes a player from the queue', () => {
  const queue = new MatchmakingQueue();
  const alice = player('alice', 'arrays');
  queue.join(alice);

  assert.equal(queue.leaveBySocket(alice.socketId)?.name, 'alice');
  assert.equal(queue.size('arrays'), 0);
  assert.equal(queue.leaveBySocket('nobody'), undefined);
});

test('re-queueing on the same socket does not match a player with themselves', () => {
  const queue = new MatchmakingQueue();
  const alice = player('alice', 'arrays');

  assert.equal(queue.join(alice), undefined);
  // Same socket joins again — a double click, or a client retry.
  assert.equal(queue.join({ ...alice, name: 'alice' }), undefined);
  assert.equal(queue.size('arrays'), 1, 'should hold one entry, not two');
});

test('re-queueing on a different topic moves the player rather than duplicating', () => {
  const queue = new MatchmakingQueue();
  const alice = player('alice', 'arrays');

  queue.join(alice);
  queue.join({ ...alice, topic: 'strings' });

  assert.equal(queue.size('arrays'), 0);
  assert.equal(queue.size('strings'), 1);
  assert.equal(queue.totalWaiting(), 1);
});
