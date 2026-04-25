# Secrets & Environment Management

> Operator runbook — keep this in sync with `.env.example` and `src/lib/env.ts`.  
> Never paste real values into any committed file.

## Source of Truth

1. **Password vault** (1Password / Bitwarden) → folder `FreeTierHunt`
2. **`.env.example`** → variable inventory + format hints (committed)
3. **`src/lib/env.ts`** → Zod validation schema (typed runtime access)
4. **`.env.local`** → developer machine values (gitignored)
5. **Vercel project settings** → production + preview values
6. **Oracle VM `~/freetierhunt/.env`** → worker values (`chmod 600`)

If you see a secret elsewhere (a Slack message, a code comment, a screenshot), treat it as compromised and rotate.

## Acquisition Checklist (one-time, Hafta 0)

| Variable | Provider | Where to get | Notes |
|----------|----------|-------------|-------|
| `DATABASE_URL` | Supabase | Project Settings → Database → Connection string (pooler 6543) | `?pgbouncer=true` required |
| `DIRECT_URL` | Supabase | Same page, port 5432 | Migrations only |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase | Project Settings → API | Public, safe to expose |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase | Project Settings → API → anon key | Public, RLS protected |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase | Project Settings → API → service_role | **NEVER** expose; worker only |
| `REDIS_URL` | Oracle VM | Set during VM provision | `redis://default:PASS@vm:6379` |
| `GROQ_API_KEY` | Groq | console.groq.com → API Keys | Free tier 14k req/day |
| `OPENROUTER_API_KEY` | OpenRouter | openrouter.ai/keys | Pay-as-you-go fallback |
| `OPENAI_API_KEY` | OpenAI | platform.openai.com → API keys | Hard budget limit set! |
| `NVIDIA_NIM_API_KEY` | NVIDIA | build.nvidia.com → Get API Key | Free credits |
| `PH_API_KEY` + `PH_API_SECRET` | Product Hunt | producthunt.com/v2/oauth/applications → Create app | OAuth flow |
| `FIRECRAWL_API_KEY` | Firecrawl | firecrawl.dev/app/api-keys | Free tier 500 credits |
| `RESEND_API_KEY` | Resend | resend.com/api-keys | After domain verify |
| `RESEND_WEBHOOK_SECRET` | Resend | Webhook config (Svix signing key) | Hafta 8 |
| `SENTRY_DSN` + `NEXT_PUBLIC_SENTRY_DSN` | Sentry | Wizard auto-fills (Hafta 1 Cuma) | Same value |
| `SENTRY_AUTH_TOKEN` | Sentry | Settings → Auth Tokens (project:write) | Source map upload |
| `DISCORD_WEBHOOK_URL` | Discord | Server settings → Integrations → Webhooks | Alerts channel |
| `REVALIDATE_SECRET` | Self-generated | `openssl rand -hex 32` | ISR revalidation |

## Per-Environment Setup

### Local development
```bash
cp .env.example .env.local
# Fill values from password vault
pnpm run dev
# env.ts will validate at boot — boot fails loudly if anything is malformed
```

### Vercel (web app)
```
Vercel Dashboard → freetierhunt → Settings → Environment Variables

Add each var with appropriate scope:
  □ Production
  □ Preview
  □ Development (optional, mirrors .env.local)

Notes:
- All values are encrypted at rest.
- NEVER toggle "Sensitive" off for service role / API keys.
- After adding/changing vars: trigger redeploy (push or "Redeploy" button).
```

### Oracle VM (worker)
```bash
ssh ubuntu@your-oracle-vm
cd ~/freetierhunt
nano .env                  # paste values
chmod 600 .env             # 🔴 worker-only readability
pm2 restart freetierhunt-worker
pm2 logs --lines 50        # verify no env errors
```

## Validation

`src/lib/env.ts` runs Zod validation at module import time. Any malformed or missing required var crashes the process with a clear error listing affected fields. Don't bypass this with `process.env.X` — always go through `env.X`.

```typescript
// ✅ Good
import { env } from '@/lib/env';
const db = postgres(env.DATABASE_URL);

// ❌ Bad
const db = postgres(process.env.DATABASE_URL!);
```

## Rotation Schedule

| Cadence | Vars |
|---------|------|
| Quarterly | `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `RESEND_API_KEY`, `FIRECRAWL_API_KEY` |
| Annually | `PH_API_SECRET`, `SENTRY_AUTH_TOKEN` |
| On compromise | All of the above + `REVALIDATE_SECRET`, `RESEND_WEBHOOK_SECRET` |
| Never (rotate provider key only) | `DATABASE_URL` (rotate Supabase password instead) |

### Rotation procedure (no downtime)

1. Generate new value at provider dashboard.
2. Add to Vercel **Preview** scope first → trigger preview deploy → smoke test.
3. Promote: paste into Vercel **Production** → click "Redeploy" on latest production deployment.
4. Update Oracle VM `.env` (only if worker uses this key) → `pm2 restart`.
5. Revoke old value at provider.
6. Update password vault entry with timestamp + reason.

## Pre-Commit Safety

Husky pre-commit hook runs `lint-staged`. To prevent accidental secret commits:

- `.env`, `.env.local`, `.env.*.local` are in `.gitignore`
- `git log -p | grep -iE 'api[_-]?key|secret|sk-|gsk_'` periodically
- Hafta 13+: add `gitleaks` to CI (`@c:\Users\Alim\Documents\freetierhunt\.github\workflows\ci.yml:1`)

## If You Accidentally Commit a Secret

1. **Don't push.** If pushed, treat the secret as compromised.
2. Rotate the secret at the provider immediately.
3. Update `.env.local` + Vercel + Oracle VM with new value.
4. Remove the secret from git history:
   ```bash
   # Easy if just last commit:
   git reset --soft HEAD~1
   git restore --staged <file>
   # Edit file, remove secret
   git commit -m "fix: remove accidentally committed secret"
   ```
   For older commits, use `git filter-repo` (preferred over BFG).
5. Force-push (only if you're the sole contributor): `git push --force-with-lease`.

## Disaster Recovery

See Ek F in `# 📄 DOSYA 2 ...md` for full DR runbook (database loss, worker crash, build failure scenarios).

The `env.ts` schema makes recovery deterministic: as long as the vault is intact, a fresh deploy is `cp .env.example .env.local` + paste + boot.
