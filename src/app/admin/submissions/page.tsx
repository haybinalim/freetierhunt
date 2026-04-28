import type { Metadata } from 'next';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db/client';
import { submissions, products, offers } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import slugify from 'slugify';
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

/**
 * Approves a pending submission: ensures the product exists (creating one if not),
 * then inserts an offer row and marks the submission approved.
 */
async function approve(formData: FormData) {
  'use server';
  await requireAdmin();
  const id = Number(formData.get('id'));
  if (!Number.isFinite(id) || id <= 0) return;

  const [sub] = await db.select().from(submissions).where(eq(submissions.id, id)).limit(1);
  if (!sub || sub.status !== 'pending') return;

  // Resolve / create product by slug derived from product_name.
  const slug = slugify(sub.productName, { lower: true, strict: true }).slice(0, 100);
  let [product] = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
  if (!product) {
    const inserted = await db
      .insert(products)
      .values({
        name: sub.productName,
        slug,
        website: sub.website ?? null,
      })
      .returning();
    product = inserted[0];
  }

  if (!product) return;

  await db.insert(offers).values({
    productId: product.id,
    type: sub.offerType,
    status: 'active',
    headline: sub.headline,
    description: sub.description ?? null,
    terms: sub.terms ?? null,
    code: sub.code ?? null,
    expiresAt: sub.expiresAt ?? null,
  });

  await db
    .update(submissions)
    .set({ status: 'approved', reviewedAt: new Date(), updatedAt: new Date() })
    .where(eq(submissions.id, id));

  revalidatePath('/admin/submissions');
  revalidatePath('/');
  revalidatePath(`/products/${slug}`);
}

async function reject(formData: FormData) {
  'use server';
  await requireAdmin();
  const id = Number(formData.get('id'));
  const reason = String(formData.get('reason') ?? '').slice(0, 500);
  if (!Number.isFinite(id) || id <= 0) return;
  await db
    .update(submissions)
    .set({
      status: 'rejected',
      rejectionReason: reason || null,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(submissions.id, id));
  revalidatePath('/admin/submissions');
}

export default async function AdminSubmissionsPage() {
  await requireAdmin();

  const rows = await db.select().from(submissions).orderBy(desc(submissions.createdAt)).limit(100);

  const pending = rows.filter((r) => r.status === 'pending');
  const reviewed = rows.filter((r) => r.status !== 'pending');

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <header className="border-3 border-brutal-black bg-brutal-white p-6 shadow-brutal-lg">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-brutal-black/60">Admin</p>
        <h1 className="mt-3 font-mono text-3xl font-bold uppercase tracking-tight md:text-4xl">
          Submissions
        </h1>
        <p className="mt-2 font-mono text-xs uppercase tracking-widest text-brutal-black/60">
          {pending.length} pending · {reviewed.length} reviewed
        </p>
      </header>

      <section className="mt-8">
        <h2 className="font-mono text-xl font-bold uppercase tracking-tight">Pending</h2>
        {pending.length === 0 ? (
          <p className="mt-4 border-3 border-dashed border-brutal-black/40 bg-brutal-white p-6 font-mono text-sm">
            Inbox zero. ✨
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {pending.map((s) => (
              <article
                key={s.id}
                className="border-3 border-brutal-black bg-brutal-white p-5 shadow-brutal"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-bold uppercase tracking-wide">
                    {s.productName}
                  </span>
                  <span className="border-2 border-brutal-black bg-brutal-yellow px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest">
                    {s.offerType}
                  </span>
                  {s.code && (
                    <code className="border-2 border-dashed border-brutal-black bg-brutal-yellow/40 px-2 py-0.5 font-mono text-xs">
                      {s.code}
                    </code>
                  )}
                </div>
                <h3 className="mt-2 text-base font-bold leading-snug">{s.headline}</h3>
                {s.description && (
                  <p className="mt-1 text-sm text-brutal-black/75">{s.description}</p>
                )}
                {s.website && (
                  <p className="mt-1 break-all font-mono text-xs text-brutal-black/60">
                    {s.website}
                  </p>
                )}
                <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-brutal-black/50">
                  Submitted {s.createdAt ? new Date(s.createdAt).toLocaleString() : '—'}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <form action={approve}>
                    <input type="hidden" name="id" value={s.id} />
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center border-3 border-brutal-black bg-brutal-green px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-widest shadow-brutal transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5"
                    >
                      ✓ Approve
                    </button>
                  </form>
                  <form action={reject} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={s.id} />
                    <input
                      name="reason"
                      placeholder="Rejection reason (optional)"
                      className="border-2 border-brutal-black bg-brutal-white px-2 py-1 font-mono text-xs"
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center border-3 border-brutal-black bg-brutal-red px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-widest text-brutal-white shadow-brutal transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5"
                    >
                      ✕ Reject
                    </button>
                  </form>
                </div>
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
            {reviewed.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-3 border-2 border-brutal-black bg-brutal-white px-3 py-2 font-mono text-xs"
              >
                <span className="truncate">
                  <strong className="uppercase">{s.productName}</strong> — {s.headline}
                </span>
                <span
                  className={`shrink-0 border-2 border-brutal-black px-2 py-0.5 font-bold uppercase tracking-widest ${STATUS_COLORS[s.status]}`}
                >
                  {s.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
