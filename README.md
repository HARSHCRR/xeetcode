# Xeetcode

Real-time 1v1 competitive coding — Chess.com-style matchmaking meets LeetCode.

> **Status: feature-complete for v1.** Matchmaking, friend lobbies, the Monaco
> editor, sandboxed judging, the 15-minute timer, in-match chat, Elo, and the
> result screen all work end to end.

## Architecture

The app is split across two hosts, because Vercel's serverless functions can't
hold a long-lived WebSocket or in-memory matchmaking state:

| Piece | Runs on | Why |
| --- | --- | --- |
| `apps/web` — Next.js UI | Vercel | Stateless pages, static assets, Monaco editor |
| `apps/server` — Express + Socket.IO | Render | Always-on process owning queues, lobbies, live match state |
| `packages/shared` — TS types + Elo | consumed by both | One source of truth for the wire format |

The browser loads the UI from Vercel and opens a WebSocket **directly** to the
Render service — realtime traffic does not pass through Vercel.

## Repository layout

```
apps/
  web/        Next.js (App Router) + Tailwind v4 + Monaco (Phase 3)
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
in `apps/server/src/problems/bank.ts`, so nothing needs setting up to develop
matchmaking. To use Postgres, set `DATABASE_URL` in `apps/server/.env`, then:

```bash
npm run db:migrate -w @xeetcode/server   # applies schema.sql (safe to re-run)
npm run db:seed     -w @xeetcode/server  # upserts the problem bank
```

`DATABASE_URL` is a real credential: it belongs in `.env` (gitignored) and in
the Render dashboard, never in the repo.

## Testing two players locally

Matchmaking needs two sessions. Open the app in a normal window **and** a
private/incognito window — they need separate `localStorage`, so two tabs in the
same profile share a name but still work as two distinct players.

## Checks

These are exactly what CI runs on every pull request:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Theming

The v1 look is a space theme, kept swappable on purpose. All colour lives in
semantic tokens in `apps/web/src/styles/themes/space.css`; components reference
utilities like `bg-surface` / `text-accent`, never raw hex values. Changing the
visual direction means adding a sibling theme file with the same token names and
swapping one import in `apps/web/src/styles/globals.css`.

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
