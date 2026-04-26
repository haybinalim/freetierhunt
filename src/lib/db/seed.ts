/**
 * Seed data for development.
 * Run: pnpm db:seed
 *
 * Idempotent: uses ON CONFLICT DO NOTHING via slug/email uniqueness.
 */
import { db } from './client';
import { products, offers, featureFlags } from './schema';
import { sql } from 'drizzle-orm';

const PRODUCTS_SEED = [
  {
    name: 'OpenAI',
    slug: 'openai',
    description: 'Leading AI research lab — GPT-4, o-series, embeddings, DALL-E.',
    website: 'https://openai.com',
    category: 'LLM',
    logoUrl: 'https://openai.com/favicon.ico',
    tags: ['llm', 'chat', 'embeddings', 'image'],
  },
  {
    name: 'Anthropic Claude',
    slug: 'anthropic',
    description: 'Claude family — long context, strong reasoning, computer use.',
    website: 'https://anthropic.com',
    category: 'LLM',
    logoUrl: 'https://anthropic.com/favicon.ico',
    tags: ['llm', 'chat', 'reasoning'],
  },
  {
    name: 'Groq',
    slug: 'groq',
    description: 'Ultra-fast LPU inference for Llama, Mixtral, Whisper.',
    website: 'https://groq.com',
    category: 'Inference',
    logoUrl: 'https://groq.com/favicon.ico',
    tags: ['inference', 'fast', 'free-tier'],
  },
  {
    name: 'OpenRouter',
    slug: 'openrouter',
    description: 'Unified API for 100+ LLMs with automatic fallback.',
    website: 'https://openrouter.ai',
    category: 'Inference',
    logoUrl: 'https://openrouter.ai/favicon.ico',
    tags: ['inference', 'multi-model', 'free-tier'],
  },
  {
    name: 'Firecrawl',
    slug: 'firecrawl',
    description: 'LLM-ready web scraping & crawling API.',
    website: 'https://firecrawl.dev',
    category: 'Data',
    logoUrl: 'https://firecrawl.dev/favicon.ico',
    tags: ['scraping', 'data', 'free-tier'],
  },
  {
    name: 'Vercel',
    slug: 'vercel',
    description: 'Frontend cloud + edge compute, generous Hobby tier.',
    website: 'https://vercel.com',
    category: 'Hosting',
    logoUrl: 'https://vercel.com/favicon.ico',
    tags: ['hosting', 'edge', 'free-tier'],
  },
  {
    name: 'Supabase',
    slug: 'supabase',
    description: 'Open-source Firebase alternative — Postgres, Auth, Storage.',
    website: 'https://supabase.com',
    category: 'Backend',
    logoUrl: 'https://supabase.com/favicon.ico',
    tags: ['database', 'auth', 'free-tier'],
  },
  {
    name: 'NVIDIA NIM',
    slug: 'nvidia-nim',
    description: 'NVIDIA-hosted inference for Llama, Mistral, NeMo models.',
    website: 'https://build.nvidia.com',
    category: 'Inference',
    logoUrl: 'https://nvidia.com/favicon.ico',
    tags: ['inference', 'free-tier'],
  },
];

const FLAGS_SEED = [
  { key: 'submissions_enabled', enabled: true, description: 'Allow user submissions' },
  { key: 'voting_enabled', enabled: true, description: 'Allow anonymous voting' },
  { key: 'digest_enabled', enabled: false, description: 'Weekly email digest' },
  { key: 'extraction_enabled', enabled: false, description: 'Background LLM extraction' },
];

async function main() {
  console.log('🌱 Seeding products...');
  for (const p of PRODUCTS_SEED) {
    await db.insert(products).values(p).onConflictDoNothing({ target: products.slug });
  }
  console.log(`  ✓ ${PRODUCTS_SEED.length} products`);

  console.log('🌱 Seeding sample offers...');
  // Pull product IDs by slug
  const rows = await db.select({ id: products.id, slug: products.slug }).from(products);
  const bySlug = Object.fromEntries(rows.map((r) => [r.slug, r.id]));

  const OFFERS_SEED = [
    {
      productId: bySlug['openai'],
      type: 'credit' as const,
      headline: '$5 free credit on signup (new accounts)',
      description: 'API trial credit, expires in 3 months.',
      value: '$5',
      status: 'active' as const,
    },
    {
      productId: bySlug['anthropic'],
      type: 'credit' as const,
      headline: '$5 free credit for new Console accounts',
      description: 'Console signup bonus.',
      value: '$5',
      status: 'active' as const,
    },
    {
      productId: bySlug['groq'],
      type: 'free_tier' as const,
      headline: 'Free Llama 3.1 70B & Mixtral inference',
      description: 'Generous free tier with rate limits.',
      value: 'Free',
      status: 'active' as const,
    },
    {
      productId: bySlug['openrouter'],
      type: 'free_tier' as const,
      headline: ':free model variants — no payment required',
      description: 'Llama, Gemma, DeepSeek free endpoints.',
      value: 'Free',
      status: 'active' as const,
    },
    {
      productId: bySlug['firecrawl'],
      type: 'free_tier' as const,
      headline: '500 credits/month free tier',
      description: 'Scrape, crawl, extract.',
      value: '500/mo',
      status: 'active' as const,
    },
    {
      productId: bySlug['vercel'],
      type: 'free_tier' as const,
      headline: 'Hobby plan — unlimited projects',
      description: '100 GB bandwidth, edge functions, ISR.',
      value: 'Free',
      status: 'active' as const,
    },
    {
      productId: bySlug['supabase'],
      type: 'free_tier' as const,
      headline: 'Free project — 500 MB DB + 1 GB storage',
      description: 'Auth, Postgres, Storage included.',
      value: 'Free',
      status: 'active' as const,
    },
    {
      productId: bySlug['nvidia-nim'],
      type: 'free_tier' as const,
      headline: '1000 free inference requests',
      description: 'Build account, no credit card.',
      value: '1000 req',
      status: 'active' as const,
    },
  ];

  // Skip if any active offers already exist (idempotency by simple count)
  const existing = await db.execute(sql`select count(*)::int as c from offers`);
  const count = (existing as unknown as { rows: { c: number }[] }).rows?.[0]?.c ?? 0;
  if (count === 0) {
    const validOffers = OFFERS_SEED.filter(
      (o): o is typeof o & { productId: number } => typeof o.productId === 'number'
    );
    await db.insert(offers).values(validOffers);
    console.log(`  ✓ ${validOffers.length} offers`);
  } else {
    console.log(`  → skipped (${count} offers already exist)`);
  }

  console.log('🌱 Seeding feature flags...');
  for (const f of FLAGS_SEED) {
    await db.insert(featureFlags).values(f).onConflictDoNothing({ target: featureFlags.key });
  }
  console.log(`  ✓ ${FLAGS_SEED.length} flags`);

  console.log('✅ Seed complete.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  });
