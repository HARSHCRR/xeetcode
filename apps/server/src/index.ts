import { createServer } from 'node:http';

import cors from 'cors';
import express from 'express';
import { Server } from 'socket.io';

import type { ClientToServerEvents, ServerToClientEvents } from '@xeetcode/shared';

import { env } from './env.js';

const app = express();

app.use(cors({ origin: env.corsOrigins }));
app.use(express.json());

/**
 * Health check. Render pings this to decide the service is up, and it doubles
 * as the "is the backend awake?" probe the web app uses to warm a cold start.
 */
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'xeetcode-server',
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

const httpServer = createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: env.corsOrigins },
});

// Phase 1 is a connectivity proof only: matchmaking, lobbies, and match state
// land here in Phase 2.
io.on('connection', (socket) => {
  console.log(`[socket] connected: ${socket.id}`);

  socket.on('disconnect', (reason) => {
    console.log(`[socket] disconnected: ${socket.id} (${reason})`);
  });
});

httpServer.listen(env.port, () => {
  console.log(`[server] listening on :${env.port} (${env.nodeEnv})`);
  console.log(`[server] allowed origins: ${env.corsOrigins.join(', ')}`);
});
