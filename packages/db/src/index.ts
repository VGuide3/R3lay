import * as pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { schema } from './schema.js';

export const client = new pg.Client({
  connectionString: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/r3lay',
});

export const db = drizzle(client, { schema });
