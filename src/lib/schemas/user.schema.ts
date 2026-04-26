import { z } from 'zod';
import { idSchema } from './common.schema';

/** Notification frequency — matches notificationEnum */
export const notificationFrequencySchema = z.enum(['never', 'weekly', 'instant']);

/** POST /api/account/saved-offers — toggle saved offer */
export const saveOfferRequestSchema = z.object({
  offerId: idSchema,
});
export type SaveOfferRequest = z.infer<typeof saveOfferRequestSchema>;

/** PATCH /api/account/preferences — notification settings */
export const updatePreferencesRequestSchema = z.object({
  notificationFrequency: notificationFrequencySchema,
});
export type UpdatePreferencesRequest = z.infer<typeof updatePreferencesRequestSchema>;

/** POST /api/auth/signup or /api/auth/magic-link */
export const emailRequestSchema = z.object({
  email: z.string().email().max(255),
});
export type EmailRequest = z.infer<typeof emailRequestSchema>;
