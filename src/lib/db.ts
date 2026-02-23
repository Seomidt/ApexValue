import { createClient } from '@libsql/client/node';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const authToken = process.env.TURSO_AUTH_TOKEN;

const client = createClient({ url, authToken });

export const db = drizzle(client, { schema });

export type DB = typeof db;

let dbReady = false;

/** Ensures tables exist before first use. No-op after the first call. */
export async function ensureDB(): Promise<void> {
  if (dbReady) return;
  dbReady = true;
  const { initDB } = await import('./init-db');
  await initDB();
}
