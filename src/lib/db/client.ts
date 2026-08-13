import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '../env';

const connectionString = env.DATABASE_URL;

/**
 * The database is intentionally initialized lazily. Static builds and source-only
 * checks do not require production credentials, while an actual query still fails
 * fast with an actionable error if DATABASE_URL is missing.
 */
const queryClient = connectionString
  ? postgres(connectionString, {
      prepare: false, // pgbouncer transaction mode is incompatible with prepared statements
      max: 10,
    })
  : null;

const database = queryClient ? drizzle(queryClient) : null;
export type Database = NonNullable<typeof database>;

export function isDatabaseConfigured(): boolean {
  return database !== null;
}

export function getDb(): Database {
  if (!database) {
    throw new Error(
      'DATABASE_URL is not configured. Add it to .env.local for local data access or configure it in the deployment environment.'
    );
  }
  return database;
}

/**
 * Backwards-compatible lazy database facade. Existing query modules can keep a
 * single import while build-time module evaluation remains credential-free.
 */
export const db = new Proxy({} as Database, {
  get(_target, property, receiver) {
    return Reflect.get(getDb(), property, receiver);
  },
}) as Database;
