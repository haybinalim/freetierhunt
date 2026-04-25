import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '../env';

const connectionString = env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set — see .env.example');
}

// Pooled connection (Supabase pgbouncer @ 6543) for runtime queries.
// drizzle-kit migrations use DIRECT_URL via drizzle.config.ts.
const queryClient = postgres(connectionString, {
  prepare: false, // pgbouncer transaction mode incompatible with prepared statements
  max: 10,
});

export const db = drizzle(queryClient);
export type Database = typeof db;
