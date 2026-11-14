import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import { schema } from './schema.js';

export const createDb = () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/r3lay',
  });

  return {
    client,
    db: drizzle(client, { schema }),
  };
};
