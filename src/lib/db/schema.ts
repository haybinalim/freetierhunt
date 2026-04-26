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
} from 'drizzle-orm/pg-core';

// Enums
export const offerTypeEnum = pgEnum('offer_type', ['free_tier', 'trial', 'credit', 'discount']);

export const offerStatusEnum = pgEnum('offer_status', ['active', 'expired', 'disabled']);

export const roleEnum = pgEnum('role', ['user', 'moderator', 'admin']); // B15

export const notificationEnum = pgEnum('notification', ['never', 'weekly', 'instant']); // B16 default 'never'

export const voteEnum = pgEnum('vote', ['up', 'down']);

export const eventTypeEnum = pgEnum('event_type', ['view', 'click', 'copy_code', 'verify_attempt']);

export const submissionStatusEnum = pgEnum('submission_status', [
  'pending',
  'approved',
  'rejected',
]);

// Products table
export const products = pgTable(
  'products',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 100 }).notNull().unique(),
    description: text('description'),
    website: varchar('website', { length: 500 }),
    category: varchar('category', { length: 100 }),
    logoUrl: varchar('logo_url', { length: 500 }),
    tags: jsonb('tags').$type<string[]>(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    slugIdx: index('products_slug_idx').on(table.slug), // B11
    categoryIdx: index('products_category_idx').on(table.category),
  })
);

// Offers table (B5: views_count ayrı, B11: indexes)
export const offers = pgTable(
  'offers',
  {
    id: serial('id').primaryKey(),
    productId: integer('product_id').notNull(),
    code: varchar('code', { length: 255 }),
    type: offerTypeEnum('type').notNull(),
    status: offerStatusEnum('status').default('active').notNull(),
    headline: varchar('headline', { length: 255 }).notNull(),
    description: text('description'),
    terms: text('terms'),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    value: varchar('value', { length: 100 }), // e.g., "$100", "3 months"
    maxRedemptions: integer('max_redemptions'),
    redemptionsCount: integer('redemptions_count').default(0),
    viewsCount: integer('views_count').default(0), // B5
    clicksCount: integer('clicks_count').default(0),
    score: integer('score').default(0), // calculated hotness
    extractedAt: timestamp('extracted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    productIdIdx: index('offers_product_id_idx').on(table.productId),
    statusIdx: index('offers_status_idx').on(table.status),
    expiresAtIdx: index('offers_expires_at_idx').on(table.expiresAt), // B11
    scoreIdx: index('offers_score_idx').on(table.score), // B11
    typeStatusIdx: index('offers_type_status_idx').on(table.type, table.status),
  })
);

// Offer events (view, click, etc.) - partitioned by time if needed later
export const offerEvents = pgTable(
  'offer_events',
  {
    id: serial('id').primaryKey(),
    offerId: integer('offer_id').notNull(),
    eventType: eventTypeEnum('event_type').notNull(),
    visitorId: varchar('visitor_id', { length: 64 }), // fingerprint hash
    ipHash: varchar('ip_hash', { length: 64 }), // hashed IP
    userAgent: varchar('user_agent', { length: 500 }),
    referrer: varchar('referrer', { length: 500 }),
    metadata: jsonb('metadata'), // flexible extra data
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    offerIdIdx: index('offer_events_offer_id_idx').on(table.offerId),
    typeIdx: index('offer_events_type_idx').on(table.eventType),
    createdAtIdx: index('offer_events_created_at_idx').on(table.createdAt),
  })
);

// Anonymous-safe votes (B2: no user_id, visitor_id + offer_id UNIQUE)
export const offerVotes = pgTable(
  'offer_votes',
  {
    id: serial('id').primaryKey(),
    offerId: integer('offer_id').notNull(),
    visitorId: varchar('visitor_id', { length: 64 }).notNull(),
    vote: voteEnum('vote').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    // B2: anonymous-safe unique constraint
    visitorOfferUnique: uniqueIndex('votes_visitor_offer_idx').on(table.visitorId, table.offerId),
    offerIdIdx: index('votes_offer_id_idx').on(table.offerId),
  })
);

// Reports (spam/abuse)
export const offerReports = pgTable('offer_reports', {
  id: serial('id').primaryKey(),
  offerId: integer('offer_id').notNull(),
  visitorId: varchar('visitor_id', { length: 64 }),
  reason: varchar('reason', { length: 50 }).notNull(),
  details: text('details'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  resolved: boolean('resolved').default(false),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
});

// Users table (B15: role enum)
export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: varchar('password_hash', { length: 255 }),
    role: roleEnum('role').default('user').notNull(), // B15
    notificationFrequency: notificationEnum('notification_frequency').default('never').notNull(), // B16
    emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    emailIdx: index('users_email_idx').on(table.email),
  })
);

// Saved offers
export const savedOffers = pgTable(
  'saved_offers',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull(),
    offerId: integer('offer_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    userOfferUnique: uniqueIndex('saved_user_offer_idx').on(table.userId, table.offerId),
  })
);

// Submissions (user-contributed offers)
export const submissions = pgTable(
  'submissions',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id'),
    productName: varchar('product_name', { length: 255 }).notNull(),
    offerType: offerTypeEnum('offer_type').notNull(),
    code: varchar('code', { length: 255 }),
    headline: varchar('headline', { length: 255 }).notNull(),
    description: text('description'),
    terms: text('terms'),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    website: varchar('website', { length: 500 }),
    status: submissionStatusEnum('status').default('pending').notNull(),
    rejectionReason: text('rejection_reason'),
    reviewedBy: integer('reviewed_by'),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    statusIdx: index('submissions_status_idx').on(table.status),
    userIdIdx: index('submissions_user_id_idx').on(table.userId),
  })
);

// Digest log (B13: idempotency)
export const digestLog = pgTable('digest_log', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  sentAt: timestamp('sent_at', { withTimezone: true }).defaultNow(),
  periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
  periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),
  offerIds: jsonb('offer_ids').$type<number[]>(),
  emailContentHash: varchar('email_content_hash', { length: 64 }), // B13
});

// LLM tracking
export const llmCalls = pgTable('llm_calls', {
  id: serial('id').primaryKey(),
  provider: varchar('provider', { length: 50 }).notNull(),
  model: varchar('model', { length: 100 }).notNull(),
  promptTokens: integer('prompt_tokens').default(0),
  completionTokens: integer('completion_tokens').default(0),
  costUsd: varchar('cost_usd', { length: 20 }), // decimal as string
  success: boolean('success').default(true),
  errorMessage: text('error_message'),
  latencyMs: integer('latency_ms'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Firecrawl tracking
export const firecrawlUsage = pgTable('firecrawl_usage', {
  id: serial('id').primaryKey(),
  url: varchar('url', { length: 500 }).notNull(),
  pagesCrawled: integer('pages_crawled').default(1),
  success: boolean('success').default(true),
  errorMessage: text('error_message'),
  scrapedAt: timestamp('scraped_at', { withTimezone: true }).defaultNow(),
});

// Extraction queue for background jobs
export const extractionQueue = pgTable(
  'extraction_queue',
  {
    id: serial('id').primaryKey(),
    url: varchar('url', { length: 500 }).notNull(),
    status: varchar('status', { length: 20 }).default('pending').notNull(), // pending, processing, done, failed
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

// Feature flags
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
