import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { env } from '@/lib/env';
import { ADMIN_COOKIE, safeEqual } from '@/lib/admin/guard';

export const metadata: Metadata = {
  title: 'Admin login',
  robots: { index: false, follow: false },
};

async function login(formData: FormData) {
  'use server';
  const token = String(formData.get('token') ?? '');
  if (!env.ADMIN_TOKEN || !token || !safeEqual(token, env.ADMIN_TOKEN)) {
    redirect('/admin/login?error=1');
  }
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8, // 8h
  });
  redirect('/admin/submissions');
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className="mx-auto flex max-w-md flex-col px-6 py-16">
      <h1 className="font-mono text-3xl font-bold uppercase tracking-tight">Admin login</h1>
      <p className="mt-3 font-mono text-xs uppercase tracking-widest text-brutal-black/60">
        Interim shared-secret gate · Replaced by SSO in H9
      </p>
      <form
        action={login}
        className="mt-6 border-3 border-brutal-black bg-brutal-white p-5 shadow-brutal-lg"
      >
        <label className="block">
          <span className="font-mono text-xs uppercase tracking-widest">ADMIN_TOKEN</span>
          <input
            type="password"
            name="token"
            required
            autoComplete="off"
            className="mt-2 block w-full border-3 border-brutal-black bg-brutal-yellow/40 px-3 py-2 font-mono text-sm outline-none focus:bg-brutal-yellow"
          />
        </label>
        {error && (
          <p className="mt-3 border-2 border-brutal-black bg-brutal-red px-3 py-1 font-mono text-xs uppercase tracking-widest text-brutal-white">
            Wrong token
          </p>
        )}
        <button
          type="submit"
          className="mt-4 inline-flex items-center justify-center border-3 border-brutal-black bg-brutal-black px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-brutal-yellow shadow-brutal transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5"
        >
          Sign in →
        </button>
      </form>
    </div>
  );
}
