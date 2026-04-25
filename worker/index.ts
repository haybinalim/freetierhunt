/**
 * FreeTierHunt Worker — Background job runner.
 *
 * Audit fix B1: TZ enforced UTC at runtime entry to prevent cron drift.
 * Audit fix B3: PM2 ecosystem.config.cjs runs this with instances:1 fork mode
 *               to prevent duplicate cron execution.
 * Audit fix B9: Stale recovery sweeps run on schedule (Hafta 4+).
 *
 * Job topology (built out by week):
 *   Hafta 3: PH leaderboard scrape, comment parser
 *   Hafta 4: LLM extraction queue
 *   Hafta 7: IndieHackers + Firecrawl enrichment
 *   Hafta 8: Email digest dispatcher
 *   Hafta 9: Validator agent
 */

// 🔴 B1: Force UTC before any date logic loads
process.env.TZ = 'UTC';

import { logger } from '../src/lib/logger';

async function main() {
  logger.info({ tz: process.env.TZ, node: process.version }, 'Worker boot');

  // BullMQ queues + cron schedules registered here in Hafta 3+
  // import { extractionWorker } from './workers/extraction';
  // import { startCronSchedules } from './cron';

  logger.info('Worker ready (placeholder — real jobs added Hafta 3+)');

  // Graceful shutdown
  for (const sig of ['SIGINT', 'SIGTERM'] as const) {
    process.on(sig, async () => {
      logger.info({ sig }, 'Shutting down worker');
      // await closeQueues();
      process.exit(0);
    });
  }
}

main().catch((err) => {
  logger.error({ err }, 'Worker crashed during boot');
  process.exit(1);
});
