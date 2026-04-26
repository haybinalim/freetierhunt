import { NextResponse } from 'next/server';
import type { ZodError } from 'zod';

/** Standard JSON success response */
export function ok<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, init);
}

/** Standard JSON error response */
export function err(message: string, status = 400, extra?: Record<string, unknown>): NextResponse {
  return NextResponse.json({ error: message, ...extra }, { status });
}

/** Validation error from zod */
export function badRequest(error: ZodError): NextResponse {
  return NextResponse.json(
    {
      error: 'validation_failed',
      issues: error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      })),
    },
    { status: 400 }
  );
}

/** Cache headers for public listing endpoints (ISR-friendly via Cloudflare) */
export const PUBLIC_CACHE = {
  'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
} as const;
