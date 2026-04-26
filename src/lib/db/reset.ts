/**
 * Dev-only: wipe products + offers tables and re-run seed.
 * Run: pnpm exec tsx --env-file=.env.local src/lib/db/reset.ts
 */
import { db } from './client';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('🧨 Truncating products + offers...');
  await db.execute(sql`TRUNCATE offers, products RESTART IDENTITY CASCADE`);
  console.log('✅ Cleared. Now run: pnpm db:seed');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Reset failed:', err);
    process.exit(1);
  });
