import type { Metadata } from 'next';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { desc } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { sourceFetchRuns, sources } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/admin/guard';
import { syncOfficialSource } from '@/lib/sources/sync';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Sources · Admin',
  robots: { index: false, follow: false },
};

const HEALTH_STYLES: Record<string, string> = {
  healthy: 'bg-brutal-green',
  degraded: 'bg-brutal-orange',
  paused: 'bg-brutal-yellow',
  retired: 'bg-brutal-red text-brutal-white',
};

function toPublicHttpUrl(value: FormDataEntryValue | null): URL | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const url = new URL(value.trim());
    if ((url.protocol !== 'https:' && url.protocol !== 'http:') || url.username || url.password) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

async function addOfficialSource(formData: FormData) {
  'use server';
  await requireAdmin();

  const name = String(formData.get('name') ?? '')
    .trim()
    .slice(0, 255);
  const baseUrl = toPublicHttpUrl(formData.get('baseUrl'));
  const interval = Number(formData.get('syncIntervalMinutes') ?? 1_440);

  if (!name || !baseUrl || !Number.isInteger(interval) || interval < 15 || interval > 10_080)
    return;

  await db
    .insert(sources)
    .values({
      name,
      type: 'official',
      baseUrl: baseUrl.toString(),
      canonicalDomain: baseUrl.hostname.replace(/^www\./, '').toLowerCase(),
      trustScore: 100,
      allowAutomatedSync: true,
      syncIntervalMinutes: interval,
      healthStatus: 'healthy',
    })
    .onConflictDoNothing();

  revalidatePath('/admin/sources');
}

async function syncSource(formData: FormData) {
  'use server';
  await requireAdmin();

  const sourceId = Number(formData.get('sourceId'));
  if (!Number.isInteger(sourceId) || sourceId <= 0) return;
  await syncOfficialSource(sourceId);
  revalidatePath('/admin/sources');
}

export default async function AdminSourcesPage() {
  await requireAdmin();

  const [sourceRows, fetchRuns] = await Promise.all([
    db.select().from(sources).orderBy(desc(sources.updatedAt)).limit(100),
    db.select().from(sourceFetchRuns).orderBy(desc(sourceFetchRuns.fetchedAt)).limit(500),
  ]);
  const latestRunBySource = new Map<number, (typeof fetchRuns)[number]>();
  for (const run of fetchRuns) {
    if (!latestRunBySource.has(run.sourceId)) latestRunBySource.set(run.sourceId, run);
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <header className="border-3 border-brutal-black bg-brutal-white p-6 shadow-brutal-lg md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-brutal-black/60">
              Admin
            </p>
            <h1 className="mt-3 font-mono text-3xl font-bold uppercase tracking-tight md:text-4xl">
              Source health
            </h1>
            <p className="mt-2 max-w-3xl font-mono text-xs uppercase tracking-widest text-brutal-black/60">
              Official sources only · every fetch is recorded · three consecutive failures mark a
              source degraded
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/telegram"
              className="border-2 border-brutal-black bg-brutal-white px-3 py-2 font-mono text-xs font-bold uppercase tracking-widest shadow-brutal"
            >
              Telegram ingress →
            </Link>
            <Link
              href="/admin/discovery"
              className="border-2 border-brutal-black bg-brutal-green px-3 py-2 font-mono text-xs font-bold uppercase tracking-widest shadow-brutal"
            >
              Discovery queue →
            </Link>
            <Link
              href="/admin/submissions"
              className="border-2 border-brutal-black bg-brutal-yellow px-3 py-2 font-mono text-xs font-bold uppercase tracking-widest shadow-brutal"
            >
              Review submissions →
            </Link>
          </div>
        </div>
      </header>

      <section className="mt-8 border-3 border-brutal-black bg-brutal-white p-5 shadow-brutal">
        <h2 className="font-mono text-lg font-bold uppercase tracking-tight">
          Add official source
        </h2>
        <p className="mt-1 text-sm text-brutal-black/70">
          Add a provider pricing, free-tier or program page. The first sync is started manually so
          you can review its behavior.
        </p>
        <form
          action={addOfficialSource}
          className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-[1fr_2fr_180px_auto] md:items-end"
        >
          <label className="font-mono text-[10px] font-bold uppercase tracking-widest">
            Source name
            <input
              required
              name="name"
              placeholder="AWS Free Tier"
              className="mt-1 block w-full border-2 border-brutal-black bg-brutal-white px-3 py-2 font-mono text-xs"
            />
          </label>
          <label className="font-mono text-[10px] font-bold uppercase tracking-widest">
            Official URL
            <input
              required
              type="url"
              name="baseUrl"
              placeholder="https://provider.example/free-tier"
              className="mt-1 block w-full border-2 border-brutal-black bg-brutal-white px-3 py-2 font-mono text-xs"
            />
          </label>
          <label className="font-mono text-[10px] font-bold uppercase tracking-widest">
            Check interval (min)
            <input
              required
              type="number"
              name="syncIntervalMinutes"
              min="15"
              max="10080"
              defaultValue="1440"
              className="mt-1 block w-full border-2 border-brutal-black bg-brutal-white px-3 py-2 font-mono text-xs"
            />
          </label>
          <button
            type="submit"
            className="border-3 border-brutal-black bg-brutal-green px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest shadow-brutal transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5"
          >
            Add source
          </button>
        </form>
      </section>

      <section className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-mono text-xl font-bold uppercase tracking-tight">Tracked sources</h2>
          <span className="font-mono text-xs uppercase tracking-widest text-brutal-black/60">
            {sourceRows.length} sources
          </span>
        </div>

        {sourceRows.length === 0 ? (
          <p className="mt-4 border-3 border-dashed border-brutal-black/40 bg-brutal-white p-6 font-mono text-sm">
            No sources yet. Add an official provider URL to start the evidence pipeline.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto border-3 border-brutal-black bg-brutal-white shadow-brutal">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead className="border-b-3 border-brutal-black bg-brutal-yellow font-mono text-[10px] font-bold uppercase tracking-widest">
                <tr>
                  <th className="p-3">Source</th>
                  <th className="p-3">Health</th>
                  <th className="p-3">Last fetch</th>
                  <th className="p-3">Latest run</th>
                  <th className="p-3">Failures</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {sourceRows.map((source) => {
                  const latestRun = latestRunBySource.get(source.id);
                  return (
                    <tr key={source.id} className="border-b-2 border-brutal-black/20 last:border-0">
                      <td className="p-3 align-top">
                        <p className="font-mono text-xs font-bold uppercase tracking-wide">
                          {source.name}
                        </p>
                        <a
                          href={source.baseUrl}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="text-brutal-blue mt-1 block max-w-[360px] truncate font-mono text-[10px] underline"
                        >
                          {source.baseUrl}
                        </a>
                      </td>
                      <td className="p-3 align-top">
                        <span
                          className={`inline-block border-2 border-brutal-black px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest ${HEALTH_STYLES[source.healthStatus]}`}
                        >
                          {source.healthStatus}
                        </span>
                      </td>
                      <td className="p-3 align-top font-mono text-xs">
                        {source.lastFetchAt
                          ? new Date(source.lastFetchAt).toLocaleString()
                          : 'Never'}
                      </td>
                      <td className="p-3 align-top">
                        {latestRun ? (
                          <div className="font-mono text-xs">
                            <p className="font-bold uppercase">{latestRun.status}</p>
                            <p className="mt-1 text-[10px] text-brutal-black/60">
                              {latestRun.httpStatus
                                ? `HTTP ${latestRun.httpStatus}`
                                : (latestRun.errorCode ?? '—')}
                              {latestRun.durationMs ? ` · ${latestRun.durationMs}ms` : ''}
                            </p>
                          </div>
                        ) : (
                          <span className="font-mono text-xs text-brutal-black/60">No runs</span>
                        )}
                      </td>
                      <td className="p-3 align-top font-mono text-xs">
                        {source.consecutiveFailures}
                      </td>
                      <td className="p-3 align-top">
                        <form action={syncSource}>
                          <input type="hidden" name="sourceId" value={source.id} />
                          <button
                            type="submit"
                            disabled={!source.allowAutomatedSync || source.status !== 'active'}
                            className="border-2 border-brutal-black bg-brutal-white px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest shadow-brutal disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Sync now
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
