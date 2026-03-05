import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

let _client: postgres.Sql | null = null;
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

function requirePostgresUrl(): string {
  const postgresUrl = process.env.POSTGRES_URL;
  if (!postgresUrl) {
    throw new Error('POSTGRES_URL environment variable is not set');
  }
  return postgresUrl;
}

export function getDb() {
  if (_db) return _db;
  const postgresUrl = requirePostgresUrl();
  _client = postgres(postgresUrl);
  _db = drizzle(_client, { schema });
  return _db;
}

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop, receiver) {
    const instance = getDb() as unknown as Record<PropertyKey, unknown>;
    return Reflect.get(instance, prop, receiver);
  }
});

export function getDbClient() {
  if (_client) return _client;
  getDb();
  return _client!;
}
