-- Xeetcode schema. Safe to run repeatedly.
--
-- Only durable data lives here. Matchmaking queues, lobby codes, and live match
-- state are deliberately in-memory on the server (see the Phase 0 design):
-- they're short-lived, and losing them on a restart just means re-queueing.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Per-session identity. No auth yet, so a "user" is a name plus a rating that
-- persists only as long as the browser keeps its session id.
CREATE TABLE IF NOT EXISTS users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  rating     INTEGER NOT NULL DEFAULT 1200,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS problems (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug               TEXT UNIQUE NOT NULL,
  title              TEXT NOT NULL,
  topic              TEXT NOT NULL CHECK (topic IN ('arrays', 'strings', 'binary_search')),
  difficulty         TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  description        TEXT NOT NULL,
  function_signature TEXT NOT NULL,
  starter_code       TEXT NOT NULL,
  -- [{ "input": [...], "expected": ... }, ...] — never leaves the server.
  test_cases         JSONB NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS problems_topic_idx ON problems (topic);

-- Written once, when a match ends. Phase 4 fills in the rating columns.
CREATE TABLE IF NOT EXISTS matches (
  id                    UUID PRIMARY KEY,
  problem_id            UUID NOT NULL REFERENCES problems (id),
  topic                 TEXT NOT NULL,
  mode                  TEXT NOT NULL CHECK (mode IN ('online', 'friend')),
  player1_id            UUID NOT NULL REFERENCES users (id),
  player2_id            UUID NOT NULL REFERENCES users (id),
  winner_id             UUID REFERENCES users (id),
  player1_rating_before INTEGER NOT NULL,
  player2_rating_before INTEGER NOT NULL,
  player1_rating_after  INTEGER NOT NULL,
  player2_rating_after  INTEGER NOT NULL,
  status                TEXT NOT NULL CHECK (status IN ('completed', 'draw', 'abandoned')),
  started_at            TIMESTAMPTZ NOT NULL,
  ended_at              TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS matches_player1_idx ON matches (player1_id);
CREATE INDEX IF NOT EXISTS matches_player2_idx ON matches (player2_id);
