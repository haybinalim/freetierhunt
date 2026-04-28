import { z } from 'zod';

/**
 * Type-safe environment variables with Zod validation (Hafta 1 Perşembe).
 *
 * Why this file exists:
 *   - Fail fast on boot if required vars are missing or malformed.
 *   - Type-safe access throughout codebase (no more `process.env.X!`).
 *   - Distinguish server-only vs client-exposed (NEXT_PUBLIC_*) vars.
 *   - Default values for optional vars (e.g. NODE_ENV → 'development').
 *
 * Usage:
 *   import { env } from '@/lib/env';
 *   const url = env.DATABASE_URL;  // typed string | undefined
 *
 * Notes:
 *   - Most vars marked `.optional()` because plan staggers their introduction
 *     across weeks (Supabase Hafta 2, Groq Hafta 1 Cuma, Resend Hafta 8, etc.)
 *     Once a feature is live, tighten its var to required in this file.
 *   - NEXT_PUBLIC_* must be referenced by literal name for Next.js bundler
 *     to inline them at build time — see clientEnv block below.
 */

// ---------- Server schema (only available in server-side code) ----------
const serverSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  TZ: z.string().default('UTC'),
  SITE_URL: z.string().url().default('http://localhost:3000'),

  // Database (Supabase) — wired Hafta 1 Çarşamba / Hafta 2
  DATABASE_URL: z.string().url().optional(),
  DIRECT_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20).optional(),

  // Redis / Worker — Hafta 3+
  REDIS_URL: z.string().url().optional(),

  // LLM Providers — Hafta 1 Cumartesi
  GROQ_API_KEY: z.string().min(20).optional(),
  OPENROUTER_API_KEY: z.string().min(20).optional(),
  OPENAI_API_KEY: z.string().min(20).optional(),
  NVIDIA_NIM_API_KEY: z.string().min(20).optional(),

  // Data sources — Hafta 3 / 7
  PH_API_KEY: z.string().min(10).optional(),
  PH_API_SECRET: z.string().min(10).optional(),
  FIRECRAWL_API_KEY: z.string().min(10).optional(),

  // Email (Resend) — Hafta 8
  RESEND_API_KEY: z.string().min(10).optional(),
  RESEND_WEBHOOK_SECRET: z.string().min(10).optional(),
  RESEND_FROM_EMAIL: z.string().email().optional(),

  // Monitoring — Hafta 1 Cuma (Sentry wizard)
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),

  // Webhooks
  DISCORD_WEBHOOK_URL: z.string().url().optional(),
  REVALIDATE_SECRET: z.string().min(16).optional(),

  // Admin gate (interim, until Supabase Auth role-based access in H9)
  ADMIN_TOKEN: z.string().min(16).optional(),

  // Vercel-injected (read-only at runtime)
  VERCEL_ENV: z.enum(['production', 'preview', 'development']).optional(),
  VERCEL_GIT_COMMIT_SHA: z.string().optional(),
  VERCEL_URL: z.string().optional(),

  // Logging
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).optional(),
});

// ---------- Client schema (NEXT_PUBLIC_* — exposed to browser) ----------
const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20).optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),
  NEXT_PUBLIC_TALLY_FORM_ID: z.string().optional(),
});

/** Treat empty strings as undefined so `KEY=` (no value) passes optional() validators. */
function stripEmptyStrings<T extends Record<string, string | undefined>>(obj: T): T {
  const cleaned: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(obj)) {
    cleaned[key] = typeof value === 'string' && value.trim() === '' ? undefined : value;
  }
  return cleaned as T;
}

// ---------- Validation (runs at module import time) ----------
function buildEnv() {
  // Client vars MUST be referenced by literal name so Next.js inlines them.
  // See https://nextjs.org/docs/app/building-your-application/configuring/environment-variables
  const rawClient = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    NEXT_PUBLIC_TALLY_FORM_ID: process.env.NEXT_PUBLIC_TALLY_FORM_ID,
  };

  const isServer = typeof window === 'undefined';

  // Server-side: validate full schema. Client-side: skip server vars.
  const serverParsed = isServer
    ? serverSchema.safeParse(stripEmptyStrings(process.env as Record<string, string | undefined>))
    : { success: true as const, data: {} as z.infer<typeof serverSchema> };

  const clientParsed = clientSchema.safeParse(stripEmptyStrings(rawClient));

  if (!serverParsed.success) {
    const errors = serverParsed.error.flatten().fieldErrors;
    console.error('❌ Invalid server environment variables:', errors);
    throw new Error(
      `Invalid server env: ${Object.keys(errors).join(', ')}. ` +
        `Check .env.local against .env.example.`
    );
  }

  if (!clientParsed.success) {
    const errors = clientParsed.error.flatten().fieldErrors;
    console.error('❌ Invalid client (NEXT_PUBLIC_*) env vars:', errors);
    throw new Error(`Invalid client env: ${Object.keys(errors).join(', ')}`);
  }

  return { ...serverParsed.data, ...clientParsed.data };
}

export const env = buildEnv();

export type Env = typeof env;
