import type { Metadata } from 'next';
import { revalidatePath } from 'next/cache';
import { desc, eq } from 'drizzle-orm';
import slugify from 'slugify';
import { db } from '@/lib/db/client';
import {
  offerEvidence,
  offers,
  offerVersions,
  products,
  sources,
  submissions,
} from '@/lib/db/schema';
import { requireAdmin } from '@/lib/admin/guard';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Submissions · Admin',
  robots: { index: false, follow: false },
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-brutal-yellow',
  approved: 'bg-brutal-green',
  rejected: 'bg-brutal-red text-brutal-white',
};

function normalizeHttpUrl(value: FormDataEntryValue | null): URL | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' || url.protocol === 'http:' ? url : null;
  } catch {
    return null;
  }
}

/**
 * Publishes a submission only when a reviewer records source-backed evidence.
 * The evidence, source and first offer version are created in the same request
 * so a live deal never appears without an audit trail.
 */
async function approve(formData: FormData) {
  'use server';
  await requireAdmin();

  const submissionId = Number(formData.get('id'));
  const evidenceUrl = normalizeHttpUrl(formData.get('evidenceUrl'));
  const evidenceQuote = String(formData.get('evidenceQuote') ?? '')
    .trim()
    .slice(0, 2000);

  if (!Number.isFinite(submissionId) || submissionId <= 0 || !evidenceUrl || !evidenceQuote) return;

  const [submission] = await db
    .select()
    .from(submissions)
    .where(eq(submissions.id, submissionId))
    .limit(1);
  if (!submission || submission.status !== 'pending') return;

  const now = new Date();
  const canonicalDomain = evidenceUrl.hostname.replace(/^www\./, '').toLowerCase();
  const sourceBaseUrl = evidenceUrl.origin;

  let [source] = await db.select().from(sources).where(eq(sources.baseUrl, sourceBaseUrl)).limit(1);
  if (!source) {
    const [createdSource] = await db
      .insert(sources)
      .values({
        name: `${submission.productName} official source`,
        type: 'official',
        baseUrl: sourceBaseUrl,
        canonicalDomain,
        trustScore: 100,
        allowAutomatedSync: false,
      })
      .returning();
    source = createdSource;
  }
  if (!source) return;

  const slug = slugify(submission.productName, { lower: true, strict: true }).slice(0, 100);
  let [product] = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
  if (!product) {
    const [createdProduct] = await db
      .insert(products)
      .values({
        name: submission.productName,
        slug,
        website: submission.website ?? sourceBaseUrl,
        canonicalDomain,
      })
      .returning();
    product = createdProduct;
  } else if (!product.canonicalDomain) {
    const [updatedProduct] = await db
      .update(products)
      .set({ canonicalDomain, updatedAt: now })
      .where(eq(products.id, product.id))
      .returning();
    product = updatedProduct ?? product;
  }
  if (!product) return;

  const [offer] = await db
    .insert(offers)
    .values({
      productId: product.id,
      sourceId: source.id,
      type: submission.offerType,
      status: 'active',
      verificationState: 'verified',
      headline: submission.headline,
      description: submission.description ?? null,
      terms: submission.terms ?? null,
      code: submission.code ?? null,
      expiresAt: submission.expiresAt ?? null,
      canonicalClaimUrl: submission.website ?? evidenceUrl.toString(),
      trustScore: source.trustScore,
      lastVerifiedAt: now,
      reverifyAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    })
    .returning();
  if (!offer) return;

  await db.insert(offerEvidence).values({
    offerId: offer.id,
    type: 'official_page',
    url: evidenceUrl.toString(),
    quote: evidenceQuote,
    fieldClaims: {
      offerType: submission.offerType,
      code: submission.code ?? null,
      expiresAt: submission.expiresAt?.toISOString() ?? null,
    },
    observedAt: now,
    isPrimary: true,
  });

  await db.insert(offerVersions).values({
    offerId: offer.id,
    version: 1,
    snapshot: {
      headline: offer.headline,
      description: offer.description,
      code: offer.code,
      status: offer.status,
      verificationState: offer.verificationState,
      canonicalClaimUrl: offer.canonicalClaimUrl,
      evidenceUrl: evidenceUrl.toString(),
    },
    changeSummary: 'Initial source-backed publication',
    createdBy: 'admin',
  });

  await db
    .update(submissions)
    .set({ status: 'approved', reviewedAt: now, updatedAt: now })
    .where(eq(submissions.id, submissionId));

  revalidatePath('/');
  revalidatePath('/admin/submissions');
  revalidatePath(`/products/${slug}`);
}

async function reject(formData: FormData) {
  'use server';
  await requireAdmin();
  const id = Number(formData.get('id'));
  const reason = String(formData.get('reason') ?? '')
    .trim()
    .slice(0, 500);
  if (!Number.isFinite(id) || id <= 0) return;

  await db
    .update(submissions)
    .set({
      status: 'rejected',
      rejectionReason: reason || 'No evidence supplied',
      reviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(submissions.id, id));
  revalidatePath('/admin/submissions');
}

export default async function AdminSubmissionsPage() {
  await requireAdmin();
  const rows = await db.select().from(submissions).orderBy(desc(submissions.createdAt)).limit(100);
  const pending = rows.filter((row) => row.status === 'pending');
  const reviewed = rows.filter((row) => row.status !== 'pending');

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <header className="border-3 border-brutal-black bg-brutal-white p-6 shadow-brutal-lg">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-brutal-black/60">Admin</p>
        <h1 className="mt-3 font-mono text-3xl font-bold uppercase tracking-tight md:text-4xl">
          Evidence review
        </h1>
        <p className="mt-2 max-w-3xl font-mono text-xs uppercase tracking-widest text-brutal-black/60">
          {pending.length} pending · {reviewed.length} reviewed · publication requires a source URL
          and quoted proof
        </p>
      </header>

      <section className="mt-8">
        <h2 className="font-mono text-xl font-bold uppercase tracking-tight">Pending</h2>
        {pending.length === 0 ? (
          <p className="mt-4 border-3 border-dashed border-brutal-black/40 bg-brutal-white p-6 font-mono text-sm">
            Inbox zero.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {pending.map((submission) => (
              <article
                key={submission.id}
                className="border-3 border-brutal-black bg-brutal-white p-5 shadow-brutal"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-bold uppercase tracking-wide">
                    {submission.productName}
                  </span>
                  <span className="border-2 border-brutal-black bg-brutal-yellow px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest">
                    {submission.offerType}
                  </span>
                  {submission.code && (
                    <code className="border-2 border-dashed border-brutal-black bg-brutal-yellow/40 px-2 py-0.5 font-mono text-xs">
                      {submission.code}
                    </code>
                  )}
                </div>
                <h3 className="mt-2 text-base font-bold leading-snug">{submission.headline}</h3>
                {submission.description && (
                  <p className="mt-1 text-sm text-brutal-black/75">{submission.description}</p>
                )}
                <p className="mt-2 break-all font-mono text-[10px] uppercase tracking-widest text-brutal-black/50">
                  Claim URL: {submission.website ?? 'not provided'}
                </p>

                <form
                  action={approve}
                  className="mt-5 border-t-2 border-dashed border-brutal-black/30 pt-4"
                >
                  <input type="hidden" name="id" value={submission.id} />
                  <label className="block font-mono text-[10px] font-bold uppercase tracking-widest">
                    Official proof URL
                    <input
                      required
                      type="url"
                      name="evidenceUrl"
                      defaultValue={submission.sourceUrl ?? submission.website ?? ''}
                      placeholder="https://vendor.example/pricing"
                      className="mt-1 block w-full border-2 border-brutal-black bg-brutal-white px-3 py-2 font-mono text-xs"
                    />
                  </label>
                  <label className="mt-3 block font-mono text-[10px] font-bold uppercase tracking-widest">
                    Quoted proof
                    <textarea
                      required
                      name="evidenceQuote"
                      defaultValue={submission.description ?? ''}
                      placeholder="Quote the exact text that proves the offer, eligibility or expiry."
                      rows={3}
                      className="mt-1 block w-full border-2 border-brutal-black bg-brutal-white px-3 py-2 text-sm"
                    />
                  </label>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center border-3 border-brutal-black bg-brutal-green px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-widest shadow-brutal transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5"
                    >
                      Publish with proof
                    </button>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-brutal-black/60">
                      Creates source, evidence and version 1
                    </span>
                  </div>
                </form>

                <form action={reject} className="mt-3 flex flex-wrap items-center gap-2">
                  <input type="hidden" name="id" value={submission.id} />
                  <input
                    name="reason"
                    placeholder="Rejection reason"
                    className="border-2 border-brutal-black bg-brutal-white px-2 py-1 font-mono text-xs"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center border-3 border-brutal-black bg-brutal-red px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-widest text-brutal-white shadow-brutal transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5"
                  >
                    Reject
                  </button>
                </form>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="font-mono text-xl font-bold uppercase tracking-tight">Recent reviews</h2>
        {reviewed.length === 0 ? (
          <p className="mt-4 font-mono text-xs uppercase tracking-widest text-brutal-black/60">
            None yet.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {reviewed.map((submission) => (
              <li
                key={submission.id}
                className="flex items-center justify-between gap-3 border-2 border-brutal-black bg-brutal-white px-3 py-2 font-mono text-xs"
              >
                <span className="truncate">
                  <strong className="uppercase">{submission.productName}</strong> —{' '}
                  {submission.headline}
                </span>
                <span
                  className={`shrink-0 border-2 border-brutal-black px-2 py-0.5 font-bold uppercase tracking-widest ${STATUS_COLORS[submission.status]}`}
                >
                  {submission.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
