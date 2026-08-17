import type { Metadata } from 'next';
import Link from 'next/link';
import { and, desc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin/guard';
import { db } from '@/lib/db/client';
import { discoveryCandidates, sources, submissions } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Discovery queue · Admin',
  robots: { index: false, follow: false },
};

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-brutal-yellow',
  accepted: 'bg-brutal-green',
  dismissed: 'bg-brutal-white',
  superseded: 'bg-brutal-orange',
};

async function promoteCandidate(formData: FormData) {
  'use server';
  await requireAdmin();
  const candidateId = Number(formData.get('candidateId'));
  if (!Number.isInteger(candidateId) || candidateId <= 0) return;

  const [candidate] = await db
    .select({ candidate: discoveryCandidates, source: sources })
    .from(discoveryCandidates)
    .innerJoin(sources, eq(discoveryCandidates.sourceId, sources.id))
    .where(and(eq(discoveryCandidates.id, candidateId), eq(discoveryCandidates.status, 'pending')))
    .limit(1);
  const offerType = candidate?.candidate.offerType;
  if (!candidate || !offerType) return;

  await db.transaction(async (tx) => {
    await tx.insert(submissions).values({
      productName: candidate.source.name,
      offerType,
      headline: candidate.candidate.headline,
      description: candidate.candidate.evidenceQuote,
      sourceUrl: candidate.candidate.officialUrl,
      website: candidate.candidate.officialUrl,
      submitterRelationship: 'official_discovery',
      status: 'pending',
    });
    await tx
      .update(discoveryCandidates)
      .set({
        status: 'accepted',
        reviewReason: 'Promoted to official-page verification queue',
        updatedAt: new Date(),
      })
      .where(eq(discoveryCandidates.id, candidateId));
  });

  revalidatePath('/admin/discovery');
  revalidatePath('/admin/submissions');
}

async function dismissCandidate(formData: FormData) {
  'use server';
  await requireAdmin();
  const candidateId = Number(formData.get('candidateId'));
  if (!Number.isInteger(candidateId) || candidateId <= 0) return;
  await db
    .update(discoveryCandidates)
    .set({
      status: 'dismissed',
      reviewReason: 'Dismissed by moderator',
      updatedAt: new Date(),
    })
    .where(and(eq(discoveryCandidates.id, candidateId), eq(discoveryCandidates.status, 'pending')));
  revalidatePath('/admin/discovery');
}

export default async function AdminDiscoveryPage() {
  await requireAdmin();
  const rows = await db
    .select({ candidate: discoveryCandidates, source: sources })
    .from(discoveryCandidates)
    .innerJoin(sources, eq(discoveryCandidates.sourceId, sources.id))
    .orderBy(desc(discoveryCandidates.priority), desc(discoveryCandidates.createdAt))
    .limit(200);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <header className="border-3 border-brutal-black bg-brutal-white p-6 shadow-brutal-lg md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-brutal-black/60">
              Admin
            </p>
            <h1 className="mt-3 font-mono text-3xl font-bold uppercase tracking-tight md:text-4xl">
              Discovery queue
            </h1>
            <p className="mt-2 max-w-3xl font-mono text-xs uppercase tracking-widest text-brutal-black/60">
              Official-source candidates only · no candidate is published automatically
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/sources"
              className="border-2 border-brutal-black bg-brutal-white px-3 py-2 font-mono text-xs font-bold uppercase tracking-widest shadow-brutal"
            >
              Source health →
            </Link>
            <Link
              href="/admin/submissions"
              className="border-2 border-brutal-black bg-brutal-yellow px-3 py-2 font-mono text-xs font-bold uppercase tracking-widest shadow-brutal"
            >
              Verification queue →
            </Link>
          </div>
        </div>
      </header>

      {rows.length === 0 ? (
        <p className="mt-8 border-3 border-dashed border-brutal-black/40 bg-brutal-white p-6 font-mono text-sm">
          No discovery candidates yet. Add an official source and run a sync; only changed official
          pages that match an approved discovery profile create candidates.
        </p>
      ) : (
        <section className="mt-8 grid gap-4">
          {rows.map(({ candidate, source }) => (
            <article
              key={candidate.id}
              className="border-3 border-brutal-black bg-brutal-white p-5 shadow-brutal"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-brutal-black/60">
                    {source.name} · {candidate.discoveryMethod}
                  </p>
                  <h2 className="mt-2 font-mono text-lg font-bold uppercase tracking-tight">
                    {candidate.headline}
                  </h2>
                  <p className="mt-1 font-mono text-sm font-bold">
                    {candidate.value ?? 'Value needs review'}
                  </p>
                </div>
                <span
                  className={`border-2 border-brutal-black px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-widest ${STATUS_STYLES[candidate.status]}`}
                >
                  {candidate.status}
                </span>
              </div>
              <blockquote className="mt-4 border-l-4 border-brutal-black pl-3 text-sm italic text-brutal-black/80">
                “{candidate.evidenceQuote}”
              </blockquote>
              <a
                href={candidate.officialUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="text-brutal-blue mt-4 block truncate font-mono text-xs underline"
              >
                {candidate.officialUrl}
              </a>
              {candidate.status === 'pending' ? (
                <div className="mt-5 flex flex-wrap gap-3">
                  <form action={promoteCandidate}>
                    <input type="hidden" name="candidateId" value={candidate.id} />
                    <button className="border-2 border-brutal-black bg-brutal-green px-3 py-2 font-mono text-xs font-bold uppercase tracking-widest shadow-brutal">
                      Send to verification
                    </button>
                  </form>
                  <form action={dismissCandidate}>
                    <input type="hidden" name="candidateId" value={candidate.id} />
                    <button className="border-2 border-brutal-black bg-brutal-white px-3 py-2 font-mono text-xs font-bold uppercase tracking-widest shadow-brutal">
                      Dismiss
                    </button>
                  </form>
                </div>
              ) : (
                <p className="mt-4 font-mono text-xs uppercase tracking-widest text-brutal-black/60">
                  {candidate.reviewReason ?? 'No review note'}
                </p>
              )}
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
