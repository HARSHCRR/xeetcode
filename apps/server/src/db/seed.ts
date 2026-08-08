import { PROBLEM_BANK } from '../problems/bank.js';
import { closePool, getPool } from './client.js';

/**
 * Loads the bundled problem bank into Postgres.
 *
 * Upserts on `slug`, so editing a description or adding a test case and
 * re-running updates the row in place rather than creating a duplicate or
 * failing. Problems already referenced by a played match keep their id.
 */
async function seed(): Promise<void> {
  const pool = getPool();
  if (!pool) {
    console.error('DATABASE_URL is not set — cannot seed.');
    process.exitCode = 1;
    return;
  }

  let inserted = 0;
  let updated = 0;

  for (const problem of PROBLEM_BANK) {
    const result = await pool.query<{ inserted: boolean }>(
      `INSERT INTO problems
         (slug, title, topic, difficulty, description, function_signature, starter_code, test_cases)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
       ON CONFLICT (slug) DO UPDATE SET
         title              = EXCLUDED.title,
         topic              = EXCLUDED.topic,
         difficulty         = EXCLUDED.difficulty,
         description        = EXCLUDED.description,
         function_signature = EXCLUDED.function_signature,
         starter_code       = EXCLUDED.starter_code,
         test_cases         = EXCLUDED.test_cases
       RETURNING (xmax = 0) AS inserted`,
      [
        problem.slug,
        problem.title,
        problem.topic,
        problem.difficulty,
        problem.description,
        problem.functionSignature,
        problem.starterCode,
        JSON.stringify(problem.testCases),
      ],
    );

    if (result.rows[0]?.inserted) inserted++;
    else updated++;
  }

  console.log(`Seeded ${PROBLEM_BANK.length} problems (${inserted} new, ${updated} updated).`);
}

seed()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(closePool);
