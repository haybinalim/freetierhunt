export type SourceHealth = 'healthy' | 'degraded' | 'paused' | 'retired';
export type FetchRunStatus = 'succeeded' | 'not_modified' | 'failed' | 'skipped';

export type SourceCursor = {
  etag?: string | null;
  lastModified?: string | null;
};

export type SourceRecord = {
  id: number;
  name: string;
  type: 'official' | 'partner_feed' | 'community_submission' | 'manual_research';
  status: 'active' | 'paused' | 'retired';
  baseUrl: string;
  canonicalDomain: string | null;
  allowAutomatedSync: boolean;
  healthStatus: SourceHealth;
  consecutiveFailures: number;
};

export type AdapterFetchResult = {
  status: FetchRunStatus;
  requestUrl: string;
  httpStatus: number | null;
  durationMs: number;
  etag: string | null;
  lastModified: string | null;
  body: string | null;
  contentHash: string | null;
  errorCode: string | null;
  errorMessage: string | null;
};

export type SourceHealthCheck = {
  status: SourceHealth;
  reason: string;
  checkedAt: Date;
};

export interface SourceAdapter {
  readonly key: string;
  readonly sourceType: SourceRecord['type'];
  readonly rateLimit: { requests: number; windowMs: number };
  fetch(source: SourceRecord, cursor?: SourceCursor): Promise<AdapterFetchResult>;
  healthCheck(source: SourceRecord): Promise<SourceHealthCheck>;
}

export function resolveHealthAfterFetch(input: {
  previousFailures: number;
  runStatus: FetchRunStatus;
}): Pick<SourceHealthCheck, 'status' | 'reason'> & { consecutiveFailures: number } {
  if (input.runStatus === 'succeeded' || input.runStatus === 'not_modified') {
    return {
      status: 'healthy',
      reason: input.runStatus === 'not_modified' ? 'Source content unchanged' : 'Fetch succeeded',
      consecutiveFailures: 0,
    };
  }

  if (input.runStatus === 'skipped') {
    return {
      status: 'paused',
      reason: 'Fetch skipped because the source is not eligible for automated sync',
      consecutiveFailures: input.previousFailures,
    };
  }

  const consecutiveFailures = input.previousFailures + 1;
  return {
    status: consecutiveFailures >= 3 ? 'degraded' : 'healthy',
    reason:
      consecutiveFailures >= 3
        ? 'Three consecutive fetch failures require administrator review'
        : 'Transient fetch failure',
    consecutiveFailures,
  };
}
