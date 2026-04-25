import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Health endpoint — used by Vercel monitoring, k6 smoke tests, and uptime probes.
 * Excluded from CSP middleware via matcher in src/middleware.ts.
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'freetierhunt',
    timestamp: new Date().toISOString(),
    commit: process.env.VERCEL_GIT_COMMIT_SHA ?? 'local',
  });
}
