import { z } from 'zod';
import { idSchema, visitorIdSchema } from './common.schema';

/** Offer types — must match pgEnum in src/lib/db/schema.ts */
export const offerTypeSchema = z.enum(['free_tier', 'trial', 'credit', 'discount']);

/** Vote direction — matches voteEnum */
export const voteSchema = z.enum(['up', 'down']);

/** POST /api/offers/[id]/vote — anonymous vote */
export const voteRequestSchema = z.object({
  offerId: idSchema,
  visitorId: visitorIdSchema,
  vote: voteSchema,
});
export type VoteRequest = z.infer<typeof voteRequestSchema>;

/** POST /api/offers/[id]/report — flag spam/broken */
export const reportRequestSchema = z.object({
  offerId: idSchema,
  visitorId: visitorIdSchema.optional(),
  reason: z.enum(['expired', 'broken', 'spam', 'incorrect', 'other']),
  details: z.string().max(500).optional(),
});
export type ReportRequest = z.infer<typeof reportRequestSchema>;

/** POST /api/submissions — community submission (B2: anonymous safe) */
export const submissionRequestSchema = z.object({
  productName: z.string().min(2).max(255),
  offerType: offerTypeSchema,
  code: z.string().max(255).optional(),
  headline: z.string().min(5).max(255),
  description: z.string().max(2000).optional(),
  terms: z.string().max(2000).optional(),
  expiresAt: z.coerce.date().optional(),
  website: z.string().url().max(500).optional(),
});
export type SubmissionRequest = z.infer<typeof submissionRequestSchema>;

/** POST /api/offers/[id]/event — telemetry (view, click, copy) */
export const eventRequestSchema = z.object({
  offerId: idSchema,
  eventType: z.enum(['view', 'click', 'copy_code', 'verify_attempt']),
  visitorId: visitorIdSchema.optional(),
});
export type EventRequest = z.infer<typeof eventRequestSchema>;

/** GET /api/offers — listing query params */
export const listOffersQuerySchema = z.object({
  type: offerTypeSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
export type ListOffersQuery = z.infer<typeof listOffersQuerySchema>;
