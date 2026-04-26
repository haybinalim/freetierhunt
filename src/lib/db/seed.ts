/**
 * Seed data for development.
 * Run: pnpm db:seed
 *
 * Idempotent: products keyed by slug, flags by key, offers skipped if any rows exist.
 */
import { db } from './client';
import { products, offers, featureFlags } from './schema';
import { sql } from 'drizzle-orm';

const PRODUCTS_SEED = [
  // ── LLMs ──
  {
    name: 'OpenAI',
    slug: 'openai',
    description: 'Leading AI research lab — GPT-4o, o1, embeddings, DALL-E.',
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
    name: 'Mistral AI',
    slug: 'mistral',
    description: 'Open & commercial models — Mistral Large, Codestral, Mixtral.',
    website: 'https://mistral.ai',
    category: 'LLM',
    logoUrl: 'https://mistral.ai/favicon.ico',
    tags: ['llm', 'open-source', 'european'],
  },
  {
    name: 'Cohere',
    slug: 'cohere',
    description: 'Enterprise LLMs — Command R+, embeddings, Rerank.',
    website: 'https://cohere.com',
    category: 'LLM',
    logoUrl: 'https://cohere.com/favicon.ico',
    tags: ['llm', 'enterprise', 'rerank'],
  },
  {
    name: 'Perplexity',
    slug: 'perplexity',
    description: 'Answer engine — citation-backed AI search with Pro plan.',
    website: 'https://perplexity.ai',
    category: 'AI Search',
    logoUrl: 'https://perplexity.ai/favicon.ico',
    tags: ['search', 'rag', 'consumer'],
  },

  // ── Inference platforms ──
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
    name: 'Together AI',
    slug: 'together-ai',
    description: 'Inference + fine-tuning for 100+ open-source models.',
    website: 'https://together.ai',
    category: 'Inference',
    logoUrl: 'https://together.ai/favicon.ico',
    tags: ['inference', 'open-source', 'fine-tune'],
  },
  {
    name: 'Replicate',
    slug: 'replicate',
    description: 'Run open-source models with one line — Llama, FLUX, Whisper.',
    website: 'https://replicate.com',
    category: 'Inference',
    logoUrl: 'https://replicate.com/favicon.ico',
    tags: ['inference', 'open-source', 'image'],
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
  {
    name: 'Hugging Face',
    slug: 'huggingface',
    description: 'Models, datasets, Spaces — the GitHub of ML.',
    website: 'https://huggingface.co',
    category: 'Inference',
    logoUrl: 'https://huggingface.co/favicon.ico',
    tags: ['models', 'datasets', 'community'],
  },

  // ── AI Coding ──
  {
    name: 'Cursor',
    slug: 'cursor',
    description: 'AI-first code editor — autocomplete, chat, agents in your IDE.',
    website: 'https://cursor.com',
    category: 'AI Coding',
    logoUrl: 'https://cursor.com/favicon.ico',
    tags: ['ide', 'coding', 'autocomplete'],
  },
  {
    name: 'GitHub Copilot',
    slug: 'github-copilot',
    description: 'AI pair programmer in your IDE — chat, autocomplete, code review.',
    website: 'https://github.com/features/copilot',
    category: 'AI Coding',
    logoUrl: 'https://github.com/favicon.ico',
    tags: ['ide', 'coding', 'autocomplete'],
  },
  {
    name: 'v0 by Vercel',
    slug: 'v0',
    description: 'Generative UI — describe a component, get React + Tailwind.',
    website: 'https://v0.dev',
    category: 'AI Coding',
    logoUrl: 'https://v0.dev/favicon.ico',
    tags: ['ui', 'generative', 'react'],
  },
  {
    name: 'Bolt.new',
    slug: 'bolt-new',
    description: 'Prompt-to-app — full-stack web apps from a single description.',
    website: 'https://bolt.new',
    category: 'AI Coding',
    logoUrl: 'https://bolt.new/favicon.ico',
    tags: ['app-builder', 'fullstack'],
  },
  {
    name: 'Lovable',
    slug: 'lovable',
    description: 'Build apps by chatting — design, code, deploy in one flow.',
    website: 'https://lovable.dev',
    category: 'AI Coding',
    logoUrl: 'https://lovable.dev/favicon.ico',
    tags: ['app-builder', 'low-code'],
  },

  // ── Data / Scraping ──
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
    name: 'Tavily',
    slug: 'tavily',
    description: 'Search API for LLM agents — real-time web grounding.',
    website: 'https://tavily.com',
    category: 'Data',
    logoUrl: 'https://tavily.com/favicon.ico',
    tags: ['search', 'agents', 'rag'],
  },

  // ── Infra ──
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
];

const FLAGS_SEED = [
  { key: 'submissions_enabled', enabled: true, description: 'Allow user submissions' },
  { key: 'voting_enabled', enabled: true, description: 'Allow anonymous voting' },
  { key: 'digest_enabled', enabled: false, description: 'Weekly email digest' },
  { key: 'extraction_enabled', enabled: false, description: 'Background LLM extraction' },
];

/** Helper: ms offset from now */
const days = (n: number) => new Date(Date.now() + n * 86_400_000);

/**
 * Offer fixtures keyed by product slug. Multiple offers per product allowed.
 * Mix of types, codes, expiries, scores to simulate a realistic feed.
 */
type SeedOffer = {
  slug: string;
  type: 'free_tier' | 'trial' | 'credit' | 'discount';
  status?: 'active' | 'expired' | 'disabled';
  headline: string;
  description?: string;
  value?: string;
  code?: string;
  expiresAt?: Date;
  score?: number;
  viewsCount?: number;
  terms?: string;
};

const OFFERS_SEED: SeedOffer[] = [
  // OpenAI
  {
    slug: 'openai',
    type: 'credit',
    headline: '$5 free credit on signup (new accounts)',
    description: 'API trial credit, expires in 3 months from grant.',
    value: '$5',
    expiresAt: days(90),
    score: 88,
    viewsCount: 12_400,
  },
  {
    slug: 'openai',
    type: 'free_tier',
    headline: 'ChatGPT Free — GPT-4o mini, web search, image gen',
    description: 'Free tier covers most everyday use. No card required.',
    value: 'Free',
    score: 95,
    viewsCount: 28_900,
  },

  // Anthropic
  {
    slug: 'anthropic',
    type: 'credit',
    headline: '$5 free credit for new Console accounts',
    description: 'API signup bonus.',
    value: '$5',
    score: 80,
    viewsCount: 9_800,
  },
  {
    slug: 'anthropic',
    type: 'free_tier',
    headline: 'Claude Free — Claude Sonnet 4 with daily message cap',
    description: 'Free web app access. Plus tier for higher limits.',
    value: 'Free',
    score: 92,
    viewsCount: 21_300,
  },

  // Mistral
  {
    slug: 'mistral',
    type: 'free_tier',
    headline: 'La Plateforme — free tier with rate limits',
    description: '1 req/sec, 500K tokens/min. No credit card needed.',
    value: 'Free',
    score: 71,
    viewsCount: 4_200,
  },

  // Cohere
  {
    slug: 'cohere',
    type: 'trial',
    headline: 'Free trial keys — rate-limited, non-commercial',
    description: 'Embed, Rerank, Command R available without payment.',
    value: 'Free',
    score: 64,
    viewsCount: 2_800,
  },

  // Perplexity
  {
    slug: 'perplexity',
    type: 'discount',
    headline: 'Pro 1 year free for students',
    description: 'Verify with .edu email at perplexity.ai/students.',
    value: '$200/yr',
    score: 90,
    viewsCount: 15_600,
  },
  {
    slug: 'perplexity',
    type: 'free_tier',
    headline: 'Perplexity Free — unlimited quick searches',
    description: '5 Pro searches/day on free plan.',
    value: 'Free',
    score: 70,
    viewsCount: 6_100,
  },

  // Groq
  {
    slug: 'groq',
    type: 'free_tier',
    headline: 'Free Llama 3.3 70B & Mixtral inference',
    description: 'Generous free tier with rate limits, 6K req/day.',
    value: 'Free',
    score: 93,
    viewsCount: 18_700,
  },

  // OpenRouter
  {
    slug: 'openrouter',
    type: 'free_tier',
    headline: ':free model variants — no payment required',
    description: 'Llama, Gemma, DeepSeek, Mistral free endpoints.',
    value: 'Free',
    score: 86,
    viewsCount: 11_400,
  },
  {
    slug: 'openrouter',
    type: 'credit',
    headline: '$1 free credit for trying paid models',
    description: 'Auto-applied on first $10 top-up.',
    value: '$1',
    score: 55,
    viewsCount: 1_900,
  },

  // Together AI
  {
    slug: 'together-ai',
    type: 'credit',
    headline: '$25 free credit on signup',
    description: 'Use across 100+ open-source models.',
    value: '$25',
    code: 'WELCOME25',
    score: 84,
    viewsCount: 8_300,
  },

  // Replicate
  {
    slug: 'replicate',
    type: 'free_tier',
    headline: 'Free tier — pay only for what you use',
    description: 'Public models free for testing; pay per second after.',
    value: 'Free',
    score: 68,
    viewsCount: 3_700,
  },

  // NVIDIA NIM
  {
    slug: 'nvidia-nim',
    type: 'free_tier',
    headline: '1000 free inference requests',
    description: 'Build account, no credit card. Llama 3.1, Mixtral.',
    value: '1000 req',
    score: 72,
    viewsCount: 5_400,
  },

  // Hugging Face
  {
    slug: 'huggingface',
    type: 'free_tier',
    headline: 'Free Inference API — 30K req/month',
    description: 'Hosted inference for thousands of models.',
    value: '30K/mo',
    score: 78,
    viewsCount: 7_200,
  },
  {
    slug: 'huggingface',
    type: 'discount',
    headline: 'Pro plan 50% off first month',
    description: 'Higher rate limits and ZeroGPU access.',
    value: '50% off',
    code: 'HFPRO50',
    expiresAt: days(30),
    score: 60,
    viewsCount: 2_100,
  },

  // Cursor
  {
    slug: 'cursor',
    type: 'trial',
    headline: 'Cursor Pro — 14 day free trial',
    description: '500 fast premium completions/month after trial.',
    value: '14 days',
    score: 96,
    viewsCount: 32_500,
  },
  {
    slug: 'cursor',
    type: 'free_tier',
    headline: 'Hobby plan — free forever',
    description: '50 slow premium requests/month.',
    value: 'Free',
    score: 82,
    viewsCount: 14_900,
  },

  // GitHub Copilot
  {
    slug: 'github-copilot',
    type: 'free_tier',
    headline: 'Free for verified students & open-source maintainers',
    description: 'Apply via GitHub Education or maintainer status.',
    value: 'Free',
    score: 91,
    viewsCount: 19_800,
  },
  {
    slug: 'github-copilot',
    type: 'trial',
    headline: '30-day free trial for all developers',
    description: 'Full Copilot Individual access for 30 days.',
    value: '30 days',
    score: 74,
    viewsCount: 6_700,
  },

  // v0
  {
    slug: 'v0',
    type: 'free_tier',
    headline: 'v0 Free — daily generation credits',
    description: 'Free tier with daily limit. Premium for more.',
    value: 'Free',
    score: 81,
    viewsCount: 10_600,
  },

  // Bolt
  {
    slug: 'bolt-new',
    type: 'free_tier',
    headline: 'Free daily token allowance',
    description: 'Build small apps without payment.',
    value: 'Free',
    score: 76,
    viewsCount: 8_900,
  },

  // Lovable
  {
    slug: 'lovable',
    type: 'free_tier',
    headline: '5 free messages per day',
    description: 'No card required, kicks the tires on any idea.',
    value: '5/day',
    score: 67,
    viewsCount: 4_500,
  },

  // Firecrawl
  {
    slug: 'firecrawl',
    type: 'free_tier',
    headline: '500 credits/month free tier',
    description: 'Scrape, crawl, extract — perfect for prototypes.',
    value: '500/mo',
    score: 89,
    viewsCount: 13_700,
  },
  {
    slug: 'firecrawl',
    type: 'discount',
    headline: '20% off first paid month',
    description: 'Hobby → Standard transition.',
    value: '20% off',
    code: 'FCSTART20',
    expiresAt: days(60),
    score: 50,
    viewsCount: 1_400,
  },

  // Tavily
  {
    slug: 'tavily',
    type: 'free_tier',
    headline: '1000 free API calls/month',
    description: 'Built specifically for AI agent web search.',
    value: '1000/mo',
    score: 73,
    viewsCount: 5_100,
  },

  // Vercel
  {
    slug: 'vercel',
    type: 'free_tier',
    headline: 'Hobby plan — unlimited projects',
    description: '100 GB bandwidth, edge functions, ISR included.',
    value: 'Free',
    score: 94,
    viewsCount: 24_300,
  },

  // Supabase
  {
    slug: 'supabase',
    type: 'free_tier',
    headline: 'Free project — 500 MB DB + 1 GB storage',
    description: 'Auth, Postgres, Storage, Realtime, Edge Functions.',
    value: 'Free',
    score: 92,
    viewsCount: 22_800,
  },
  {
    slug: 'supabase',
    type: 'credit',
    headline: 'Pro plan — $25/mo with $10 compute credits',
    description: 'Daily backups, branching, 8 GB DB.',
    value: '$10 incl.',
    score: 58,
    viewsCount: 3_300,
  },
];

async function main() {
  console.log('🌱 Seeding products...');
  for (const p of PRODUCTS_SEED) {
    await db.insert(products).values(p).onConflictDoNothing({ target: products.slug });
  }
  console.log(`  ✓ ${PRODUCTS_SEED.length} products`);

  console.log('🌱 Seeding sample offers...');
  const rows = await db.select({ id: products.id, slug: products.slug }).from(products);
  const bySlug = Object.fromEntries(rows.map((r) => [r.slug, r.id]));

  // Skip if any offers already exist (idempotency)
  const existing = await db.execute(sql`select count(*)::int as c from offers`);
  const count = (existing as unknown as { rows: { c: number }[] }).rows?.[0]?.c ?? 0;
  if (count === 0) {
    const rowsToInsert = OFFERS_SEED.flatMap((o) => {
      const productId = bySlug[o.slug];
      if (typeof productId !== 'number') return [];
      return [
        {
          productId,
          type: o.type,
          status: o.status ?? ('active' as const),
          headline: o.headline,
          description: o.description ?? null,
          terms: o.terms ?? null,
          value: o.value ?? null,
          code: o.code ?? null,
          expiresAt: o.expiresAt ?? null,
          score: o.score ?? 0,
          viewsCount: o.viewsCount ?? 0,
        },
      ];
    });
    await db.insert(offers).values(rowsToInsert);
    console.log(`  ✓ ${rowsToInsert.length} offers`);
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
