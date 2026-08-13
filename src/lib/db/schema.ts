import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  timestamp,
  boolean,
  pgEnum,
  index,
  uniqueIndex,
  jsonb,
  numeric,
} from 'drizzle-orm/pg-core';

// -----------------------------------------------------------------------------
// Enums
// -----------------------------------------------------------------------------
export const offerTypeEnum = pgEnum('offer_type', ['free_tier', 'trial', 'credit', 'discount']);

export const offerStatusEnum = pgEnum('offer_status', [
  'draft',
  'under_review',
  'active',
  'stale',
  'expired',
  'withdrawn',
  'superseded',
  'disabled',
]);

export const offerVerificationStateEnum = pgEnum('offer_verification_state', [
  'unverified',
  'verified',
  'needs_review',
  'failed',
]);

export const sourceTypeEnum = pgEnum('source_type', [
  'official',
  'partner_feed',
  'community_submission',
  'manual_research',
]);

export const sourceStatusEnum = pgEnum('source_status', ['active', 'paused', 'retired']);
export const sourceHealthEnum = pgEnum('source_health', [
  'healthy',
  'degraded',
  'paused',
  'retired',
]);

export const evidenceTypeEnum = pgEnum('evidence_type', [
  'official_page',
  'partner_feed',
  'manual_review',
  'community_submission',
]);

export const verificationOutcomeEnum = pgEnum('verification_outcome', [
  'passed',
  'failed',
  'inconclusive',
]);

export const roleEnum = pgEnum('role', ['user', 'moderator', 'admin']);
export const notificationEnum = pgEnum('notification', ['never', 'weekly', 'instant']);
export const voteEnum = pgEnum('vote', ['up', 'down']);
export const eventTypeEnum = pgEnum('event_type', ['view', 'click', 'copy_code', 'verify_attempt']);
export const submissionStatusEnum = pgEnum('submission_status', [
  'pending',
  'approved',
  'rejected',
]);
export const telegramInboundStatusEnum = pgEnum('telegram_inbound_status', [
  'received',
  'accepted',
  'ignored',
  'rejected',
]);

// -----------------------------------------------------------------------------
// Product and source catalog
// -----------------------------------------------------------------------------
export const products = pgTable(
  'products',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 100 }).notNull().unique(),
    description: text('description'),
    website: varchar('website', { length: 500 }),
    canonicalDomain: varchar('canonical_domain', { length: 255 }),
    category: varchar('category', { length: 100 }),
    logoUrl: varchar('logo_url', { length: 500 }),
    tags: jsonb('tags').$type<string[]>(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    slugIdx: index('products_slug_idx').on(table.slug),
    categoryIdx: index('products_category_idx').on(table.category),
    domainIdx: index('products_canonical_domain_idx').on(table.canonicalDomain),
  })
);

/** A trusted input channel. Telegram is deliberately not an ingestion type. */
export const sources = pgTable(
  'sources',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    type: sourceTypeEnum('type').notNull(),
    status: sourceStatusEnum('status').default('active').notNull(),
    baseUrl: varchar('base_url', { length: 500 }).notNull(),
    canonicalDomain: varchar('canonical_domain', { length: 255 }),
    ownerName: varchar('owner_name', { length: 255 }),
    trustScore: integer('trust_score').default(50).notNull(),
    allowAutomatedSync: boolean('allow_automated_sync').default(false).notNull(),
    syncIntervalMinutes: integer('sync_interval_minutes'),
    healthStatus: sourceHealthEnum('health_status').default('healthy').notNull(),
    consecutiveFailures: integer('consecutive_failures').default(0).notNull(),
    lastFetchAt: timestamp('last_fetch_at', { withTimezone: true }),
    lastSuccessfulFetchAt: timestamp('last_successful_fetch_at', { withTimezone: true }),
    lastHealthCheckAt: timestamp('last_health_check_at', { withTimezone: true }),
    notes: text('notes'),
    lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    baseUrlUnique: uniqueIndex('sources_base_url_idx').on(table.baseUrl),
    statusIdx: index('sources_status_idx').on(table.status),
    typeIdx: index('sources_type_idx').on(table.type),
    healthIdx: index('sources_health_idx').on(table.healthStatus),
  })
);

/** Immutable-ish record of what a source stated at a particular point in time. */
export const sourceObservations = pgTable(
  'source_observations',
  {
    id: serial('id').primaryKey(),
    sourceId: integer('source_id')
      .notNull()
      .references(() => sources.id, { onDelete: 'cascade' }),
    externalId: varchar('external_id', { length: 255 }),
    url: varchar('url', { length: 500 }).notNull(),
    title: varchar('title', { length: 500 }),
    excerpt: text('excerpt'),
    contentHash: varchar('content_hash', { length: 64 }).notNull(),
    observedAt: timestamp('observed_at', { withTimezone: true }).defaultNow().notNull(),
    fetchedAt: timestamp('fetched_at', { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    sourceHashUnique: uniqueIndex('source_observations_source_hash_idx').on(
      table.sourceId,
      table.contentHash
    ),
    sourceObservedIdx: index('source_observations_source_observed_idx').on(
      table.sourceId,
      table.observedAt
    ),
  })
);

export const sourceFetchRuns = pgTable(
  'source_fetch_runs',
  {
    id: serial('id').primaryKey(),
    sourceId: integer('source_id')
      .notNull()
      .references(() => sources.id, { onDelete: 'cascade' }),
    method: varchar('method', { length: 20 }).default('GET').notNull(),
    requestUrl: varchar('request_url', { length: 500 }).notNull(),
    status: varchar('status', { length: 20 }).notNull(), // succeeded, not_modified, failed, skipped
    httpStatus: integer('http_status'),
    durationMs: integer('duration_ms'),
    responseEtag: varchar('response_etag', { length: 500 }),
    responseLastModified: varchar('response_last_modified', { length: 500 }),
    contentHash: varchar('content_hash', { length: 64 }),
    errorCode: varchar('error_code', { length: 100 }),
    errorMessage: text('error_message'),
    fetchedAt: timestamp('fetched_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    sourceFetchedIdx: index('source_fetch_runs_source_fetched_idx').on(
      table.sourceId,
      table.fetchedAt
    ),
    sourceStatusIdx: index('source_fetch_runs_source_status_idx').on(table.sourceId, table.status),
  })
);

// -----------------------------------------------------------------------------
// Offers, evidence and verification history
// -----------------------------------------------------------------------------
export const offers = pgTable(
  'offers',
  {
    id: serial('id').primaryKey(),
    productId: integer('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    sourceId: integer('source_id').references(() => sources.id, { onDelete: 'set null' }),
    code: varchar('code', { length: 255 }),
    type: offerTypeEnum('type').notNull(),
    status: offerStatusEnum('status').default('draft').notNull(),
    verificationState: offerVerificationStateEnum('verification_state')
      .default('unverified')
      .notNull(),
    headline: varchar('headline', { length: 255 }).notNull(),
    description: text('description'),
    terms: text('terms'),
    canonicalClaimUrl: varchar('canonical_claim_url', { length: 500 }),
    eligibility: jsonb('eligibility').$type<{
      audiences?: string[];
      requiresVerification?: boolean;
      notes?: string;
    }>(),
    regions: jsonb('regions').$type<string[]>(),
    requiresCard: boolean('requires_card'),
    autoRenews: boolean('auto_renews'),
    renewalPrice: numeric('renewal_price', { precision: 12, scale: 2 }),
    renewalCurrency: varchar('renewal_currency', { length: 3 }),
    billingCycle: varchar('billing_cycle', { length: 30 }),
    cancellationTerms: text('cancellation_terms'),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    value: varchar('value', { length: 100 }),
    maxRedemptions: integer('max_redemptions'),
    redemptionsCount: integer('redemptions_count').default(0),
    viewsCount: integer('views_count').default(0),
    clicksCount: integer('clicks_count').default(0),
    score: integer('score').default(0),
    trustScore: integer('trust_score').default(0),
    lastVerifiedAt: timestamp('last_verified_at', { withTimezone: true }),
    reverifyAt: timestamp('reverify_at', { withTimezone: true }),
    extractedAt: timestamp('extracted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    productIdIdx: index('offers_product_id_idx').on(table.productId),
    sourceIdIdx: index('offers_source_id_idx').on(table.sourceId),
    statusIdx: index('offers_status_idx').on(table.status),
    expiresAtIdx: index('offers_expires_at_idx').on(table.expiresAt),
    scoreIdx: index('offers_score_idx').on(table.score),
    typeStatusIdx: index('offers_type_status_idx').on(table.type, table.status),
    reverifyIdx: index('offers_reverify_idx').on(table.reverifyAt),
  })
);

/** A source-backed, human-readable proof for one published offer. */
export const offerEvidence = pgTable(
  'offer_evidence',
  {
    id: serial('id').primaryKey(),
    offerId: integer('offer_id')
      .notNull()
      .references(() => offers.id, { onDelete: 'cascade' }),
    sourceObservationId: integer('source_observation_id').references(() => sourceObservations.id, {
      onDelete: 'set null',
    }),
    type: evidenceTypeEnum('type').notNull(),
    url: varchar('url', { length: 500 }).notNull(),
    quote: text('quote').notNull(),
    fieldClaims: jsonb('field_claims').$type<Record<string, string | number | boolean | null>>(),
    observedAt: timestamp('observed_at', { withTimezone: true }).defaultNow().notNull(),
    isPrimary: boolean('is_primary').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    offerIdx: index('offer_evidence_offer_idx').on(table.offerId),
    primaryIdx: index('offer_evidence_primary_idx').on(table.offerId, table.isPrimary),
  })
);

/** A snapshot of the user-facing version to make corrections auditable. */
export const offerVersions = pgTable(
  'offer_versions',
  {
    id: serial('id').primaryKey(),
    offerId: integer('offer_id')
      .notNull()
      .references(() => offers.id, { onDelete: 'cascade' }),
    version: integer('version').notNull(),
    snapshot: jsonb('snapshot').$type<Record<string, unknown>>().notNull(),
    changeSummary: text('change_summary'),
    createdBy: varchar('created_by', { length: 100 }).default('system').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    offerVersionUnique: uniqueIndex('offer_versions_offer_version_idx').on(
      table.offerId,
      table.version
    ),
    offerCreatedIdx: index('offer_versions_offer_created_idx').on(table.offerId, table.createdAt),
  })
);

/** Each verification attempt is retained even when it is inconclusive. */
export const verificationRuns = pgTable(
  'verification_runs',
  {
    id: serial('id').primaryKey(),
    offerId: integer('offer_id')
      .notNull()
      .references(() => offers.id, { onDelete: 'cascade' }),
    outcome: verificationOutcomeEnum('outcome').notNull(),
    method: varchar('method', { length: 100 }).notNull(),
    confidence: integer('confidence').default(0).notNull(),
    details: text('details'),
    modelVersion: varchar('model_version', { length: 150 }),
    promptVersion: varchar('prompt_version', { length: 100 }),
    costUsd: numeric('cost_usd', { precision: 12, scale: 6 }),
    startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
  },
  (table) => ({
    offerStartedIdx: index('verification_runs_offer_started_idx').on(
      table.offerId,
      table.startedAt
    ),
    outcomeIdx: index('verification_runs_outcome_idx').on(table.outcome),
  })
);

// -----------------------------------------------------------------------------
// Community feedback and operational records
// -----------------------------------------------------------------------------
export const offerEvents = pgTable(
  'offer_events',
  {
    id: serial('id').primaryKey(),
    offerId: integer('offer_id')
      .notNull()
      .references(() => offers.id, { onDelete: 'cascade' }),
    eventType: eventTypeEnum('event_type').notNull(),
    visitorId: varchar('visitor_id', { length: 64 }),
    ipHash: varchar('ip_hash', { length: 64 }),
    userAgent: varchar('user_agent', { length: 500 }),
    referrer: varchar('referrer', { length: 500 }),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    offerIdIdx: index('offer_events_offer_id_idx').on(table.offerId),
    typeIdx: index('offer_events_type_idx').on(table.eventType),
    createdAtIdx: index('offer_events_created_at_idx').on(table.createdAt),
  })
);

export const offerVotes = pgTable(
  'offer_votes',
  {
    id: serial('id').primaryKey(),
    offerId: integer('offer_id')
      .notNull()
      .references(() => offers.id, { onDelete: 'cascade' }),
    visitorId: varchar('visitor_id', { length: 64 }).notNull(),
    vote: voteEnum('vote').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    visitorOfferUnique: uniqueIndex('votes_visitor_offer_idx').on(table.visitorId, table.offerId),
    offerIdIdx: index('votes_offer_id_idx').on(table.offerId),
  })
);

export const offerReports = pgTable('offer_reports', {
  id: serial('id').primaryKey(),
  offerId: integer('offer_id')
    .notNull()
    .references(() => offers.id, { onDelete: 'cascade' }),
  visitorId: varchar('visitor_id', { length: 64 }),
  reason: varchar('reason', { length: 50 }).notNull(),
  details: text('details'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  resolved: boolean('resolved').default(false),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
});

export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: varchar('password_hash', { length: 255 }),
    role: roleEnum('role').default('user').notNull(),
    notificationFrequency: notificationEnum('notification_frequency').default('never').notNull(),
    emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    emailIdx: index('users_email_idx').on(table.email),
  })
);

export const savedOffers = pgTable(
  'saved_offers',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    offerId: integer('offer_id')
      .notNull()
      .references(() => offers.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    userOfferUnique: uniqueIndex('saved_user_offer_idx').on(table.userId, table.offerId),
  })
);

export const submissions = pgTable(
  'submissions',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
    productName: varchar('product_name', { length: 255 }).notNull(),
    offerType: offerTypeEnum('offer_type').notNull(),
    code: varchar('code', { length: 255 }),
    headline: varchar('headline', { length: 255 }).notNull(),
    description: text('description'),
    terms: text('terms'),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    website: varchar('website', { length: 500 }),
    sourceUrl: varchar('source_url', { length: 500 }),
    submitterRelationship: varchar('submitter_relationship', { length: 50 }),
    status: submissionStatusEnum('status').default('pending').notNull(),
    rejectionReason: text('rejection_reason'),
    reviewedBy: integer('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    statusIdx: index('submissions_status_idx').on(table.status),
    userIdIdx: index('submissions_user_id_idx').on(table.userId),
    sourceUrlIdx: index('submissions_source_url_idx').on(table.sourceUrl),
  })
);

/**
 * Minimal webhook audit trail for explicitly authorized Telegram chats. Raw message
 * text is deliberately not persisted; only the official URL and processing result.
 */
export const telegramInboundUpdates = pgTable(
  'telegram_inbound_updates',
  {
    id: serial('id').primaryKey(),
    updateId: integer('update_id').notNull().unique(),
    chatId: varchar('chat_id', { length: 32 }).notNull(),
    messageId: integer('message_id').notNull(),
    chatTitle: varchar('chat_title', { length: 255 }),
    officialUrl: varchar('official_url', { length: 500 }),
    submissionId: integer('submission_id').references(() => submissions.id, {
      onDelete: 'set null',
    }),
    status: telegramInboundStatusEnum('status').default('received').notNull(),
    reason: varchar('reason', { length: 500 }),
    receivedAt: timestamp('received_at', { withTimezone: true }).defaultNow().notNull(),
    processedAt: timestamp('processed_at', { withTimezone: true }),
  },
  (table) => ({
    chatReceivedIdx: index('telegram_inbound_chat_received_idx').on(table.chatId, table.receivedAt),
    statusIdx: index('telegram_inbound_status_idx').on(table.status),
  })
);

export const digestLog = pgTable('digest_log', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  sentAt: timestamp('sent_at', { withTimezone: true }).defaultNow(),
  periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
  periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),
  offerIds: jsonb('offer_ids').$type<number[]>(),
  emailContentHash: varchar('email_content_hash', { length: 64 }),
});

export const llmCalls = pgTable('llm_calls', {
  id: serial('id').primaryKey(),
  provider: varchar('provider', { length: 50 }).notNull(),
  model: varchar('model', { length: 100 }).notNull(),
  promptTokens: integer('prompt_tokens').default(0),
  completionTokens: integer('completion_tokens').default(0),
  costUsd: varchar('cost_usd', { length: 20 }),
  success: boolean('success').default(true),
  errorMessage: text('error_message'),
  latencyMs: integer('latency_ms'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const firecrawlUsage = pgTable('firecrawl_usage', {
  id: serial('id').primaryKey(),
  url: varchar('url', { length: 500 }).notNull(),
  pagesCrawled: integer('pages_crawled').default(1),
  success: boolean('success').default(true),
  errorMessage: text('error_message'),
  scrapedAt: timestamp('scraped_at', { withTimezone: true }).defaultNow(),
});

export const extractionQueue = pgTable(
  'extraction_queue',
  {
    id: serial('id').primaryKey(),
    url: varchar('url', { length: 500 }).notNull(),
    status: varchar('status', { length: 20 }).default('pending').notNull(),
    priority: integer('priority').default(0),
    retryCount: integer('retry_count').default(0),
    errorMessage: text('error_message'),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }).defaultNow(),
    processedAt: timestamp('processed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    statusIdx: index('queue_status_idx').on(table.status),
    scheduledIdx: index('queue_scheduled_idx').on(table.scheduledAt),
  })
);

export const featureFlags = pgTable(
  'feature_flags',
  {
    id: serial('id').primaryKey(),
    key: varchar('key', { length: 100 }).notNull().unique(),
    enabled: boolean('enabled').default(false).notNull(),
    description: text('description'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    keyIdx: index('flags_key_idx').on(table.key),
  })
);
