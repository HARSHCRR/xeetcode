import { Pool } from 'pg';

import { env } from '../env.js';

let pool: Pool | undefined;

/**
 * Lazily-created connection pool.
 *
 * Returns `undefined` when DATABASE_URL isn't configured, rather than throwing.
 * That keeps local development runnable with no setup: the problem repository
 * falls back to the bundled bank, and match persistence (Phase 4) is skipped.
 * Production always has the variable set.
 */
export function getPool(): Pool | undefined {
  if (!env.databaseUrl) return undefined;

  pool ??= new Pool({
    connectionString: env.databaseUrl,
    // Neon terminates TLS at its proxy with a cert chain node doesn't ship.
    ssl: { rejectUnauthorized: false },
    max: 5,
  });

  return pool;
}

export async function closePool(): Promise<void> {
  await pool?.end();
  pool = undefined;
}

export const isDatabaseConfigured = (): boolean => Boolean(env.databaseUrl);
