/**
 * Environment configuration, read once at startup so a missing/misspelled
 * variable fails loudly here rather than at the first request.
 */

function parseOrigins(raw: string | undefined): string[] {
  if (!raw) return ['http://localhost:3000'];
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export const env = {
  /** Render injects PORT; local dev falls back to 4000. */
  port: Number(process.env.PORT ?? 4000),

  nodeEnv: process.env.NODE_ENV ?? 'development',

  /**
   * Comma-separated list of origins allowed to open a socket / call the API.
   * In production this must include the deployed Vercel URL.
   */
  corsOrigins: parseOrigins(process.env.CORS_ORIGIN),

  /**
   * Postgres connection string. A real credential — set via the Render
   * dashboard in production and `.env` locally, never committed.
   *
   * Optional on purpose: without it the server still runs, serving problems
   * from the bundled bank so local development needs no database setup.
   */
  databaseUrl: process.env.DATABASE_URL,

  /**
   * A Piston `/execute` endpoint to judge against.
   *
   * Unset by default: the public instance (emkc.org) went whitelist-only in
   * February 2026, so submissions run in the local sandboxed process instead.
   * Point this at a self-hosted Piston to use it — it isolates far better than
   * the local runner can.
   */
  pistonUrl: process.env.PISTON_URL,
} as const;

export const isProduction = env.nodeEnv === 'production';
