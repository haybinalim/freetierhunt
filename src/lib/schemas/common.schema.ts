import { z } from 'zod';

/** Visitor fingerprint hash — 64-char hex (sha256) */
export const visitorIdSchema = z.string().regex(/^[a-f0-9]{16,64}$/i, 'invalid visitor id');

/** Slugified product identifier */
export const slugSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9-]+$/, 'must be lowercase, alphanumeric, hyphen-only');

/** Positive integer ID (DB serial) */
export const idSchema = z.coerce.number().int().positive();

/** Standard pagination */
export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export type Pagination = z.infer<typeof paginationSchema>;
