import 'dotenv/config';
import { Client } from 'pg';
import { createClient } from 'redis';

async function main() {
  const pg = new Client({ connectionString: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@postgres:5432/r3lay' });
  await pg.connect();

  const redis = createClient({ url: process.env.REDIS_URL ?? 'redis://redis:6379' });
  await redis.connect();

  console.log('[worker] connected');

  setInterval(async () => {
    const result = await pg.query(`SELECT id, event_type, payload FROM outbox_event WHERE status = 'pending' LIMIT 25;`);
    for (const row of result.rows) {
      await redis.publish('workspace:demo', JSON.stringify({ eventType: row.event_type, payload: row.payload }));
      await pg.query(`UPDATE outbox_event SET status = 'delivered', processed_at = NOW() WHERE id = $1;`, [row.id]);
    }
  }, 2000);
}

main().catch((error) => {
  console.error('[worker] failed', error);
  process.exit(1);
});
