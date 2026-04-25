# FreeTierHunt 🏹

Aggregator for AI tool free tiers, trials, and verified promo codes.

> **Status:** Bootstrapped — Hafta 1 setup phase. See [`# 📄 DOSYA 2 ...md`](./%23%20%F0%9F%93%84%20DOSYA%202%20%60freetierhunt-v3-part2-execution.md) for the 13-week execution plan.

## Stack

- **Framework**: Next.js 15 (App Router) + React 19 + TypeScript (strict)
- **Styling**: Tailwind CSS (brutal design system)
- **DB**: Supabase Postgres + Drizzle ORM
- **Auth**: Supabase Auth (email magic link)
- **Queue**: BullMQ + Redis (Oracle Always Free VM)
- **Worker**: Node.js + PM2 (Oracle ARM A1)
- **LLM Router**: Groq → OpenRouter → NVIDIA NIM → OpenAI fallback
- **Email**: Resend
- **Hosting**: Vercel (web) + Oracle VM (worker) + Cloudflare (DNS/CDN)
- **Monitoring**: Sentry + PostHog + Discord webhooks

## Local Setup (5 min)

### Prerequisites
- Node.js 20+ ✓ (you have 24)
- pnpm 9+ → `npm install -g pnpm`
- Postgres client (TablePlus / pgAdmin) — optional

### Steps

```bash
# 1. Install deps
pnpm install

# 2. Environment
cp .env.example .env.local
# Fill values from password vault ('FreeTierHunt' folder)

# 3. Database (after schema is written in Hafta 2)
pnpm db:push
pnpm db:seed

# 4. Run dev
pnpm dev                # web → http://localhost:3000
pnpm worker:dev         # worker (separate terminal)
```

### Common Issues

| Problem | Fix |
|---------|-----|
| `pnpm db:push` fails | Use `DIRECT_URL` (port 5432), not pooler 6543 |
| Sentry init error | `NEXT_PUBLIC_SENTRY_DSN` must be set client-side |
| Worker Redis fail | `redis-cli ping` must return PONG |
| Vercel build "Cannot resolve module" | Confirm `pnpm-lock.yaml` is committed |

## Project Structure

```
src/
  app/                  Next.js App Router (pages + API routes)
    api/health/         Uptime probe (k6 + Vercel monitoring)
  lib/
    db/                 Drizzle schema + queries
    logger.ts           Pino structured logger
  middleware.ts         CSP + security headers (audit B20)
  instrumentation.ts    Sentry hook (audit B6)
worker/
  index.ts              BullMQ worker entry (TZ=UTC enforced — audit B1)
.github/
  dependabot.yml        Weekly dep updates (audit B31)
  workflows/ci.yml      Lint · typecheck · build
docs/                   Operator notes
ecosystem.config.cjs    PM2 production (instances:1 fork — audit B3)
drizzle.config.ts       Migration config (uses DIRECT_URL)
```

## Plan References

- **`# 📄 DOSYA 1 ...md`** — Strategy & vision (53 KB)
- **`# 📄 DOSYA 2 ...md`** — Execution playbook, 13 weeks + appendices (155 KB)
- **`docs/free-tier-verification.md`** — Operator note for offer verification

## Scripts

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Next.js dev server |
| `pnpm build` | Production build |
| `pnpm typecheck` | tsc --noEmit |
| `pnpm lint` | ESLint |
| `pnpm format` | Prettier write |
| `pnpm db:push` | Push schema (dev) |
| `pnpm db:generate` | Generate migration SQL |
| `pnpm db:studio` | Drizzle Studio |
| `pnpm worker:dev` | tsx watch worker |
| `pnpm worker:start` | PM2 production worker |

## License

MIT (TBD)
