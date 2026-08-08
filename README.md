# Xeetcode

Real-time 1v1 competitive coding — Chess.com-style matchmaking meets LeetCode.

> **Status: Phase 1 (Foundation).** The monorepo, CI pipeline, and deployment
> path are live end to end. Matchmaking and lobbies land in Phase 2.

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
