import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

type PostgresClient = ReturnType<typeof postgres>;
type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;

let _client: PostgresClient | null = null;
let _db: DrizzleDb | null = null;

function getClient(): PostgresClient {
  if (!_client) {
    if (!process.env.POSTGRES_URL) {
      throw new Error('POSTGRES_URL environment variable is not set');
    }
    _client = postgres(process.env.POSTGRES_URL);
  }
  return _client;
}

function getDb(): DrizzleDb {
  if (!_db) {
    _db = drizzle(getClient(), { schema });
  }
  return _db;
}

/** Lazy-initialized postgres client. Throws only when first used, not at import time. */
export const client = new Proxy({} as PostgresClient, {
  get(_, prop) {
    return (getClient() as Record<string | symbol, unknown>)[prop];
  },
});

/** Lazy-initialized drizzle DB. Throws only when first used, not at import time. */
export const db = new Proxy({} as DrizzleDb, {
  get(_, prop) {
    return (getDb() as Record<string | symbol, unknown>)[prop];
  },
});
