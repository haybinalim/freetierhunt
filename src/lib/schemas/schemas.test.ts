import { describe, expect, it } from 'vitest';
import { submissionRequestSchema } from './offer.schema';
import { emailRequestSchema } from './user.schema';

describe('emailRequestSchema', () => {
  it('accepts a valid email', () => {
    expect(emailRequestSchema.safeParse({ email: 'dev@example.com' }).success).toBe(true);
  });

  it('rejects an invalid email', () => {
    expect(emailRequestSchema.safeParse({ email: 'not-an-email' }).success).toBe(false);
  });

  it('rejects an email longer than 255 characters', () => {
    const email = `${'a'.repeat(250)}@example.com`;
    expect(emailRequestSchema.safeParse({ email }).success).toBe(false);
  });
});

describe('submissionRequestSchema urls', () => {
  const base = {
    productName: 'Example',
    headline: 'Generous free tier',
    offerType: 'free_tier' as const,
  };

  it('accepts http(s) urls', () => {
    const result = submissionRequestSchema.safeParse({
      ...base,
      website: 'https://example.com',
      sourceUrl: 'https://example.com/pricing',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a value that is not a url', () => {
    const result = submissionRequestSchema.safeParse({ ...base, website: 'example' });
    expect(result.success).toBe(false);
  });

  it('rejects urls longer than 500 characters', () => {
    const result = submissionRequestSchema.safeParse({
      ...base,
      sourceUrl: `https://example.com/${'a'.repeat(500)}`,
    });
    expect(result.success).toBe(false);
  });
});
