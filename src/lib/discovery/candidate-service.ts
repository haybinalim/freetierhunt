import { createHash } from 'node:crypto';
import { db } from '@/lib/db/client';
import { discoveryCandidates } from '@/lib/db/schema';
import type { SourceRecord } from '@/lib/sources/types';
import { discoverOfficialProgramCandidates } from './official-program-profiles';
import type { DiscoveryCandidateDraft, SourceObservationInput } from './types';

function normalizeForFingerprint(value: string): string {
  return value.replace(/\s+/g, ' ').trim().toLocaleLowerCase();
}

export function createCandidateFingerprint(
  sourceId: number,
  candidate: DiscoveryCandidateDraft
): string {
  const material = [
    sourceId,
    normalizeForFingerprint(candidate.officialUrl),
    candidate.offerType,
    normalizeForFingerprint(candidate.headline),
  ].join('|');
  return createHash('sha256').update(material).digest('hex');
}

export async function createCandidatesFromOfficialObservation(
  source: SourceRecord,
  observation: SourceObservationInput
): Promise<{ discovered: number; inserted: number }> {
  const drafts = discoverOfficialProgramCandidates(source, observation);
  if (!drafts.length) return { discovered: 0, inserted: 0 };

  const rows = drafts.map((candidate) => ({
    sourceId: source.id,
    sourceObservationId: observation.id,
    fingerprint: createCandidateFingerprint(source.id, candidate),
    officialUrl: candidate.officialUrl.slice(0, 500),
    headline: candidate.headline.slice(0, 255),
    offerType: candidate.offerType,
    value: candidate.value?.slice(0, 100) ?? null,
    evidenceQuote: candidate.evidenceQuote,
    structuredClaims: candidate.structuredClaims,
    discoveryMethod: candidate.discoveryMethod.slice(0, 100),
    priority: candidate.priority,
    status: 'pending' as const,
  }));

  const inserted = await db
    .insert(discoveryCandidates)
    .values(rows)
    .onConflictDoNothing({ target: discoveryCandidates.fingerprint })
    .returning({ id: discoveryCandidates.id });

  return { discovered: drafts.length, inserted: inserted.length };
}
