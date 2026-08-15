# Xeetcode

Real-time 1v1 competitive coding — Chess.com-style matchmaking meets LeetCode.

> **Status: v2 — friend matches only.** One page: enter a name, create a code or
> join with one. Both players get the same random Blind 75 problem, a Monaco
> editor, sandboxed judging, chat, and a score.

## How a match works

Create a code, share it, your friend enters it — you're both in the same match
on a random problem from the 75.

**Score** = `tests passed × 10 − attempts × 2`, plus **50** for passing
everything, floored at 0. It uses your *best* submission, so trying a riskier
idea can't cost you ground you already earned. Once you pass everything your
score locks and Submit disables — further attempts could only subtract.

- **Timed** (15 / 20 / 30 min) — the clock runs out and the higher score wins.
  It ends early only if both players have solved it, since there's nothing left
  to gain. Equal scores are a draw.
- **Untimed** — the first full pass wins immediately.

Leaving concedes the match.

## Architecture

The app is split across two hosts, because Vercel's serverless functions can't
hold a long-lived WebSocket or in-memory matchmaking state:

| Piece | Runs on | Why |
| --- | --- | --- |
| `apps/web` — Next.js UI | Vercel | Stateless pages, static assets, Monaco editor |
| `apps/server` — Express + Socket.IO | Render | Always-on process owning lobbies and live match state |
| `packages/shared` — TS types + Elo | consumed by both | One source of truth for the wire format |

The browser loads the UI from Vercel and opens a WebSocket **directly** to the
Render service — realtime traffic does not pass through Vercel.

## Repository layout

```
apps/
  web/        Next.js (App Router) + Tailwind v4 + Monaco
  server/     Express + Socket.IO realtime backend
packages/
  shared/     Socket event contracts, shared constants, Elo logic
```

## Local development

Requires Node 20+.

```bash
npm install          # installs every workspace
npm run dev          # builds shared, then runs web + server together
```

- Web: <http://localhost:3000>
- Server health: <http://localhost:4000/health>

To run just one side: `npm run dev:web` or `npm run dev:server`.

Copy the env templates if you need to override defaults:

```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/server/.env.example apps/server/.env
```

Both have working localhost defaults, so this is optional for local dev.

### Database (optional locally)

The server runs without a database — it falls back to the problem bank bundled
in `apps/server/src/problems/`, so nothing needs setting up to develop a match. To use Postgres, set `DATABASE_URL` in `apps/server/.env`, then:

```bash
npm run db:migrate -w @xeetcode/server   # applies schema.sql (safe to re-run)
npm run db:seed     -w @xeetcode/server  # upserts the problem bank
```

`DATABASE_URL` is a real credential: it belongs in `.env` (gitignored) and in
the Render dashboard, never in the repo.

## Testing two players locally

A match needs two sessions. Open the app in a normal window **and** a
private/incognito window — they need separate `localStorage`, so two tabs in the
same profile would otherwise share one identity.

## Checks

These are exactly what CI runs on every pull request:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Deployment

- **Vercel** builds `apps/web`. A `prebuild` hook compiles `packages/shared`
  first, so the build works from that subdirectory.
- **Render** builds `apps/server` from the repo root via `render.yaml`.

Each side needs one environment variable pointing at the other:
`NEXT_PUBLIC_BACKEND_URL` on Vercel, `CORS_ORIGIN` on Render.

## Judging submissions

Player code is untrusted, so it never runs in the server process. Each
submission executes in a separate short-lived process with:

- `--permission` — Node's permission model, denying filesystem access,
  `child_process`, `worker_threads`, and native addons
- an **empty environment**, so even a full escape sees no `DATABASE_URL`
- a **hard timeout** with `SIGKILL`, and a heap cap

`apps/server/src/judge/local.test.ts` asserts these hold by submitting code that
actively tries to read files, spawn processes, and read a planted env canary.

**Known gap:** Node's permission model does not gate outbound network access.
With no credentials in the environment and no filesystem access this is low
value to an attacker, but it is why this is not a substitute for a
container-level sandbox at real scale.

The Phase 0 design chose Piston's public API for this. That API became
whitelist-only in February 2026, so the documented fallback became the primary
path. Set `PISTON_URL` to a self-hosted Piston `/execute` endpoint to use it
instead — it isolates more strongly than the local runner can.

## Theming

The visual direction is a swap of one CSS import. `apps/web/src/styles/globals.css`
imports a theme file; `themes/leetcode.css` is active and `themes/space.css` is
the original starfield direction. Both define the same semantic tokens, so no
component changes when you switch.
