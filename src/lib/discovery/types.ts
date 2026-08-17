import type { SourceRecord } from '@/lib/sources/types';

export type DiscoveryOfferType = 'free_tier' | 'trial' | 'credit' | 'discount';

export type SourceObservationInput = {
  id: number;
  url: string;
  title: string | null;
  excerpt: string | null;
};

export type DiscoveryCandidateDraft = {
  officialUrl: string;
  headline: string;
  offerType: DiscoveryOfferType;
  value: string | null;
  evidenceQuote: string;
  structuredClaims: Record<string, unknown>;
  discoveryMethod: string;
  priority: number;
};

export type DiscoveryProfile = {
  key: string;
  matches(source: SourceRecord): boolean;
  extract(source: SourceRecord, observation: SourceObservationInput): DiscoveryCandidateDraft[];
};
