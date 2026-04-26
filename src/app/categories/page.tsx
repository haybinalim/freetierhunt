import Link from 'next/link';
import slugify from 'slugify';
import type { Metadata } from 'next';
import { listCategories } from '@/lib/db/queries';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Categories — Browse AI tools by type',
  description:
    'Find free credits, trials and promo codes for AI tools by category — LLMs, inference, AI coding, data, infra and more.',
};

export default async function CategoriesIndex() {
  const categories = await listCategories();

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
      <header className="border-3 border-brutal-black bg-brutal-white p-6 shadow-brutal-lg md:p-10">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-brutal-black/60">Browse</p>
        <h1 className="mt-3 font-mono text-4xl font-bold uppercase tracking-tight md:text-6xl">
          Categories
        </h1>
        <p className="mt-4 max-w-2xl text-base md:text-lg">
          AI tool kategorilerine göre ücretsiz tier&apos;ları, trial&apos;ları ve promo kodlarını
          keşfet.
        </p>
      </header>

      {categories.length === 0 ? (
        <p className="mt-10 border-3 border-dashed border-brutal-black/40 bg-brutal-white p-6 font-mono text-sm">
          No categories yet.
        </p>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <Link
              key={c.category}
              href={`/categories/${slugify(c.category, { lower: true, strict: true })}`}
              className="group block border-3 border-brutal-black bg-brutal-white p-6 shadow-brutal transition-transform hover:-translate-x-1 hover:-translate-y-1 hover:shadow-brutal-lg"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-mono text-xl font-bold uppercase tracking-tight group-hover:underline">
                  {c.category}
                </h2>
                <span className="border-2 border-brutal-black bg-brutal-yellow px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest">
                  {c.productCount}
                </span>
              </div>
              <p className="mt-3 font-mono text-xs uppercase tracking-widest text-brutal-black/60">
                {c.productCount === 1 ? '1 product' : `${c.productCount} products`} →
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
