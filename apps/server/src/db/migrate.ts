import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { closePool, getPool } from './client.js';

/**
 * Applies schema.sql. Every statement is `IF NOT EXISTS`, so re-running is a
 * no-op — that's the whole migration story until the schema needs to change
 * in a way that isn't additive.
 */
async function migrate(): Promise<void> {
  const pool = getPool();
  if (!pool) {
    console.error('DATABASE_URL is not set — nothing to migrate.');
    process.exitCode = 1;
    return;
  }

  // schema.sql sits next to this file in src/, but the compiled script runs
  // from dist/, so resolve relative to the source directory.
  const here = dirname(fileURLToPath(import.meta.url));
  const schemaPath = join(here, '..', '..', 'src', 'db', 'schema.sql');
  const schema = await readFile(schemaPath, 'utf8');

  await pool.query(schema);
  console.log('Schema applied.');
}

migrate()
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exitCode = 1;
  })
  .finally(closePool);
