import 'dotenv/config';
import pg from 'pg';

const cs = process.env.DATABASE_URL || '';
const isLocal = cs.includes('localhost') || cs.includes('127.0.0.1');
// Supabase (and most managed Postgres) require SSL; local dev does not.
const pool = new pg.Pool({
  connectionString: cs,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

try {
  // Does the Message table exist?
  const exists = await pool.query(
    `SELECT to_regclass('public."Message"') IS NOT NULL AS present`
  );
  if (!exists.rows[0].present) {
    console.log('RESULT: Message table does not exist yet — nothing to dedupe.');
    process.exit(0);
  }

  const dupes = await pool.query(
    `SELECT "groupId", "messageId", COUNT(*) AS c
       FROM "Message"
      GROUP BY "groupId", "messageId"
     HAVING COUNT(*) > 1
      ORDER BY c DESC
      LIMIT 50`
  );

  const total = await pool.query(`SELECT COUNT(*)::int AS n FROM "Message"`);
  console.log(`Message rows: ${total.rows[0].n}`);
  console.log(`Duplicate (groupId,messageId) groups: ${dupes.rowCount}`);
  if (dupes.rowCount > 0) {
    console.log('RESULT: DUPLICATES FOUND — dedupe required before db push.');
    for (const r of dupes.rows) {
      console.log(`  group=${r.groupId} messageId=${r.messageId} count=${r.c}`);
    }
    process.exit(2);
  }
  console.log('RESULT: CLEAN — safe to apply the unique constraint.');
} finally {
  await pool.end();
}
