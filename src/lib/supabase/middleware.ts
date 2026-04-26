/**
 * Refreshes the Supabase auth session on every request via middleware cookies.
 * No-op if Supabase env is not configured (auth scaffold mode).
 *
 * Wire into src/middleware.ts:
 *   const supabaseResponse = await updateSession(request, response);
 */
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(
  req: NextRequest,
  response: NextResponse
): Promise<NextResponse> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(toSet: { name: string; value: string; options: Record<string, unknown> }[]) {
        for (const { name, value, options } of toSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Triggers refresh + writes new tokens into `response.cookies` if needed.
  await supabase.auth.getUser();

  return response;
}
