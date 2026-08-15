import { createServer } from 'node:http';

import cors from 'cors';
import express from 'express';
import { Server } from 'socket.io';

import type { ClientToServerEvents, ServerToClientEvents } from '@xeetcode/shared';

import { isDatabaseConfigured } from './db/client.js';
import { env } from './env.js';
import { loadProblems, problemCount } from './problems/repository.js';
import { createContext, registerHandlers } from './socket/handlers.js';

const app = express();

app.use(cors({ origin: env.corsOrigins }));
app.use(express.json());

const ctx = createContext();

/**
 * Health check. Render pings this to decide the service is up, and it doubles
 * as the "is the backend awake?" probe the web app uses to warm a cold start.
 */
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'xeetcode-server',
    uptimeSeconds: Math.floor(process.uptime()),
    problems: problemCount(),
    database: isDatabaseConfigured() ? 'configured' : 'not configured',
    openLobbies: ctx.lobbies.size(),
    liveMatches: ctx.matches.size(),
  });
});

const httpServer = createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: env.corsOrigins },
});

registerHandlers(io, ctx);

async function start(): Promise<void> {
  await loadProblems();

  httpServer.listen(env.port, () => {
    console.log(`[server] listening on :${env.port} (${env.nodeEnv})`);
    console.log(`[server] allowed origins: ${env.corsOrigins.join(', ')}`);
  });
}

start().catch((error) => {
  console.error('[server] failed to start:', error);
  process.exit(1);
});
