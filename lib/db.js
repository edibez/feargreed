import { createClient } from '@libsql/client';

let client;

export function getDb() {
  if (client) return client;

  const url = process.env.TURSO_URL;
  const token = process.env.TURSO_TOKEN;

  if (!url) {
    throw new Error('TURSO_URL is not defined');
  }

  if (!token) {
    throw new Error('TURSO_TOKEN is not defined');
  }

  client = createClient({ url, authToken: token });
  return client;
}

export async function initDb() {
  const db = getDb();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS fear_greed_history (
      index_time TEXT PRIMARY KEY,
      alternative_me REAL,
      cmc REAL,
      coinstats REAL,
      final_index REAL
    )
  `);
}

export async function insertReading({
  indexTime,
  alternativeMe,
  cmc,
  coinstats,
  finalIndex,
}) {
  await initDb();
  const db = getDb();
  await db.execute({
    sql: `
      INSERT INTO fear_greed_history (
        index_time, alternative_me, cmc, coinstats, final_index
      ) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(index_time) DO UPDATE SET
        alternative_me = excluded.alternative_me,
        cmc = excluded.cmc,
        coinstats = excluded.coinstats,
        final_index = excluded.final_index
    `,
    args: [
      indexTime,
      alternativeMe,
      cmc,
      coinstats,
      finalIndex,
    ],
  });
}

export async function getLatestReading() {
  await initDb();
  const db = getDb();
  const result = await db.execute({
    sql: `
      SELECT index_time, alternative_me, cmc, coinstats, final_index
      FROM fear_greed_history
      ORDER BY index_time DESC
      LIMIT 1
    `,
    args: [],
  });

  if (!result.rows?.length) return null;
  const row = result.rows[0];

  return {
    indexTime: row.index_time,
    alternativeMe: row.alternative_me,
    cmc: row.cmc,
    coinstats: row.coinstats,
    finalIndex: row.final_index,
  };
}

export async function getRecentReadings(limit = 24) {
  await initDb();
  const db = getDb();
  const result = await db.execute({
    sql: `
      SELECT index_time, alternative_me, cmc, coinstats, final_index
      FROM fear_greed_history
      ORDER BY index_time DESC
      LIMIT ?
    `,
    args: [limit],
  });

  return result.rows.map((row) => ({
    indexTime: row.index_time,
    alternativeMe: row.alternative_me,
    cmc: row.cmc,
    coinstats: row.coinstats,
    finalIndex: row.final_index,
  }));
}
