/**
 * FreeTierHunt Worker — background discovery runner.
 *
 * The worker discovers candidates from pre-approved official sources. It runs one
 * sequential cycle at a time; individual source cadence is still determined by
 * sync_interval_minutes in the database.
 */

process.env.TZ = 'UTC';

import { runDiscoveryCycle } from '../src/lib/discovery/scheduler';
import { logger } from '../src/lib/logger';

const LOOP_INTERVAL_MS = Number(process.env.DISCOVERY_WORKER_INTERVAL_MS ?? 5 * 60_000);
let cycleInProgress = false;

async function runScheduledCycle() {
  if (cycleInProgress) {
    logger.warn('Discovery cycle skipped because a previous cycle is still running');
    return;
  }

  cycleInProgress = true;
  try {
    const result = await runDiscoveryCycle();
    logger.info(
      {
        sourcesDue: result.sourcesDue,
        sourcesSynced: result.sourcesSynced,
        candidatesDiscovered: result.candidatesDiscovered,
        candidatesInserted: result.candidatesInserted,
        durationMs: result.completedAt.getTime() - result.startedAt.getTime(),
      },
      'Discovery cycle completed'
    );
  } catch (error) {
    logger.error({ error }, 'Discovery cycle failed');
  } finally {
    cycleInProgress = false;
  }
}

async function main() {
  if (!Number.isFinite(LOOP_INTERVAL_MS) || LOOP_INTERVAL_MS < 60_000) {
    throw new Error('DISCOVERY_WORKER_INTERVAL_MS must be at least 60000');
  }

  logger.info(
    { tz: process.env.TZ, node: process.version, loopIntervalMs: LOOP_INTERVAL_MS },
    'Worker boot'
  );
  await runScheduledCycle();
  const timer = setInterval(runScheduledCycle, LOOP_INTERVAL_MS);

  for (const sig of ['SIGINT', 'SIGTERM'] as const) {
    process.on(sig, () => {
      clearInterval(timer);
      logger.info({ sig }, 'Shutting down discovery worker');
      process.exit(0);
    });
  }
}

main().catch((error) => {
  logger.error({ error }, 'Worker crashed during boot');
  process.exit(1);
});
