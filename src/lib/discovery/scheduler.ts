import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { sources } from '@/lib/db/schema';
import { syncOfficialSource, type SyncSourceResult } from '@/lib/sources/sync';

const DEFAULT_SYNC_INTERVAL_MINUTES = 360;

export type DiscoveryCycleResult = {
  startedAt: Date;
  completedAt: Date;
  sourcesDue: number;
  sourcesSynced: number;
  candidatesDiscovered: number;
  candidatesInserted: number;
  runs: SyncSourceResult[];
};

export function isSourceDue(
  source: Pick<typeof sources.$inferSelect, 'lastSyncedAt' | 'syncIntervalMinutes'>,
  now: Date
): boolean {
  if (!source.lastSyncedAt) return true;
  const intervalMinutes = source.syncIntervalMinutes ?? DEFAULT_SYNC_INTERVAL_MINUTES;
  return now.getTime() - source.lastSyncedAt.getTime() >= intervalMinutes * 60_000;
}

/**
 * Runs sequentially so each source keeps its own adapter rate limit and one worker
 * cannot amplify traffic against a provider. Deployment should run only one worker
 * instance or use a distributed lock around this function.
 */
export async function runDiscoveryCycle(now = new Date()): Promise<DiscoveryCycleResult> {
  const startedAt = new Date();
  const eligibleSources = await db
    .select()
    .from(sources)
    .where(
      and(
        eq(sources.status, 'active'),
        eq(sources.type, 'official'),
        eq(sources.allowAutomatedSync, true)
      )
    );

  const dueSources = eligibleSources.filter((source) => isSourceDue(source, now));
  const runs: SyncSourceResult[] = [];
  for (const source of dueSources) {
    runs.push(await syncOfficialSource(source.id));
  }

  return {
    startedAt,
    completedAt: new Date(),
    sourcesDue: dueSources.length,
    sourcesSynced: runs.length,
    candidatesDiscovered: runs.reduce((total, run) => total + run.candidatesDiscovered, 0),
    candidatesInserted: runs.reduce((total, run) => total + run.candidatesInserted, 0),
    runs,
  };
}
