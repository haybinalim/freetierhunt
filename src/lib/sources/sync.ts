import { and, desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { createCandidatesFromOfficialObservation } from '@/lib/discovery/candidate-service';
import { sourceFetchRuns, sourceObservations, sources } from '@/lib/db/schema';
import { OfficialHttpAdapter } from './official-http-adapter';
import { resolveHealthAfterFetch, type SourceRecord } from './types';

function stripMarkup(value: string): string {
  return value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractPageTitle(html: string): string | null {
  const match = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  if (!match?.[1]) return null;
  const title = stripMarkup(match[1]).slice(0, 500);
  return title || null;
}

function toSourceRecord(source: typeof sources.$inferSelect): SourceRecord {
  return {
    id: source.id,
    name: source.name,
    type: source.type,
    status: source.status,
    baseUrl: source.baseUrl,
    canonicalDomain: source.canonicalDomain,
    allowAutomatedSync: source.allowAutomatedSync,
    healthStatus: source.healthStatus,
    consecutiveFailures: source.consecutiveFailures,
  };
}

export type SyncSourceResult = {
  sourceId: number;
  runStatus: 'succeeded' | 'not_modified' | 'failed' | 'skipped';
  healthStatus: 'healthy' | 'degraded' | 'paused' | 'retired';
  observationCreated: boolean;
  candidatesDiscovered: number;
  candidatesInserted: number;
};

/**
 * Syncs a single approved official source. The function records every attempt,
 * preserves the last successful observation on failure and degrades a source only
 * after three consecutive failures.
 */
export async function syncOfficialSource(sourceId: number): Promise<SyncSourceResult> {
  const [source] = await db.select().from(sources).where(eq(sources.id, sourceId)).limit(1);
  if (!source) throw new Error(`Source ${sourceId} was not found`);

  const sourceRecord = toSourceRecord(source);
  const now = new Date();

  if (source.status !== 'active' || !source.allowAutomatedSync || source.type !== 'official') {
    const reason =
      source.status !== 'active'
        ? `Source status is ${source.status}`
        : source.type !== 'official'
          ? `Source type ${source.type} is not handled by the official HTTP adapter`
          : 'Automated sync is disabled for this source';

    await db.insert(sourceFetchRuns).values({
      sourceId: source.id,
      requestUrl: source.baseUrl,
      status: 'skipped',
      errorCode: 'SYNC_NOT_ALLOWED',
      errorMessage: reason,
      fetchedAt: now,
    });

    await db
      .update(sources)
      .set({ healthStatus: 'paused', lastFetchAt: now, lastHealthCheckAt: now, updatedAt: now })
      .where(eq(sources.id, source.id));

    return {
      sourceId: source.id,
      runStatus: 'skipped',
      healthStatus: 'paused',
      observationCreated: false,
      candidatesDiscovered: 0,
      candidatesInserted: 0,
    };
  }

  const [previousRun] = await db
    .select({
      etag: sourceFetchRuns.responseEtag,
      lastModified: sourceFetchRuns.responseLastModified,
    })
    .from(sourceFetchRuns)
    .where(
      and(
        eq(sourceFetchRuns.sourceId, source.id),
        inArray(sourceFetchRuns.status, ['succeeded', 'not_modified'])
      )
    )
    .orderBy(desc(sourceFetchRuns.fetchedAt))
    .limit(1);

  const adapter = new OfficialHttpAdapter();
  const result = await adapter.fetch(sourceRecord, {
    etag: previousRun?.etag,
    lastModified: previousRun?.lastModified,
  });

  await db.insert(sourceFetchRuns).values({
    sourceId: source.id,
    method: 'GET',
    requestUrl: result.requestUrl,
    status: result.status,
    httpStatus: result.httpStatus,
    durationMs: result.durationMs,
    responseEtag: result.etag,
    responseLastModified: result.lastModified,
    contentHash: result.contentHash,
    errorCode: result.errorCode,
    errorMessage: result.errorMessage,
    fetchedAt: now,
  });

  const health = resolveHealthAfterFetch({
    previousFailures: source.consecutiveFailures,
    runStatus: result.status,
  });

  await db
    .update(sources)
    .set({
      healthStatus: health.status,
      consecutiveFailures: health.consecutiveFailures,
      lastFetchAt: now,
      lastSuccessfulFetchAt:
        result.status === 'succeeded' || result.status === 'not_modified'
          ? now
          : source.lastSuccessfulFetchAt,
      lastHealthCheckAt: now,
      lastSyncedAt:
        result.status === 'succeeded' || result.status === 'not_modified'
          ? now
          : source.lastSyncedAt,
      updatedAt: now,
    })
    .where(eq(sources.id, source.id));

  let observationCreated = false;
  let candidatesDiscovered = 0;
  let candidatesInserted = 0;
  if (result.status === 'succeeded' && result.body && result.contentHash) {
    const pageText = stripMarkup(result.body);
    const insert = await db
      .insert(sourceObservations)
      .values({
        sourceId: source.id,
        url: result.requestUrl,
        title: extractPageTitle(result.body),
        excerpt: pageText.slice(0, 2_000) || null,
        contentHash: result.contentHash,
        observedAt: now,
        fetchedAt: now,
      })
      .onConflictDoNothing()
      .returning({ id: sourceObservations.id });
    observationCreated = insert.length > 0;
    if (insert[0]) {
      const discovery = await createCandidatesFromOfficialObservation(sourceRecord, {
        id: insert[0].id,
        url: result.requestUrl,
        title: extractPageTitle(result.body),
        excerpt: pageText.slice(0, 2_000) || null,
      });
      candidatesDiscovered = discovery.discovered;
      candidatesInserted = discovery.inserted;
    }
  }

  return {
    sourceId: source.id,
    runStatus: result.status,
    healthStatus: health.status,
    observationCreated,
    candidatesDiscovered,
    candidatesInserted,
  };
}
