# 📗 PARÇA 2: 12 HAFTALIK EXECUTION PLAN

## FreeTierHunt — Uygulama Rehberi

> **Hafta Hafta Aksiyon Planı, Windsurf Prompt'ları, Kod Örnekleri**
>
> **Format:** Her hafta için hedefler + günlük breakdown + hazır prompt'lar + kontrol listesi
>
> **Varsayım:** Sen haftada 21 saat (3 saat/gün) çalışacaksın
>
> **Motto:** *"Ship small, ship often, ship ugly."*

---

## 🚨 GÜNCELLEMELER VE KRİTİK EKSİKLİKLER (MUTLAKA OKU!)

Bu bölüm, planın incelenmesi sırasında tespit edilen **kritik eksikliklerin** çözümlerini içerir. Bu adımlar atlanırsa sistem çöker.

### ⚠️ P0 (Kritik) Eksiklikler ve Çözümleri

#### 1. Free Tier Doğrulama Zorunluluğu
**Sorun:** Plan boyunca "free" iddia edilen servisler (Groq, Oracle, Vercel, vb.) doğrulanmadan kullanılıyor. Biri çökerse $0 maliyet hesabı bozulur.

**Çözüm:** Hafta 0'da tüm servisler için `docs/free-tier-verification.md` oluştur:
```markdown
| Servis | Test Tarihi | Durum | Fallback |
|--------|-------------|-------|----------|
| Groq (30 req/dk) | 2026-04-25 | ✅ Working | OpenRouter → GPT |
| Oracle Always Free | 2026-04-25 | ✅ Working | Railway ($5/ay) |
| Vercel (100GB) | 2026-04-25 | ✅ Working | Cloudflare Pages |
| Supabase (60 conn) | 2026-04-25 | ⚠️ Pooler kullan | Railway Postgres |
```

#### 2. Supabase Connection Pooling (Sessiz Katil)
**Sorun:** Supabase free tier = **60 max connection**. Next.js serverless her cold start'ta yeni connection açar → site çöker.

**Çözüm:** Hafta 1'de DATABASE_URL formatı (port **6543**):
```bash
# Doğru (Pooler):
DATABASE_URL=postgresql://postgres:[pass]@aws-0-[region].pooler.supabase.com:6543/postgres

# Yanlış (Direct - 60 limit):
DATABASE_URL=postgresql://postgres:[pass]@aws-0-[region].pooler.supabase.com:5432/postgres
```

#### 3. Vercel Serverless Timeout (10 sn)
**Sorun:** Vercel free tier timeout = 10 sn. LLM + Firecrawl çağrısı 4-11 sn sürebilir → timeout.

**Çözüm:** Hafta 3'te API route'tan asla LLM/Firecrawl çağırma. Tüm ajan işlemleri **Oracle Worker'da** çalışsın:
- API route sadece BullMQ'ya job ekler
- Worker işler → DB'ye yazılır
- Client poll eder veya webhook alır

#### 4. Playwright ARM Uyumsuzluğu
**Sorun:** Oracle VM = **ARM (Ampere A1)**. Playwright'ın Chromium binary'si ARM Linux'ta desteklenmez.

**Çözüm:** Hafta 3'te Playwright yerine:
- **Firecrawl** kullan (JS render zaten yapıyor)
- Veya `puppeteer-core` + system Chromium
- Veya `got` + `cheerio` (lightweight)

#### 5. Stale Job Recovery
**Sorun:** Worker crash olursa, `extraction_queue`'da `status='processing'` olan item'lar sonsuza kadar orada kalır.

**Çözüm:** Hafta 3'te BullMQ config:
```typescript
const extractionQueue = new Queue('extraction', {
  defaultJobOptions: {
    stalledInterval: 30000,      // 30 saniyede bir kontrol
    maxStalledCount: 2,          // 2 deneme sonra failed
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 }
  }
});

// Veya 30 dakikada bir recovery cron:
setInterval(recoverStaleJobs, 30 * 60 * 1000);
```

#### 6. Offer Deduplication
**Sorun:** Aynı promo kodu PH comment'ten, IH post'tan, manual submission'dan 3 kez görünür.

**Çözüm:** Hafta 2'de schema'ya unique constraint:
```sql
-- Case-insensitive deduplication (NULL handling ile)
CREATE UNIQUE INDEX offers_dedup_idx 
ON offers (
  product_id, 
  type, 
  COALESCE(UPPER(code), ''), 
  COALESCE(discount_pct, 0), 
  COALESCE(trial_days, 0)
);

-- Upsert mantığı:
INSERT INTO offers (...) VALUES (...)
ON CONFLICT (product_id, type, COALESCE(UPPER(code), ''), COALESCE(discount_pct, 0), COALESCE(trial_days, 0))
DO UPDATE SET 
  trust_score = GREATEST(offers.trust_score, EXCLUDED.trust_score),
  updated_at = NOW();
```

#### 7. Mimari Basitleştirme
**Sorun:** Turborepo monorepo + 5 package + 2 app MVP için ağır. Debug zorluğu.

**Öneri:** Hafta 1'de başlangıç yapısı:
```
freetierhunt/              # TEK repo (monorepo DEĞİL)
├── src/
│   ├── app/               # Next.js 15 App Router
│   ├── lib/
│   │   ├── db/            # Drizzle schema
│   │   ├── llm/           # Router
│   │   └── scrapers/      # PH + IH
│   └── components/
├── worker/                # Ayrı process (PM2)
│   └── jobs/
└── package.json
```
Turborepo'ya V2'de geç (5K+ satır sonrası).

#### 8. OpenClaw Opsiyonel
**Sorun:** Plan 4 ajana OpenClaw'a bağlı. Down olursa extraction durur.

**Çözüm:** OpenClaw'ı **"nice to have"** yap. Doğrudan LLM router primary extraction. OpenClaw = V2 feature.

#### 9. Trust Score Chicken-and-Egg
**Sorun:** Yeni offer'lar trust_score = 0.5 ile başlar. Kullanıcılar düşük trust'lı offer'ları skip eder → hiç vote'lanmaz.

**Çözüm:** Hafta 6'da "Freshness Bonus":
```typescript
function calculateTrustScore(offer) {
  const base = bayesianTrust(offer);
  const freshness = offer.age < 24h ? 0.15 : offer.age < 72h ? 0.08 : 0;
  return Math.min(1, base + freshness);
}
```

#### 10. GDPR Cookie Consent
**Sorun:** Plan "Cookie consent"i Hafta 10'a bırakıyor. EU'dan tek visitor = GDPR ihlali.

**Çözüm:** Hafta 1 Pazar günü basit banner:
```tsx
// app/layout.tsx'e ekle
<CookieConsent 
  onAccept={() => initAnalytics()}
  onDecline={() => {}} // Analytics yüklenmez
/>
```

### 📋 Düzeltilmiş Timeline (Gerçekçi)

| Hafta | İçerik | Tahmini |
|-------|--------|---------|
| 0 | Hesaplar + **Free tier doğrulama** + **PH API başvurusu** | 8 saat |
| 1 | **Basit repo** + Next.js + **Pooler config** + **GDPR banner** | 21 saat |
| 2 | DB + **Deduplication** + **RLS** + API | 21 saat |
| 3 | **PH API bekleme/alternatif** + **Worker** + **Stale recovery** | 21 saat |
| 4 | LLM extraction (prompt iterasyonu) — **Hedef: F1 0.70** | 21 saat |
| 5 | Frontend: landing + product page + **Supabase search** | 21 saat |
| 6 | **Trust voting** + UI polish (Meilisearch **V2'ye ertelendi**) | 21 saat |
| 7 | IH + enrichment + **LLM F1 0.85'e iterasyon** | 21 saat |
| 8 | Auth + dashboard + email | 21 saat |
| 9 | Submission + validator | 21 saat |
| 10 | Polish + legal + **Beta launch** | 21 saat |
| 11 | Content + SEO + Reddit | 21 saat |
| 12 | Launch prep + PH launch | 21 saat |

**Toplam: 12 haftalar** (önceki plan da 12 haftaydı ama bu daha gerçekçi ve riskler giderilmiş)

---

## 📋 İçindekiler

1. [Önsöz: Bu Rehberi Nasıl Kullanmalısın](#önsöz)
2. [Hazırlık (Hafta 0)](#hafta-0-hazırlık)
3. [Hafta 1: Foundation & Setup](#hafta-1-foundation--setup)
4. [Hafta 2: Database & Data Layer](#hafta-2-database--data-layer)
5. [Hafta 3: Product Hunt Integration](#hafta-3-product-hunt-integration)
6. [Hafta 4: LLM Extraction Pipeline](#hafta-4-llm-extraction-pipeline)
7. [Hafta 5: Frontend Scaffold](#hafta-5-frontend-scaffold)
8. [Hafta 6: Core UI & Search](#hafta-6-core-ui--search-i̇yileştirmeleri)
9. [Hafta 7: Indie Hackers + Enrichment](#hafta-7-indie-hackers--enrichment)
10. [Hafta 8: Auth & User Dashboard](#hafta-8-auth--user-dashboard)
11. [Hafta 9: Submission System + Validator Agent](#hafta-9-submission-system--validator-agent)
12. [Hafta 10: Polish & Soft Launch](#hafta-10-polish--soft-launch)
13. [Hafta 11: Content & SEO](#hafta-11-content--seo)
14. [Hafta 12: Public Launch](#hafta-12-public-launch)
15. [Ekler: Prompt Kütüphanesi, Kod Örnekleri, Troubleshooting](#ekler)

---

## Önsöz

### Bu Rehberi Nasıl Kullanmalısın

#### 🎯 Altın Kurallar

1. **Her hafta sadece 1 hedef.** 5 feature aynı anda yapma — 1 feature tamamla, sonra diğerine geç.
2. **Windsurf prompt'larını olduğu gibi kullan.** Sonra kendine göre uyarla. Vibe coding'in sırrı: iyi prompt'lar.
3. **Test etmeden bir sonraki haftaya geçme.** "Çalışıyor" dediğin şey gerçekten çalışıyor mu?
4. **Pazar günü = review günü.** Kodu yazma, sadece sonraki haftayı planla.
5. **Haftada 1 kez 15 dakika ajanını güncelle.** OpenClaw'a yeni görev ver, prompt iyileştir.
6. **Takıldığında 30 dk limit.** Çözemiyorsan: Windsurf/Cursor'a "Bu hatayı nasıl çözerim?" diye sor. Çözemezse GitHub Issue aç ve bir sonraki task'a geç.
7. **Perfect ≠ Shipped.** Ugly but working > beautiful but broken.

### Günlük Rutin Önerisi

```
09:00-10:00 (1 saat) — DEEP WORK
  ↳ En zor task: kod yazma, architecture düşünme

10:00-10:15 — MOLA ☕

10:15-11:15 (1 saat) — EXECUTION
  ↳ Orta zorluk: UI, styling, bug fix

11:15-11:30 — MOLA ☕

11:30-12:00 (30 dk) — ADMIN
  ↳ Kolay: documentation, commits, X post onayı

12:00 — TAMAM
```

**Haftalık dağılım:**
- Pzt-Cum: 3 saat/gün = 15 saat
- Cmt: 4 saat (deep session)
- Paz: 2 saat (review + plan)
- **Toplam: 21 saat**

---

## HAFTA 0: HAZIRLIK

> *(Bu haftayı hafta 1'den ÖNCE, hemen yap — 3-5 saat)*

### 🎯 Hedef

Projeye başlamadan önce hesapları aç, araçları kur, ortamı hazırla.

### ☑️ Checklist

#### Hesap Açma (1 saat)

- [ ] Domain satın al: `freetierhunt.com` (Cloudflare Registrar, ~$10/yıl)
- [ ] Cloudflare'e DNS ekle (zaten hesabın var)
- [ ] GitHub'da org oluştur: `freetierhunt` (private repo için $4/ay veya public kullan)
- [ ] Vercel hesap aç → GitHub ile bağla
- [ ] Supabase hesap aç → yeni proje: `freetierhunt-prod`
- [ ] Resend hesap aç → API key al
- [ ] Groq Cloud hesap aç → API key al
- [ ] OpenRouter hesap aç → API key al
- [ ] **Product Hunt API başvurusu** (KRİTİK - 1-2 hafta onay süresi!)
  - https://api.producthunt.com/v2/oauth/applications
  - **Hemen başvur**, onay gelmeden Hafta 3 bloklanır
  - "Use case" yaz: "Aggregator for AI tool deals and free tiers"
  - Redirect URL: `https://freetierhunt.com/api/auth/callback/ph` (şimdilik placeholder)
  - **Alternatif plan:** Onay gelmezse → Firecrawl scraping veya Uneed.best RSS
- [ ] Brave Search API → free tier signup
- [ ] Tavily API → free tier signup
- [ ] Firecrawl API → free tier signup (PH API fallback)
- [ ] Git yapılandırılmış mı? (`git config --global user.email`)
- [ ] Windsurf kurulu + güncel
- [ ] VS Code'da şu extension'lar: ESLint, Prettier, Tailwind IntelliSense
- [ ] Postgres client (pgAdmin veya TablePlus) — DB inceleme için
- [ ] **Discord server oluştur** (kişisel) → `#freetierhunt-alerts` kanal → webhook URL al (Sentry/UptimeRobot için)
- [ ] **PostHog hesabı aç** → free tier (1M events/ay) → Project API key al
- [ ] **Tally.so hesabı aç** → beta feedback formu için (Hafta 10)

#### Şifre Yönetimi (30 dk)

- [ ] 1Password veya Bitwarden'da "FreeTierHunt" folder oluştur
- [ ] Tüm API key'leri buraya kaydet
- [ ] `.env.example` template hazırla (Hafta 1'de kullanılacak)

#### Oracle VM Hazırlığı (1 saat)

- [ ] Oracle VM'e SSH erişim test et
- [ ] **🔴 KRİTİK: Timezone UTC'ye çek** — PH API "today" UTC midnight'a göre, worker farklı TZ'daysa yanlış güne bakar:
  ```bash
  sudo timedatectl set-timezone UTC
  timedatectl  # Verify: "Time zone: UTC"
  ```
- [ ] Node.js 20 LTS + pnpm kurulu mu kontrol et (`node -v`, `pnpm -v`)
- [ ] **Redis kur ve config'le:**
  ```bash
  sudo apt install -y redis-server
  # /etc/redis/redis.conf düzenle:
  # maxmemory 256mb
  # maxmemory-policy allkeys-lru
  # appendonly yes
  # requirepass <strong-password>
  sudo systemctl restart redis-server
  redis-cli -a <password> ping  # → PONG
  ```
- [ ] Docker kurulu mu kontrol et (Meilisearch için Hafta 6'da)
- [ ] UFW firewall: 22 (SSH) + 80/443 (Cloudflare) — Redis 6379 sadece localhost
- [ ] PM2 kur (`npm i -g pm2`) — worker süreçleri için

#### Proje Klasörü (15 dk)

- [ ] Local'de `~/projects/freetierhunt` oluştur
- [ ] `notes/` klasörü + `ideas.md`, `decisions.md`, `bugs.md` dosyaları
- [ ] `assets/` klasörü logo/design için

#### Topluluk Hazırlığı (30 dk) — Hafta 11 İçin Kritik

- [ ] **Reddit hesabı varsa OK**, yoksa hemen aç (1 ay yaşlanması lazım)
- [ ] r/SideProject, r/IndieHackers, r/cursor takip et
- [ ] Her gün 1-2 quality yorum (karma topla — yeni hesap = shadowban riski)
- [ ] PH "Top Hunters" listesi (https://www.producthunt.com/leaderboard/best-hunters) → 10 kişi seç, takip et

#### Build-in-Public Hazırlık (30 dk)

- [ ] X'te bio güncelle: *"Building FreeTierHunt 🏹 — find free credits for AI tools"*
- [ ] İlk teaser tweet:

> Starting a new side project: an aggregator for AI tool free tiers, trials, and promo codes.
> Will build in public over 12 weeks.
> Follow along. 🏹 #buildinpublic

### 🧠 Windsurf Prompt: Proje Scaffold

*Eğer Windsurf yeniyse, "boş workspace" açık durumda:*

```
Create a single repo (NOT Turborepo/monorepo) with this structure:
- src/app/ (Next.js 15 App Router with TypeScript, Tailwind, shadcn/ui)
- src/lib/db/ (Drizzle ORM setup for Supabase Postgres)
- src/lib/llm/ (LLM router with Groq/OpenRouter/OpenAI providers)
- src/lib/scrapers/ (Per-source scraper adapters)
- src/components/ui/ (shadcn/ui components)
- worker/ (Node.js TypeScript for background jobs - separate folder)

Single package.json, no workspaces.
Add shared tsconfig.json at root. 
Initialize git with .gitignore including node_modules, .env, .turbo.
Add .env.example with placeholders for:
- DATABASE_URL (Supabase)
- GROQ_API_KEY
- OPENROUTER_API_KEY
- OPENAI_API_KEY
- PH_API_KEY
- FIRECRAWL_API_KEY
- RESEND_API_KEY

Add a README.md explaining the project purpose.
```

### 📝 Hafta 0 Sonunda Teslim

- ✅ Domain sahipsin
- ✅ Tüm hesaplar açık
- ✅ Yerel dev ortamı hazır
- ✅ Oracle VM ready
- ✅ İlk teaser tweet atıldı

---

## HAFTA 1: FOUNDATION & SETUP

### 🎯 Ana Hedef

Boş bir Next.js app'i Vercel'e deploy et. `freetierhunt.com` adresinde "Hello World" görünsün.

### 🎨 Küçük Zafer
Hafta sonunda arkadaşına link atabilesin: *"Bak, sitem canlı"* (içi boş olsa da).

### 📅 Günlük Breakdown

#### Pazartesi (3 saat)

**Görev:** Next.js scaffold (Basit Yapı Önerisi)

> **🔴 NOT:** Plan Turborepo monorepo öneriyor ama MVP için ağır. Basit yapı ile başla:

**Basit Yapı (Önerilen):**
```
freetierhunt/
├── src/
│   ├── app/           # Next.js 15 App Router
│   ├── lib/
│   │   ├── db/        # Drizzle schema
│   │   ├── llm/       # Router
│   │   └── scrapers/  # PH + IH
│   └── components/
├── worker/            # Ayrı process (PM2)
│   └── jobs/
└── package.json
```

**🟡 Package manager: pnpm (zorunlu tutarlılık)**

> Plan boyunca `pnpm` kullanacağız. `npm` ile karıştırmamak için **ilk adımda global pnpm kur**:
> ```bash
> npm install -g pnpm
> # Verify
> pnpm -v  # 9.x veya üstü
> ```
> `package-lock.json` ve `pnpm-lock.yaml` aynı repo'da olmamalı. `npm` lock'u oluşursa hemen sil + `pnpm install`.

**Adımlar:**
1. `pnpm dlx create-next-app@latest freetierhunt --typescript --tailwind --eslint --app --src-dir`
2. `cd freetierhunt && pnpm add drizzle-orm postgres zod bullmq ioredis pino p-map date-fns slugify lodash-es`
3. `pnpm add -D @types/lodash-es drizzle-kit husky lint-staged prettier prettier-plugin-tailwindcss`
4. `.env.local` oluştur (Hafta 0'dan key'leri kopyala)
5. **🔴 TypeScript strict mode** (`tsconfig.json`):
   ```json
   {
     "compilerOptions": {
       "strict": true,
       "noImplicitAny": true,
       "strictNullChecks": true,
       "noUncheckedIndexedAccess": true,
       "noImplicitReturns": true,
       "noFallthroughCasesInSwitch": true
     }
   }
   ```
6. **🔴 Pre-commit hooks** (Husky + lint-staged):
   ```bash
   pnpm dlx husky init
   echo "pnpm exec lint-staged" > .husky/pre-commit
   ```
   `package.json`'a ekle:
   ```json
   {
     "lint-staged": {
       "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
       "*.{md,json,css}": "prettier --write"
     }
   }
   ```
7. **🔴 Dependabot** — security patches için (`.github/dependabot.yml`):
   ```yaml
   version: 2
   updates:
     - package-ecosystem: "npm"
       directory: "/"
       schedule:
         interval: "weekly"
       open-pull-requests-limit: 5
       groups:
         dev-deps:
           dependency-type: "development"
   ```
8. Repo'yu GitHub'a push et — `package-lock.json` çıkarsa sil, `pnpm-lock.yaml` commit'le
9. Vercel'e bağla — Settings → Build & Development → Install Command: `pnpm install`

**🔴 KRİTİK:** İki ayrı DATABASE URL gerekli (runtime vs migration):
```bash
# RUNTIME (Pooler - port 6543, transaction mode):
# Next.js serverless ve worker bunu kullanır
DATABASE_URL=postgresql://postgres:[pass]@aws-0-[region].pooler.supabase.com:6543/postgres

# MIGRATION (Direct - port 5432, session mode):
# drizzle-kit push/generate bunu kullanır (Pooler migration desteklemez)
DIRECT_URL=postgresql://postgres:[pass]@aws-0-[region].pooler.supabase.com:5432/postgres
```

**Neden ikisi?**
- Pooler (6543) = transaction mode → her query için yeni session, prepared statement YOK
- Direct (5432) = session mode → DDL operations (CREATE TABLE) için gerekli
- `drizzle-kit` Pooler ile çalışmaz → migration fail olur

**Windsurf prompt'u:**

```
Create Next.js 15 app with:
- TypeScript
- Tailwind CSS
- src/ folder structure
- App Router
- Brutal design (yellow #FFD700, black #000000, 2px borders)

Add to .env.local:
DATABASE_URL=postgresql://...
GROQ_API_KEY=...
OPENROUTER_API_KEY=...

Deploy to Vercel.
```

**Checklist:**
- [ ] Next.js app kuruldu (basit yapı)
- [ ] GitHub'da push edildi
- [ ] Vercel'de başarılı deploy
- [ ] **DATABASE_URL port 6543 (pooler)** doğru ayarlandı
- [ ] Preview URL'sinde "Next.js welcome page" görünüyor

#### Salı (3 saat)

**Görev:** Domain bağla + Temel layout

1. Vercel'de "Add Domain" → `freetierhunt.com`
2. Cloudflare'de DNS ayarları (A record veya CNAME)
3. SSL otomatik gelecek (birkaç dakika)
4. `src/app/layout.tsx` brutal style için temel kurulum

**Windsurf prompt'u:**

```
Update src/app/layout.tsx with a brutal/nomadlist-inspired design:
- Background: #FFD700 (yellow)
- Text color: #000000
- Font: IBM Plex Mono for headings, Inter for body
- Max-width container: 1200px
- Black 2px borders on containers
- Box-shadow: 4px 4px 0px #000000 on cards

Add a simple header with:
- Logo text "FREETIERHUNT 🏹" (large, bold)
- Tagline: "Find free credits, trials, and promo codes for AI tools"
- "This week community saved: \$0" placeholder

Add footer with:
- Copyright notice
- Links: About, Privacy, Terms (just placeholder hrefs)

No gradients, no rounded corners (except max 2px). Brutal style.
```

**Checklist:**
- [ ] `freetierhunt.com` canlı
- [ ] SSL çalışıyor (https://)
- [ ] Sarı + siyah brutal tema görünüyor
- [ ] Header + footer var

#### Çarşamba (3 saat)

**Görev:** Supabase bağlantısı

1. Supabase dashboard'da `freetierhunt-prod` projesi
2. Settings → Database → Connection string al
3. `.env.local`'e ekle: `DATABASE_URL=postgresql://...`
4. Vercel env vars'a da ekle

**Windsurf prompt'u:**

```typescript
In src/lib/db, set up Drizzle ORM with Supabase Postgres:

1. Install: drizzle-orm, drizzle-kit, postgres
2. Create src/lib/db/client.ts (RUNTIME):
   - Use DATABASE_URL (Pooler, port 6543)
   - postgres({ prepare: false }) // Pooler için prepare DISABLE
3. Create src/lib/db/schema.ts (empty for now, will add tables)
4. Create drizzle.config.ts in root (MIGRATION):
   ```typescript
   import { defineConfig } from 'drizzle-kit';
   export default defineConfig({
     schema: './src/lib/db/schema.ts',
     out: './drizzle',
     dialect: 'postgresql',
     dbCredentials: {
       url: process.env.DIRECT_URL!  // Direct URL (port 5432)
     }
   });
   ```
5. Add scripts to package.json:
   - "db:generate": "drizzle-kit generate"
   - "db:push": "drizzle-kit push"
   - "db:studio": "drizzle-kit studio"

Create a simple test file that connects to DB and runs SELECT 1.
```

**🔴 KRİTİK:** `client.ts`'de `prepare: false` zorunlu, çünkü Pooler transaction mode'da prepared statement desteklemez.

**Checklist:**
- [ ] Drizzle setup tamamlandı
- [ ] `pnpm db:studio` açılıyor
- [ ] Test query (`SELECT 1`) çalışıyor

#### Perşembe (3 saat)

**Görev:** Environment variables & secrets

1. Tüm API keys'leri al (Hafta 0'dan)
2. Local `.env.local` dosyasını doldur
3. Vercel env vars'a ekle (production + preview)
4. Oracle VM'de `.env` oluştur (worker için)

**Security checklist:**
- [ ] `.env.local` gitignore'da
- [ ] Hiçbir secret commit'lenmemiş (`git log -p | grep -i key`)
- [ ] Vercel'de secrets "Encrypted" olarak görünüyor
- [ ] Oracle VM'de `.env` permissions: `chmod 600 .env`

#### Cuma (3 saat)

**Görev:** Cloudflare Analytics + Sentry + İlk commit

1. Cloudflare Web Analytics kur (sitede script tag)
2. Sentry hesabı aç, DSN al
3. `@sentry/nextjs` kur + config
4. İlk test error gönder

**Windsurf prompt'u:**

> **🔴 NOT:** `sentry.client.config.ts` / `sentry.server.config.ts` Next.js 15 + Sentry 8+ ile **deprecated**. Yeni API: `instrumentation.ts` + Sentry wizard. Manuel kurulum yapma, wizard kullan.

```bash
# Otomatik kurulum (önerilen)
npx @sentry/wizard@latest -i nextjs

# Wizard şunları otomatik yapar:
#   - @sentry/nextjs install
#   - instrumentation.ts oluşturur (App Router için)
#   - sentry.client.config.ts (client-side için, hâlâ var)
#   - next.config.js'i sarmalar (withSentryConfig)
#   - source map upload yapılandırması
#   - .sentryclirc oluşturur (auth token için)
```

```
Sentry sonrası eklemeler:

1. .env.local + Vercel ENV:
   - NEXT_PUBLIC_SENTRY_DSN=...
   - SENTRY_AUTH_TOKEN=... (source map upload için)
   - SENTRY_ORG=...
   - SENTRY_PROJECT=...

2. instrumentation.ts'de tracing:
   - tracesSampleRate: 0.1 (production), 1.0 (dev)
   - replaysOnErrorSampleRate: 1.0

3. Test endpoint: src/app/api/test-error/route.ts
   export async function GET() {
     throw new Error('Sentry test error');
   }

4. Discord webhook entegrasyonu:
   Sentry → Settings → Integrations → Discord
   - Threshold: yeni issue VEYA 5 events/dk
   - Channel: #freetierhunt-alerts (Hafta 0'da hazırlandı)

5. Worker (Node.js) için ayrı Sentry init:
   worker/lib/sentry.ts:
     import * as Sentry from '@sentry/node';
     Sentry.init({
       dsn: process.env.SENTRY_DSN,
       tracesSampleRate: 0.1,
       environment: 'worker'
     });
   worker/index.ts başında: import './lib/sentry';
```

**Checklist:**
- [ ] Cloudflare Analytics çalışıyor
- [ ] Sentry hata yakalama çalışıyor
- [ ] Test hatası dashboard'da görünüyor

**🟡 EKSTRA: Test + Monitoring + Backup Setup**

```bash
# Test stratejisi
npm install -D vitest @vitejs/plugin-react @testing-library/react playwright

# package.json scripts:
# "test": "vitest"
# "test:e2e": "playwright test"
```

**Kritik test path'leri (öncelikli):**
1. LLM extractor (golden set + F1 score eval)
2. Auth flow (signup → magic link → OTP)
3. Submission validator (3 valid + 2 invalid case)
4. Offer dedup (aynı kod 2 kere eklenmemeli)

**UptimeRobot (5 dk kurulum):**
- https://uptimerobot.com → 50 monitor free
- HTTPS check: `freetierhunt.com` (5 dk interval)
- HTTPS check: `freetierhunt.com/api/health` (1 dk interval)
- Email + Discord webhook alert

**Health endpoint (gerekli):**
```typescript
// app/api/health/route.ts
import { db } from '@/lib/db/client';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    await db.execute(sql`SELECT 1`);
    return Response.json({ status: 'ok', db: 'up' });
  } catch (e) {
    return Response.json({ status: 'error', db: 'down' }, { status: 503 });
  }
}
```

**Sentry → Discord alert:**
- Sentry Settings → Integrations → Discord
- Threshold: 5 events/min veya yeni issue
- Channel: #freetierhunt-alerts

**🔴 KRİTİK: DB Backup Stratejisi**

Supabase free tier = sadece 7 gün retention, PITR YOK. Veri kaybı riski.

**Çözüm: Oracle VM'de daily backup cron**

> **🔴 KRİTİK:** Cron context boş env ile çalışır. `$DIRECT_URL` ve diğer değişkenler script içinde **mutlaka** `.env`'den source edilmeli. Aksi halde `pg_dump ""` empty string ile çağrılır → fail.

```bash
# /home/ubuntu/scripts/backup-db.sh
#!/usr/bin/env bash
set -euo pipefail

# 🔴 Env'i source et (cron context için kritik)
if [ -f /home/ubuntu/freetierhunt/.env ]; then
  set -a
  source /home/ubuntu/freetierhunt/.env
  set +a
fi

# Sanity check
if [ -z "${DIRECT_URL:-}" ]; then
  echo "[Backup] FAIL: DIRECT_URL not set" >&2
  exit 1
fi

TIMESTAMP=$(date -u +%Y%m%d_%H%M%S)  # UTC timestamp
BACKUP_DIR=/home/ubuntu/backups
mkdir -p "$BACKUP_DIR"

OUT="$BACKUP_DIR/freetierhunt_$TIMESTAMP.sql.gz"

# Direct URL (port 5432) for pg_dump (Pooler DDL desteklemez)
pg_dump "$DIRECT_URL" --no-owner --no-acl | gzip -9 > "$OUT"

# Sanity: minimum boyut kontrolü (boş dump'i yakala)
SIZE=$(stat -c%s "$OUT")
if [ "$SIZE" -lt 1024 ]; then
  echo "[Backup] FAIL: backup file too small ($SIZE bytes)" >&2
  rm -f "$OUT"
  exit 1
fi

# 30 günden eski yedeği sil
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete

# Optional: Cloudflare R2 / S3'e yükle (offsite copy)
if command -v rclone &> /dev/null && [ -n "${BACKUP_REMOTE:-}" ]; then
  rclone copy "$OUT" "$BACKUP_REMOTE/" --quiet
fi

echo "[Backup] OK: $OUT ($SIZE bytes)"
```

```bash
# Permissions + crontab (her gece 03:00 UTC)
chmod 700 /home/ubuntu/scripts/backup-db.sh
chmod 600 /home/ubuntu/freetierhunt/.env  # 🔴 secret protection

crontab -e
# Cron her gece 03:00 UTC (DB hafif yükteyken)
0 3 * * * /home/ubuntu/scripts/backup-db.sh >> /home/ubuntu/backup.log 2>&1

# Discord webhook ile fail alert (opsiyonel)
# 0 3 * * * /home/ubuntu/scripts/backup-db.sh >> /home/ubuntu/backup.log 2>&1 || curl -X POST $DISCORD_WEBHOOK -d '{"content":"❌ DB backup failed"}'
```

**Restore test (ayda 1, Pazar review'da):**
```bash
# Test DB'ye restore et
gunzip < /home/ubuntu/backups/freetierhunt_LATEST.sql.gz | psql "$TEST_DATABASE_URL"

# Smoke check: kayıt sayısı eşleşiyor mu?
psql "$TEST_DATABASE_URL" -c "SELECT count(*) FROM products;"
psql "$DIRECT_URL" -c "SELECT count(*) FROM products;"
# Sayılar eşit olmalı (±son 24h diff)
```

**Ekstra Checklist:**
- [ ] Vitest kurulu, smoke test geçiyor
- [ ] Playwright kurulu (E2E için Hafta 5+ kullan)
- [ ] UptimeRobot 2 monitor aktif
- [ ] `/api/health` endpoint var
- [ ] Sentry → Discord webhook çalışıyor
- [ ] Oracle VM'de daily backup cron çalışıyor

#### Cumartesi (4 saat)

**Görev:** OpenClaw'a ilk bağlantı + LLM router

1. Oracle VM'e SSH
2. OpenClaw API endpoint'ini öğren (`claw/api` veya benzeri)
3. Yerel'den test request at
4. `src/lib/llm` router'ı yaz

**Windsurf prompt'u:**

```typescript
Create src/lib/llm/router.ts:

A smart LLM router that attempts providers in this order:
1. Groq (llama-3.3-70b-versatile) - primary, fastest
2. OpenRouter (meta-llama/llama-3.1-405b-instruct:free) - secondary
3. OpenAI (gpt-4o-mini) - tertiary, costs money
4. NVIDIA NIM (kimi-k2 or glm-4.5) - backup

Function signature:
  async function chat(params: {
    messages: Array<{role: 'system' | 'user' | 'assistant', content: string}>,
    temperature?: number,
    maxTokens?: number,
    response_format?: 'json' | 'text'
  }): Promise<{content: string, model: string, tokens: number}>

Handle errors gracefully:
- Rate limit → wait 1s, try next provider
- Invalid JSON (when json mode) → retry once, then next provider
- Provider down → skip to next
- All failed → throw with clear error

Log each attempt with provider name and outcome.
Use zod to validate responses when JSON mode requested.
```

**Checklist:**
- [ ] LLM router yazıldı
- [ ] Test call: *"Hello, who are you?"* — Groq'tan yanıt geliyor
- [ ] Fallback test: Groq rate limit simülasyonu → OpenRouter devreye giriyor

#### Pazar (2 saat)

**Görev:** Review + GDPR Cookie Banner + Hafta 2 Planning

**🔴 KRİTİK: CSP Header (XSS Koruma) — 15 dk**

> Cookie banner + analytics + Resend domain'leri inline script kullanır. Whitelist olmadan kullanıcı submission'larında XSS açığı olur.

`next.config.js` veya `src/middleware.ts`:

```typescript
// src/middleware.ts (CSP header'ı her response'a ekle)
import { NextResponse, type NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  
  const csp = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://static.cloudflareinsights.com https://*.posthog.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https://ph-files.imgix.net https://*.indiehackers.com https://*.supabase.co https://*.r2.cloudflarestorage.com;
    font-src 'self' data:;
    connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.posthog.com https://api.resend.com;
    frame-ancestors 'none';
    form-action 'self';
    base-uri 'self';
    object-src 'none';
    upgrade-insecure-requests;
  `.replace(/\s+/g, ' ').trim();
  
  const response = NextResponse.next();
  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('x-nonce', nonce);
  
  // Diğer security headers (bonus)
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  return response;
}

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico|api/health).*)'
};
```

**🔴 KRİTİK: GDPR Banner (30 dk)**

> AB'den ziyaretçi = yasal zorunluluk. Hafta 1'de ekle.  
> **NOT:** `react-cookie-consent` 2+ yıldır maintain edilmiyor. Bunun yerine `vanilla-cookieconsent` veya kendi component'ini kullan (10 satır).

**Windsurf prompt'u:**
```
Add GDPR cookie consent banner (custom, no external deps):

1. Create src/components/CookieBanner.tsx (Client Component):
   'use client';
   - Yellow background (#FFD700), black border, brutal style
   - Text: "We use essential cookies always. Analytics cookies only if you accept. No ads, no tracking."
   - Buttons:
     - "Accept analytics" (black bg, yellow text) → localStorage.setItem('consent', 'accepted')
     - "Essential only" (outline) → localStorage.setItem('consent', 'declined')
   - Persist + don't show if already decided
   - Bottom: small link "Privacy Policy" → /privacy

2. Create src/lib/consent.ts:
   export function hasAnalyticsConsent(): boolean {
     return typeof window !== 'undefined' && localStorage.getItem('consent') === 'accepted';
   }
   export const onConsentChange = (cb: (accepted: boolean) => void) => { ... };

3. PostHog conditional load:
   - app/layout.tsx'te:
     {hasAnalyticsConsent() && <Script src="..." nonce={nonce} />}
   - Veya client-side dynamic import: import('posthog-js').then(...)

4. Cookie kategorileri (üç seviye, daha güvenli):
   - 'strict' — sadece essential (auth, CSRF)
   - 'analytics' — PostHog, Cloudflare Analytics
   - 'all' — analytics + (ileride) tracking

5. /settings/privacy page'de consent'i değiştirme imkanı ver.
```

**Test:**
- AB IP üzerinden incognito → banner görünmeli
- Reject → PostHog Network tab'da DİĞİL görünmesin
- Accept → analytics yüklensin
- Refresh → banner gözükmesin (localStorage)

1. Hafta 1 checklist'ini gözden geçir
2. Karşılaştığın 3 ana zorluğu `notes/bugs.md`'ye yaz
3. Hafta 2 için Hafta 1'den öğrenilenleri uygula
4. X'te build-in-public update:

> Week 1 done 🏹
> ✅ Domain live: freetierhunt.com
> ✅ Next.js + Supabase + Vercel stack
> ✅ Brutal design system
> ✅ LLM router with 4-tier fallback
>
> Next week: Database schema + first data pipeline.
>
> #buildinpublic

### 🎯 Hafta 1 Teslim

- ✅ `freetierhunt.com` canlı (içi boş ama deploy pipeline çalışıyor)
- ✅ Database connected
- ✅ All API keys configured
- ✅ LLM router functioning
- ✅ First build-in-public post

### ⚠️ Potansiyel Tuzaklar

- **DNS propagation:** Domain'in SSL'i 1-2 saat alabilir, panik yapma.
- **Pooler port:** DATABASE_URL'de 6543 değil 5432 yazarsan 60 connection limiti hızla dolar, site çöker.
- **Worker path:** `worker/` klasörü `src/` dışında, import'larında `../../src/lib/` kullanmayı unutma.

---

## HAFTA 2: DATABASE & DATA LAYER

### 🎯 Ana Hedef

Tam veri şemasını Supabase'e kurmak + Drizzle ile type-safe erişim.

### 🎨 Küçük Zafer

`pnpm db:studio`'da tablolarını gör. İlk manuel insert yap.

### 📅 Günlük Breakdown

#### Pazartesi (3 saat)

**Görev:** Ana tablolar — `products`, `offers`

**Windsurf prompt'u:**

```sql
In src/lib/db/schema.ts, create tables with Drizzle ORM:

1. products.ts — table "products":
  - id: uuid primary key, default random
  - slug: text unique, not null
  - name: text not null
  - tagline: text
  - description: text
  - website_url: text not null
  - website_domain: text (generated column from website_url)
  - logo_url: text
  - screenshot_url: text
  - categories: text[] default '{}'
  - tags: text[] default '{}'
  - is_ai_native: boolean default false
  - ph_id: text unique
  - ih_url: text
  - monthly_price: numeric(8,2) // Hafta 6 savings calculator (manuel veya enrichment)
  - pricing_model: varchar(20) // 'free', 'freemium', 'paid', 'one-time'
  - views_count: integer default 0 // 🔴 Hafta 5 generateStaticParams için trending sıralama
  - first_seen_at: timestamptz
  - last_launched_at: timestamptz
  - created_at: timestamptz default now()
  - updated_at: timestamptz default now()

2. offers.ts — table "offers":
  - id: uuid primary key
  - product_id: uuid references products(id) on delete cascade
  - type: text (enum check: 'promo_code', 'free_trial', 'student_discount', 
    'lifetime_deal', 'free_tier', 'launch_special', 'referral_credit')
  - status: text default 'active' (enum: 'draft','active','expired','flagged','archived')
  - code: text
  - title: text not null
  - description: text not null
  - discount_pct: numeric(5,2)
  - discount_flat: numeric(10,2)
  - currency: char(3) default 'USD'
  - trial_days: integer
  - redemption_url: text
  - redemption_instructions: text
  - requires_credit_card: boolean default true
  - requires_student_verify: boolean default false
  - conditions: text
  - valid_from: timestamptz
  - valid_until: timestamptz
  - source: text not null (enum: 'producthunt','indiehackers','uneed','manual')
  - source_url: text
  - extracted_from: text
  - extraction_method: text
  - extraction_confidence: numeric(3,2)
  - llm_model: text
  - verified: boolean default false
  - verified_at: timestamptz
  - last_checked_at: timestamptz
  - trust_score: numeric(3,2) default 0.5
  - upvotes: integer default 0
  - downvotes: integer default 0
  - works_count: integer default 0
  - doesnt_work_count: integer default 0
  - created_at: timestamptz default now()
  - updated_at: timestamptz default now()

Add indexes (query path coverage — Hafta 2'de hepsini ekle, sonra eklemek migration drift):
  - offers_product_type_idx ON offers(product_id, type)
  - offers_status_idx ON offers(status) WHERE status = 'active'
  - offers_trust_idx ON offers(trust_score DESC) WHERE status = 'active'
  - offers_valid_until_idx ON offers(valid_until) WHERE status = 'active' -- expireOldOffers cron
  - offers_last_checked_idx ON offers(last_checked_at) WHERE status = 'active' -- recency penalty calc
  - products_domain_idx ON products(website_domain)
  - products_views_idx ON products(views_count DESC) -- 🔴 Hafta 5 generateStaticParams
  - products_ai_idx ON products(is_ai_native) WHERE is_ai_native = true -- AI filter listing

Export all tables from src/lib/db/schema.ts
Generate migration: pnpm db:generate
```

**Checklist:**
- [ ] `products` tablosu oluşturuldu
- [ ] `offers` tablosu oluşturuldu
- [ ] Migration başarıyla çalıştı
- [ ] Supabase dashboard'da tablolar görünüyor

#### Salı (3 saat)

**Görev:** Users, launches, community tabloları

**Windsurf prompt'u:**

```sql
Add more tables to src/lib/db/schema.ts:

3. users.ts — table "users":
  - id: uuid primary key
  - email: text unique not null
  - name: text
  - avatar_url: text
  - github_id: text unique
  - is_student: boolean default false
  - student_verified_at: timestamptz
  - total_saved_usd: numeric(10,2) default 0
  - email_digest_frequency: text default 'never' // 🔴 GDPR: 'daily','weekly','never' — DEFAULT 'never' (explicit consent zorunlu, signup formunda unchecked checkbox)
  - interested_categories: text[]
  - monthly_spend_bracket: varchar(20) // '0-25','25-75','75-200','200+' (Hafta 10 onboarding)
  - goal: varchar(30) // 'save_money','discover','submit' (Hafta 10 onboarding)
  - onboarded_at: timestamptz // null → onboarding flow trigger
  - role: varchar(20) default 'user' // 'user','admin' (Hafta 9 admin check)
  - email_verified_at: timestamptz // bounce protection
  - created_at: timestamptz default now()

4. launches.ts — table "launches":
  - id: uuid primary key
  - product_id: uuid references products(id)
  - source: text not null
  - source_url: text
  - launched_at: timestamptz not null
  - upvotes: integer
  - comments_count: integer
  - raw_data: jsonb
  - created_at: timestamptz default now()

5. saved_offers.ts — table "saved_offers" (junction):
  - user_id: uuid references users(id) on delete cascade
  - offer_id: uuid references offers(id) on delete cascade
  - used: boolean default false
  - saved_usd: numeric(10,2)
  - saved_at: timestamptz default now()
  - PRIMARY KEY (user_id, offer_id)

6. offer_votes.ts — table "offer_votes":
  - id: uuid primary key default random // 🔴 PK olarak (offer_id, user_id) DEĞİL — anonymous voting (user_id=null) destekleniyor
  - offer_id: uuid references offers(id) on delete cascade not null
  - user_id: uuid references users(id) // null = anonymous (voter_ip ile dedup)
  - works: boolean not null
  - comment: text
  - voter_ip: inet // 🔴 Sybil koruma: anonymous voting'de dedup key
  - voter_account_age_days: integer // Vote weight hesabı için
  - vote_weight: numeric(3,2) default 1.0
    // 🔴 Trust score formula (Hafta 9'da hesaplanır, default 1.0 schema integrity için):
    //   baseWeight = 1.0
    //   accountAgeFactor = min(1, voter_account_age_days / 30)  // 30 gün üstü tam ağırlık
    //   verifiedFactor = (email_verified_at != null) ? 1.0 : 0.3
    //   vote_weight = baseWeight * accountAgeFactor * verifiedFactor
    //   Anonymous (user_id=null): vote_weight = 0.1 (çok düşük etki)
  - created_at: timestamptz default now()

  -- 🔴 PRIMARY KEY (offer_id, user_id) ÇALIŞMAZ: user_id NULL olabilir.
  -- Bunun yerine UNIQUE INDEX with COALESCE:
  CREATE UNIQUE INDEX offer_votes_unique_idx ON offer_votes (
    offer_id,
    COALESCE(user_id::text, voter_ip::text)
  );
  -- Ek: Authenticated user için ayrı kontrol (aynı user 2x oy veremez)
  CREATE UNIQUE INDEX offer_votes_user_idx ON offer_votes (offer_id, user_id) WHERE user_id IS NOT NULL;

7. submissions.ts — table "submissions" (user-submitted offers):
  - id: uuid primary key
  - submitter_id: uuid references users(id)
  - product_url: text not null
  - offer_type: text not null
  - code: text
  - description: text not null
  - source_url: text
  - status: text default 'pending' (enum: 'pending','approved','rejected')
  - agent_verdict: jsonb
  - reviewed_at: timestamptz
  - created_at: timestamptz default now()

8. extraction_queue.ts — table "extraction_queue":
  - id: uuid primary key
  - product_id: uuid references products(id)
  - source: text not null
  - source_url: text
  - text: text
  - status: text default 'pending' (enum: 'pending','processing','completed','failed')
  - retry_count: integer default 0
  - error: text
  - created_at: timestamptz default now()
  - updated_at: timestamptz default now()
  - processed_at: timestamptz

9. offer_events.ts — table "offer_events" (audit trail):
  - id: uuid primary key
  - offer_id: uuid references offers(id)
  - from_status: text
  - to_status: text not null
  - reason: text
  - actor: text not null
  - metadata: jsonb
  - created_at: timestamptz default now()

10. offer_reports.ts — table "offer_reports" (Hafta 9 "Report issue" feature):
  - id: uuid primary key, default random
  - offer_id: uuid references offers(id) on delete cascade
  - reporter_id: uuid references users(id) // null = anonymous
  - reason: varchar(20) not null // 'expired','wrong_info','scam','other'
  - details: text
  - resolved: boolean default false
  - resolved_by: uuid references users(id)
  - resolved_at: timestamptz
  - created_at: timestamptz default now()

11. llm_calls.ts — table "llm_calls" (cost tracking, Hafta 4'te kullanılacak):
  - id: uuid primary key
  - provider: varchar(20) // 'groq','openrouter','openai','nim'
  - model: varchar(50)
  - input_tokens: integer
  - output_tokens: integer
  - cost_usd: numeric(10,6) // 6 ondalık - micro costs
  - latency_ms: integer
  - success: boolean
  - error: text
  - context: varchar(50) // 'extraction','validation','content'
  - created_at: timestamptz default now()

12. digest_log.ts — table "digest_log" (🔴 Hafta 8 email idempotency):
  - id: uuid primary key default random
  - user_id: uuid references users(id) on delete cascade
  - sent_date: date not null  // YYYY-MM-DD (UTC)
  - digest_type: varchar(10) // 'weekly','daily'
  - email_id: text // Resend message ID
  - offers_count: integer
  - opened_at: timestamptz // Resend webhook ile güncellenir
  - clicked_at: timestamptz
  - bounced_at: timestamptz // bounce → users.email_verified_at NULL
  - PRIMARY KEY (user_id, sent_date, digest_type)
  // Worker restart durumunda 2x mail gitmesini önler

13. firecrawl_usage.ts — table "firecrawl_usage" (Hafta 7 budget tracking, üst bölümde tanımlandı):
  - Schema bu prompt'ta üretilmeyecek (Hafta 7'de detaylı), sadece Hafta 2'de boş tablo oluştur:
  - id: uuid primary key default random
  - product_id: uuid references products(id)
  - url: text not null
  - credits: integer default 1
  - success: boolean default true
  - created_at: timestamptz default now()

Index'ler (cron + admin query path coverage):
  - users_digest_freq_idx ON users(email_digest_frequency) WHERE email_digest_frequency != 'never'
  - submissions_status_idx ON submissions(status, created_at DESC) WHERE status = 'pending'
  - extraction_queue_status_idx ON extraction_queue(status, created_at) WHERE status IN ('pending','processing')
  - offer_reports_resolved_idx ON offer_reports(resolved, created_at DESC) WHERE resolved = false
  - firecrawl_usage_created_idx ON firecrawl_usage(created_at DESC) -- budget check (Hafta 7)
  - llm_calls_created_idx ON llm_calls(created_at DESC, provider) -- budget check + analytics
  - digest_log_date_idx ON digest_log(sent_date DESC, digest_type) -- admin query

Generate + push migrations.
```

**🔴 KRİTİK: Deduplication için Unique Constraint:**

```sql
-- Aynı offer'ın farklı kaynaklardan tekrar eklenmesini önle
CREATE UNIQUE INDEX offers_dedup_idx 
ON offers (product_id, type, UPPER(code), discount_pct, trial_days);

-- Upsert mantığı:
INSERT INTO offers (...) VALUES (...)
ON CONFLICT (product_id, type, UPPER(code), discount_pct, trial_days)
DO UPDATE SET 
  trust_score = GREATEST(offers.trust_score, EXCLUDED.trust_score),
  last_checked_at = NOW();
```

**Checklist:**
- [ ] Tüm tablolar oluşturuldu (11 tablo)
- [ ] Foreign keys doğru çalışıyor
- [ ] **Deduplication unique index ekli**
- [ ] Supabase'de tablo ilişkileri görünüyor

#### Çarşamba (3 saat)

**Görev:** Row Level Security (RLS) + Supabase Auth bağlantı

**Windsurf prompt'u:**

```
Set up Supabase Row Level Security for our tables:

1. products, offers, launches — PUBLIC READ, authenticated INSERT/UPDATE (admin only)
2. users — users can only read/update their own row
3. saved_offers, offer_votes — users can only manage their own
4. submissions — users can INSERT their own, READ their own, UPDATE only if pending

Write SQL policies and add them as a migration file in src/lib/db/migrations/rls.sql.

Also set up Supabase Auth:
1. Install @supabase/ssr
2. Create src/lib/supabase/client.ts (browser client)
3. Create src/lib/supabase/server.ts (server client)
4. Create middleware.ts for auth session management
5. Email magic link auth (no password)
```

**Service Role for Worker:**
```typescript
// worker/db/admin-client.ts (RLS bypass için)
import { createClient } from '@supabase/supabase-js';
export const adminDb = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // .env'de SADECE worker'da kullan!
);
```

> Worker DB yazarken RLS bypass etmeli. Service role key Vercel'e gitmemeli, sadece Oracle VM'de.

**Checklist:**
- [ ] RLS policies active
- [ ] Supabase Auth yapılandırıldı
- [ ] Magic link login test edildi (manuel)

#### Perşembe (3 saat)

**Görev:** Query helpers + zod schemas

**Windsurf prompt'u:**

```
Create src/lib/db/queries.ts with type-safe query helpers:

1. products.ts:
  - getProductBySlug(slug: string)
  - getProductByDomain(domain: string)
  - searchProducts(query: string, filters: {category?, isAI?})
  - upsertProduct(data)
  - getTrendingProducts(limit: 10, days: 7)

2. offers.ts:
  - getActiveOffersByProduct(productId: string)
  - getTopOffersToday()
  - searchOffers(filters: {type?, minDiscount?, categories?})
  - upsertOffer(data)
  - expireOldOffers() // status = 'active' AND valid_until < now()

3. users.ts:
  - getUserById(id: string)
  - upsertUser(data)
  - getTotalSavings(userId: string)

Also create src/lib/db/validators.ts with zod schemas:
- ProductSchema
- OfferSchema (input and output versions)
- OfferInsertSchema with refinements (code format, discount limits)

Export everything cleanly from src/lib/db/index.ts
```

**Checklist:**
- [ ] Query helpers yazıldı
- [ ] Zod validators yazıldı
- [ ] Test: `getProductBySlug("test")` ne döndürür? (null — tamam)

#### Cuma (3 saat)

**Görev:** Seed data — manuel 20 ürün + 30 offer

Bu hafta içeriği test etmek için manuel olarak senin bildiğin popüler AI araçlarını ekle.

**Windsurf prompt'u:**

```
Create a seed script in src/lib/db/seed.ts that inserts 20 popular AI tools 
and 30 offers. Use real data that I know exists:

Products to include:
- Cursor, Windsurf, Claude, ChatGPT, Gemini, 
- Midjourney, Stable Diffusion, DALL-E, 
- ElevenLabs, Suno, HeyGen, Synthesia,
- fal.ai, Replicate, Hugging Face,
- Perplexity, Exa, Tavily,
- Notion AI, Linear AI, GitHub Copilot

For offers, include known ones:
- GitHub Student Pack for Cursor (free)
- ElevenLabs student discount (50% off)
- Notion free for students
- fal.ai \$5 signup credit
- Midjourney basic tier signup
- ChatGPT Plus free trial (when applicable)

Script runnable: pnpm db:seed
```

**Checklist:**
- [ ] 20 ürün eklendi
- [ ] 30 offer eklendi
- [ ] Supabase dashboard'da data görünüyor
- [ ] Manuel query test: *"Cursor için aktif offer listele"*

#### Cumartesi (4 saat)

**Görev:** Basic API routes — veriyi dışarı verebilmek

**Windsurf prompt'u:**

```
Create API routes in src/app/api/:

1. GET /api/products
   - Query params: category, isAI, limit, offset
   - Returns: { products: [], total: number }

2. GET /api/products/[slug]
   - Returns product with active offers

3. GET /api/offers/today
   - Returns top 10 offers from last 24h by trust_score

4. GET /api/offers/search
   - Query params: q, type, minDiscount, category
   - Returns matched offers

Use:
- Next.js 15 Route Handlers
- Zod for input validation
- Drizzle queries from src/lib/db
- Return proper HTTP status codes
- Add basic rate limiting (10 req/min per IP) via @upstash/ratelimit
- CORS headers for future extension use
```

**Checklist:**
- [ ] 4 API route oluşturuldu
- [ ] Her biri manuel test edildi (browser veya Postman)
- [ ] Rate limiting çalışıyor
- [ ] Error handling var

#### Pazar (2 saat)

**Görev:** Review + X post

> Week 2 ✅
> 🗃️ Full database schema (7 tables)
> 🔐 Row-level security active
> 📦 20 products + 30 offers seeded
> 🔌 4 API endpoints live
>
> Next: Product Hunt integration — first real data pipeline.
>
> #buildinpublic #ai

### 🎯 Hafta 2 Teslim

- ✅ Tam veri şeması çalışır durumda
- ✅ 20 ürün + 30 offer manuel olarak yüklendi
- ✅ API endpoints test edildi
- ✅ Auth pipeline hazır

### ⚠️ Potansiyel Tuzaklar

- **RLS kafa karıştırıcı:** Supabase UI'dan "Authenticated users can do X" basit politikalar yaz. Karmaşıklaştırma.
- **Drizzle migration conflicts:** Her push sonrası `drizzle-kit check` çalıştır.
- **JSONB vs JSON:** Drizzle'da `jsonb()` kullan, daha hızlı.

---

## HAFTA 3: PRODUCT HUNT INTEGRATION

### 🎯 Ana Hedef

Product Hunt API'den otomatik olarak günlük launches çek + database'e kaydet.

### 🎨 Küçük Zafer

Oracle VM'de cron job çalışıyor, her 30 dakikada yeni PH verileri geliyor.

### 📅 Günlük Breakdown

#### Pazartesi (3 saat)

**Görev:** PH API client (veya alternatif scraping)

> **NOT:** Hafta 0'da PH API başvurusu yaptın mı? 
> - **Onay geldi** → Aşağıdaki GraphQL client'ı implement et
> - **Onay bekleniyor** → Firecrawl + Uneed.best RSS ile devam et (Hafta 7'de PH API'ye geç)

**Alternatif A (PH API Onaylı):**

> **🔴 KRİTİK:** Token expiry handling + complexity tracking olmazsa worker 30 gün sonra patlar veya rate limit yer.

```
Create src/lib/scrapers/producthunt/client.ts:

A Product Hunt GraphQL client with:

1. OAuth2 Client Credentials flow (bearer token exchange)

2. Token caching (Redis-backed, expiry-aware refresh):
   - cacheKey: 'ph:access_token'
   - Token alındığında { token, expiresAt } olarak kaydet
   - getAccessToken() → eğer expiresAt - 24h < now() ise refresh
   - Bu sayede 30. gün gelmeden 29. günde refresh oluyor

3. GraphQL query execution with complexity tracking:
   - Her response header'ında 'X-Rate-Limit-Remaining' varsa oku
   - Redis sliding window: ZADD ph:complexity <timestamp> <cost>
   - ZREMRANGEBYSCORE ph:complexity 0 <now-15min>
   - Eğer toplam > 6000 (limit 6250 - safety), sleep until window slides

4. Retry logic:
   - 401 → forceRefreshToken() + 1 retry
   - 429 → sleep(retry-after) + retry
   - 5xx → exponential backoff (3 attempts)

Functions:
  - getAccessToken(force?: boolean): Promise<string>
  - refreshAccessToken(): Promise<{token, expiresAt}>
  - getRemainingComplexity(): Promise<number>
  - query<T>(gqlString: string, variables: object): Promise<{data: T, complexityCost: number}>
  - fetchDailyLeaderboard(date: Date): Promise<PHPost[]>  // date UTC midnight'a alınmalı
  - fetchPostComments(postId: string): Promise<PHComment[]>

Use graphql-request library.
```

**Token Refresh Implementation Detayı:**
```typescript
// src/lib/scrapers/producthunt/client.ts
import IORedis from 'ioredis';
import { logger } from '../../logger';

const redis = new IORedis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });
const TOKEN_KEY = 'ph:access_token';
const REFRESH_BUFFER_MS = 24 * 3600 * 1000;  // 24 saat önceden refresh

interface CachedToken {
  token: string;
  expiresAt: number;  // ms epoch
}

export async function getAccessToken(force = false): Promise<string> {
  if (!force) {
    const cached = await redis.get(TOKEN_KEY);
    if (cached) {
      const parsed = JSON.parse(cached) as CachedToken;
      if (parsed.expiresAt > Date.now() + REFRESH_BUFFER_MS) {
        return parsed.token;
      }
      logger.info({ expiresIn: parsed.expiresAt - Date.now() }, '[PH] Token expiring soon, refreshing');
    }
  }
  
  const fresh = await refreshAccessToken();
  await redis.set(TOKEN_KEY, JSON.stringify(fresh), 'PX', fresh.expiresAt - Date.now());
  return fresh.token;
}

async function refreshAccessToken(): Promise<CachedToken> {
  const res = await fetch('https://api.producthunt.com/v2/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.PH_API_KEY,
      client_secret: process.env.PH_API_SECRET,
      grant_type: 'client_credentials'
    })
  });
  if (!res.ok) throw new Error(`PH OAuth failed: ${res.status}`);
  const data = await res.json();
  return {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in * 1000)  // genelde 30 gün
  };
}
```

**Complexity Tracker (B10):**
```typescript
// src/lib/scrapers/producthunt/complexity.ts
const WINDOW_MS = 15 * 60 * 1000;  // 15 dk
const LIMIT = 6250;
const SAFETY_MARGIN = 250;  // 6000'de yavaşla

export async function trackComplexity(cost: number) {
  const now = Date.now();
  await redis.zadd('ph:complexity', now, `${now}:${cost}`);
  await redis.zremrangebyscore('ph:complexity', 0, now - WINDOW_MS);
}

export async function getRemainingComplexity(): Promise<number> {
  const now = Date.now();
  await redis.zremrangebyscore('ph:complexity', 0, now - WINDOW_MS);
  const items = await redis.zrange('ph:complexity', 0, -1);
  const used = items.reduce((sum, item) => sum + parseInt(item.split(':')[1]), 0);
  return Math.max(0, LIMIT - SAFETY_MARGIN - used);
}

// Query helper:
export async function safeQuery<T>(gql: string, vars: object, estimatedCost = 50): Promise<T> {
  const remaining = await getRemainingComplexity();
  if (remaining < estimatedCost) {
    const waitMs = WINDOW_MS / 4;  // window'un 1/4'ünü bekle
    logger.warn({ remaining, waitMs }, '[PH] Complexity low, sleeping');
    await new Promise(r => setTimeout(r, waitMs));
  }
  const { data, complexityCost } = await rawQuery<T>(gql, vars);
  await trackComplexity(complexityCost);
  return data;
}
```

**Env vars:**
- PH_API_KEY
- PH_API_SECRET
- REDIS_URL (Hafta 0 + Hafta 3'te kuruldu)

**Windsurf test prompt'u:**

```
Write a test script: src/lib/scrapers/test-ph.ts
that fetches today's top 10 PH posts and prints them to console.
Run it with: npx tsx src/lib/scrapers/test-ph.ts
```

- [ ] OAuth token alıyor
- [ ] Daily leaderboard dönüyor (10 post)
- [ ] Complexity budget tracker çalışıyor

#### Salı (3 saat)

**Görev:** Maker's Comment detection + parsing

> **NOT:** Oracle VM = **ARM (Ampere A1)**. Playwright çalışmaz!
> **Çözüm:** Firecrawl kullan (JS render + extraction zaten yapıyor)

```typescript
Add these functions to src/lib/scrapers/producthunt/parser.ts:

1. findMakersComment(post: PHPost): PHComment | null
   - From post.comments, filter by user.id in post.makers[]
   - Sort by createdAt ASC
   - Return first (the "launch comment")

2. extractExternalLinks(comment: PHComment): string[]
   - Regex for URLs in comment.body
   - Filter out producthunt.com, bit.ly (too many redirects)
   - Return deduplicated array

3. parseComment(comment: PHComment): ParsedComment
   - Returns: {
       text: string,
       links: string[],
       mentions: string[] (e.g., @username),
       hasOfferSignal: boolean,
       signalWords: string[] (e.g., ['promo', 'free trial'])
     }

The hasOfferSignal detection uses these regex patterns:
- /promo\s*code|coupon|discount/i
- /\d+[\s-]*(?:day|week|month)s?\s+(?:free\s+)?trial/i
- /\d{1,3}%\s*(?:off|discount)/i
- /lifetime\s+(?:deal|access)/i
- /student\s+(?:plan|discount)/i

Write tests: given these sample texts, it should detect offers.
```

**Sample test cases:**

```typescript
const samples = [
  "Use code LAUNCH50 for 50% off! 🚀",  // → hasSignal: true
  "Just launched! Check it out.",         // → hasSignal: false
  "Free 14-day trial for everyone",      // → hasSignal: true
  "Happy to answer any questions",        // → hasSignal: false
];
```

**Checklist:**
- [ ] Maker's Comment doğru bulunuyor (10 PH post'unda test et)
- [ ] Link extraction çalışıyor
- [ ] Signal detection doğru çalışıyor

#### Çarşamba (3 saat)

**Görev:** Normalizer — PH data → our schema

**Windsurf prompt'u:**

```
Create src/lib/scrapers/producthunt/normalizer.ts:

function normalizePHPost(post: PHPost): NormalizedPost {
  return {
    product: {
      slug: generateSlug(post.name),  // use slugify library
      name: post.name,
      tagline: post.tagline,
      description: post.description,
      website_url: post.website || post.url,
      website_domain: extractDomain(post.website),
      logo_url: post.thumbnail?.url,
      categories: post.topics.map(t => t.slug),
      is_ai_native: detectAINative(post),  // heuristic
      ph_id: post.id,
      first_seen_at: new Date(),
      last_launched_at: post.featuredAt,
    },
    launch: {
      source: 'producthunt',
      source_url: post.url,
      launched_at: post.featuredAt,
      upvotes: post.votesCount,
      comments_count: post.commentsCount,
      raw_data: post,  // store original
    },
    makersComment: findMakersComment(post),
  };
}

Helper functions:
- generateSlug(name): string — URL-safe, unique
- extractDomain(url): string — no protocol, no www
- detectAINative(post): boolean — check topics/tagline for "AI", "ML", etc.

Write tests with 5 sample PH posts.
```

**AI detection heuristic örnek:**

```typescript
function detectAINative(post: PHPost): boolean {
  const aiKeywords = ['ai', 'ml', 'llm', 'gpt', 'artificial', 'machine learning', 'neural'];
  const topics = post.topics.map(t => t.slug.toLowerCase());
  const text = `${post.name} ${post.tagline} ${post.description}`.toLowerCase();
  
  return topics.some(t => aiKeywords.includes(t)) ||
         aiKeywords.some(kw => text.includes(kw));
}
```

**Checklist:**
- [ ] 5 PH post doğru normalize ediliyor
- [ ] Slug çakışma riski çözüldü (unique suffix ekle)
- [ ] AI detection %80+ doğru

#### Perşembe (3 saat)

**Görev:** Upsert to database + dedup

**Windsurf prompt'u:**

```javascript
Create src/lib/scrapers/producthunt/pipeline.ts:

async function processPHPost(post: PHPost): Promise<ProcessResult> {
  const normalized = normalizePHPost(post);
  
  // Step 1: Upsert product (dedup by domain or ph_id)
  const product = await upsertProduct(normalized.product);
  
  // Step 2: Insert launch record (if new)
  const existingLaunch = await findLaunch(product.id, 'producthunt', post.id);
  if (!existingLaunch) {
    await insertLaunch({ ...normalized.launch, product_id: product.id });
  }
  
  // Step 3: Queue Maker's Comment for extraction (next week's work)
  if (normalized.makersComment && normalized.makersComment.hasOfferSignal) {
    await queueForExtraction({
      product_id: product.id,
      source: 'producthunt',
      source_url: normalized.launch.source_url,
      text: normalized.makersComment.body,
    });
  }
  
  return { productId: product.id, isNew: !existingProduct };
}

async function processBatch(posts: PHPost[]) {
  const results = await Promise.allSettled(
    posts.map(p => processPHPost(p))
  );
  // Log summary: X new, Y existing, Z failed
}
```

**Queue mechanism for now:**
- Simple: insert into a `extraction_queue` table
- Later: BullMQ

**Windsurf prompt'u devam:**

```
Create extraction_queue table in src/lib/db/schema.ts:
- id uuid
- product_id uuid
- source text
- source_url text
- text text
- status text default 'pending'
- created_at timestamptz default now()
- processed_at timestamptz
```

- [ ] Upsert logic dedup ediyor (aynı domain 2 kere eklenmiyor)
- [ ] Extraction queue dolmaya başlıyor
- [ ] Test: 10 PH post → database'de 10 yeni ürün

#### Cuma (3 saat)

**Görev:** Worker + Cron + BullMQ kurulumu

> **🔴 MİMARİ NETLİĞİ:** Sistem 3 farklı katmandan oluşur:
> 1. **node-cron** = Scheduler (PH scrape gibi periyodik tetikleyici)
> 2. **BullMQ + Redis** = Job queue (extraction, validation gibi async işler)
> 3. **extraction_queue (Postgres)** = Idempotency tracking (görüldü mü, işlendi mi)

**1. Scrape Job (node-cron tetikler)**

```typescript
// worker/jobs/scrape-ph.ts
import { fetchDailyLeaderboard, processBatch } from '../../src/lib/scrapers/producthunt';
import { extractionQueue } from '../queues/extraction';
import { subDays } from 'date-fns';

export async function scrapePHJob() {
  const startTime = Date.now();
  try {
    const todayPosts = await fetchDailyLeaderboard(new Date());
    const yesterdayPosts = await fetchDailyLeaderboard(subDays(new Date(), 1));
    const allPosts = [...todayPosts, ...yesterdayPosts];
    
    // 1. Postgres'e yaz (idempotency için)
    const results = await processBatch(allPosts);
    
    // 2. BullMQ'ya extraction job'ları ekle
    for (const item of results.queueItems) {
      await extractionQueue.add('extract', { 
        queueItemId: item.id,
        text: item.text,
        productId: item.product_id 
      }, {
        jobId: item.id  // Idempotency: aynı queueItemId iki kere eklenmez
      });
    }
    
    return { success: true, processed: allPosts.length };
  } catch (error) {
    console.error('[PH Scrape] Failed:', error);
    throw error;
  }
}
```

**2. BullMQ Queue + Worker (extraction job'ları işler)**

```typescript
// worker/queues/extraction.ts
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';

const redis = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null  // BullMQ requirement
});

export const extractionQueue = new Queue('extraction', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: { age: 24 * 3600 },  // 24h sonra sil
    removeOnFail: { age: 7 * 24 * 3600 }   // 7 gün sonra sil
  }
});

// Worker = job processor
export const extractionWorker = new Worker(
  'extraction',
  async (job) => {
    // Hafta 4'te dolduracağız (extractOffersJob)
    return { status: 'placeholder' };
  },
  {
    connection: redis,
    concurrency: 5,           // Aynı anda 5 job (Groq rate limit korumasi)
    stalledInterval: 30_000,  // 30sn'de bir stalled job kontrolü
    maxStalledCount: 2        // 2 stall sonra failed
  }
);
```

**3. Worker Entry Point (node-cron + BullMQ workers)**

```typescript
// worker/index.ts
// 🔴 KRİTİK: TZ'i UTC'ye zorla. PH API "today" UTC midnight'a göre.
// VM TZ'i farklıysa cron'un "today" hesabı yanlış güne bakar.
process.env.TZ = 'UTC';

import cron from 'node-cron';
import './queues/extraction';  // BullMQ worker'ı başlat
import { scrapePHJob } from './jobs/scrape-ph';
import { recoverStaleJobs } from './jobs/recovery';
import { logger } from '../src/lib/logger';

// Startup sanity check
logger.info({
  tz: process.env.TZ,
  now: new Date().toISOString(),
  utcOffset: new Date().getTimezoneOffset()  // 0 olmalı
}, '[Worker] Boot');

// Scheduler 1: PH scrape (her 30 dk — UTC)
cron.schedule('*/30 * * * *', async () => {
  logger.info('[Cron] PH scrape başlıyor (UTC)');
  await scrapePHJob();
}, { timezone: 'UTC' });

// Scheduler 2: Stale job recovery (her 10 dk — UTC)
cron.schedule('*/10 * * * *', async () => {
  logger.info('[Cron] Stale job recovery (UTC)');
  await recoverStaleJobs();
}, { timezone: 'UTC' });

// Graceful shutdown (SIGTERM + SIGINT)
const shutdown = async (signal: string) => {
  logger.info({ signal }, '[Worker] Shutting down');
  await extractionWorker.close();
  await extractionQueue.close();
  process.exit(0);
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

logger.info('[Worker] Started');
```

**4. Stale Job Recovery (idempotency tracking için)**

> **🔴 KRİTİK:** Max retry kontrolü olmadan sonsuz loop riski. Bir job sürekli stale olursa worker resource yer.

```typescript
// worker/jobs/recovery.ts
import { db } from '../../src/lib/db/client';
import { extractionQueue as queueTable } from '../../src/lib/db/schema';
import { and, eq, lt } from 'drizzle-orm';
import { logger } from '../../src/lib/logger';

const STALE_THRESHOLD_MS = 10 * 60 * 1000;  // 10 dk
const MAX_RETRIES = 5;                       // 5 deneme sonra failed

export async function recoverStaleJobs() {
  const staleThreshold = new Date(Date.now() - STALE_THRESHOLD_MS);
  
  const staleJobs = await db
    .select()
    .from(queueTable)
    .where(and(
      eq(queueTable.status, 'processing'),
      lt(queueTable.updatedAt, staleThreshold)
    ));
    
  let recovered = 0;
  let failed = 0;
  
  for (const job of staleJobs) {
    const newRetryCount = (job.retryCount ?? 0) + 1;
    
    if (newRetryCount > MAX_RETRIES) {
      // 🔴 Max retry aşıldı → kalıcı failed (sonsuz loop önler)
      await db
        .update(queueTable)
        .set({
          status: 'failed',
          retryCount: newRetryCount,
          error: `Max retries exceeded (${MAX_RETRIES}). Last stale at ${new Date().toISOString()}`,
          updatedAt: new Date()
        })
        .where(eq(queueTable.id, job.id));
      
      logger.error({ jobId: job.id, retryCount: newRetryCount }, '[Recovery] Job permanently failed');
      failed++;
      
      // Sentry alert (kritik failure)
      // await Sentry.captureMessage(`Stale job permanently failed: ${job.id}`, 'warning');
    } else {
      await db
        .update(queueTable)
        .set({
          status: 'pending',
          retryCount: newRetryCount,
          error: `Recovered from stale state (attempt ${newRetryCount}/${MAX_RETRIES})`,
          updatedAt: new Date()
        })
        .where(eq(queueTable.id, job.id));
      
      recovered++;
    }
  }
  
  if (staleJobs.length > 0) {
    logger.info({ recovered, failed, total: staleJobs.length }, '[Recovery] Sweep complete');
  }
}
```

**5. PM2 Deployment**

> **🔴 KRİTİK: `instances: 1` + `exec_mode: 'fork'` zorunlu!**  
> Cluster mode'da çalışırsa node-cron her instance'ta tetikleyici olur → duplicate scrape, duplicate email, race conditions.

> **🟡 Production tip:** `npx tsx` runtime ESM/source-map sorunları çıkarabilir.  
> Dayanıklı yöntem: TypeScript'i build et, compiled JS çalıştır. Hızlı yöntem: npm script'i PM2'ye geçir.

**Yöntem A — Compiled JS (Önerilen):**

```javascript
// ecosystem.config.js (proje root'unda)
module.exports = {
  apps: [{
    name: 'freetierhunt-worker',
    script: './dist/worker/index.js',  // build çıktısı
    instances: 1,                       // 🔴 Cron duplicate'i önle
    exec_mode: 'fork',                  // 🔴 Cluster DEĞİL
    env: { NODE_ENV: 'production', TZ: 'UTC' },
    max_memory_restart: '500M',
    error_file: './logs/worker-error.log',
    out_file: './logs/worker-out.log',
    merge_logs: true,
    time: true,
    autorestart: true,
    watch: false,
    kill_timeout: 10000  // SIGTERM sonrası 10sn bekle (BullMQ graceful drain)
  }]
};
```

`package.json` build script:
```json
{
  "scripts": {
    "build:worker": "tsc -p tsconfig.worker.json",
    "start:worker": "node dist/worker/index.js"
  }
}
```

**Yöntem B — tsx via npm script (hızlı, debug için):**

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'freetierhunt-worker',
    script: 'npm',
    args: 'run start:worker:dev',  // → tsx worker/index.ts
    instances: 1,
    exec_mode: 'fork',
    env: { NODE_ENV: 'production', TZ: 'UTC' },
    max_memory_restart: '500M',
    error_file: './logs/worker-error.log',
    out_file: './logs/worker-out.log',
    time: true,
    kill_timeout: 10000
  }]
};
```

**Oracle VM Deploy Komutları (atomic deployment)**

`scripts/deploy.sh`:
```bash
#!/usr/bin/env bash
set -euo pipefail

cd ~/freetierhunt

# 1. Latest code (atomic)
git fetch origin main
git reset --hard origin/main

# 2. Deterministic install
npm ci --omit=dev=false

# 3. Build worker (Yöntem A için)
npm run build:worker

# 4. Zero-downtime restart
pm2 reload ecosystem.config.js --update-env
pm2 save

echo "✓ Deploy complete: $(git rev-parse --short HEAD)"
```

İlk kurulum:
```bash
ssh ubuntu@your-oracle-vm
cd ~/freetierhunt
cp .env.example .env
nano .env  # DATABASE_URL, DIRECT_URL, REDIS_URL, GROQ_API_KEY, SUPABASE_SERVICE_ROLE_KEY vb.
chmod 600 .env  # 🔴 service role key gizli
mkdir -p logs
chmod +x scripts/deploy.sh
./scripts/deploy.sh
pm2 startup  # systemd integration (boot'ta otomatik)
pm2 save
pm2 logs freetierhunt-worker --lines 50
```

Sonraki deploy'lar için:
```bash
ssh ubuntu@your-oracle-vm "cd ~/freetierhunt && ./scripts/deploy.sh"
```

### Checklist

- [ ] Redis Oracle VM'de çalışıyor (`redis-cli ping` → PONG)
- [ ] BullMQ queue + worker yazıldı
- [ ] node-cron PH scrape tetikleyicisi yazıldı
- [ ] Stale recovery cron yazıldı (her 10 dk)
- [ ] PM2 çalışıyor (`pm2 status`)
- [ ] Log'larda "Worker started" + ilk scrape output
- [ ] Database'e 30 dk sonra yeni PH veri geliyor
- [ ] Graceful shutdown test edildi (`pm2 stop freetierhunt-worker`)

#### Cumartesi (4 saat)

### Görev: Monitoring + first 100 products

1. PM2 logs: `pm2 logs freetierhunt-worker`
2. Scrape job'ı 6-8 kere çalışsın (günde toplam ~50 yeni ürün)
3. Supabase'de "products" tablosunu kontrol et
4. En az 100 ürün olmalı

### Bonus (eğer zaman varsa): PH'deki son 7 günün backfill'ini yap.

### Windsurf prompt'u

```typescript
Create worker/jobs/backfill-ph.ts:

Backfill Product Hunt data for the last 7 days.
Fetch each day's top 50 posts, process them all.
Add rate limiting: 10s between day fetches.
Output progress: "Day N/7: X posts processed"
Run once manually: pnpm tsx src/jobs/backfill-ph.ts
```

**Checklist:**
- [ ] 100+ ürün database'de
- [ ] Extraction queue dolmuş (~20-30 offer candidate)
- [ ] Oracle VM CPU %50'nin altında
- [ ] Backfill çalıştı (opsiyonel)

#### Pazar (2 saat)

**Görev:** Review + X post

> Week 3 ✅
> 🔌 Product Hunt API integrated
> 🤖 Cron job running every 30 min on Oracle VM
> 📊 100+ AI products indexed
> 🎯 Offer signal detection: 85% accuracy on sample
>
> Next: LLM extraction pipeline — turning Maker Comments into structured offers.
>
> #buildinpublic #llm #ai

### 🎯 Hafta 3 Teslim

- ✅ PH API bağlı, otomatik her 30 dk çekiyor
- ✅ Oracle VM'de PM2 ile worker çalışıyor
- ✅ 100+ ürün veritabanında
- ✅ Extraction queue dolmaya başlıyor

### ⚠️ Potansiyel Tuzaklar

- **OAuth token expiry:** 30 gün sonra refresh gerek. Cache mekanizmasına koy.
- **Timezone issues:** PH "today" UTC midnight. Kendi timezone'ına göre ayarlama yapma.
- **Rate limit hit:** Complexity budget'i agressive kullanma. 60% altında tut.

---

## HAFTA 4: LLM EXTRACTION PIPELINE

### 🎯 Ana Hedef

Maker's Comment'tan yapılandırılmış offer JSON'ı çıkarabilen ajan.

### 🎨 Küçük Zafer

Bir PH post'unun yorumunu gir → 3 farklı offer otomatik çıkıyor → database'de görünüyor.

### 📅 Günlük Breakdown

#### Pazartesi (3 saat)

**Görev:** Extractor prompt + golden set

50 manuel etiketli örnek hazırla. Bu eval set'in temeli olacak.

**`src/lib/llm/evals/golden-set.json`:**

```json
[
  {
    "id": "ph_001",
    "text": "Use code LAUNCH50 for 50% off first 3 months!",
    "expected": [{
      "type": "promo_code",
      "code": "LAUNCH50",
      "discount_pct": 50,
      "description": "50% off first 3 months",
      "confidence": 0.95
    }]
  },
  {
    "id": "ph_002",
    "text": "We offer a 14-day free trial for everyone, no credit card required.",
    "expected": [{
      "type": "free_trial",
      "trial_days": 14,
      "requires_credit_card": false,
      "confidence": 0.90
    }]
  },
  {
    "id": "ph_003",
    "text": "Thanks for checking us out! Let me know if you have questions.",
    "expected": []
  }
]
```

**Windsurf prompt'u:**

```typescript
Create src/lib/llm/extractors/offer-extractor.ts:

export async function extractOffers(params: {
  text: string;
  context?: {
    productName?: string;
    productUrl?: string;
    source?: string;
  };
}): Promise<ExtractionResult> {
  // 1. Regex pre-filter
  if (!hasOfferSignal(text)) {
    return { offers: [], skipped: true };
  }
  
  // 2. Call LLM with structured output
  const prompt = buildExtractionPrompt(text, context);
  const response = await llmRouter.chat({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt }
    ],
    response_format: 'json',
    temperature: 0.1,  // low for consistency
  });
  
  // 3. Validate with Zod
  const parsed = OfferExtractionSchema.safeParse(JSON.parse(response.content));
  if (!parsed.success) {
    logger.warn('Extraction validation failed', parsed.error);
    return { offers: [], error: 'validation_failed' };
  }
  
  // 4. Post-process
  return {
    offers: parsed.data.offers.map(o => ({
      ...o,
      extraction_method: 'llm',
      llm_model: response.model,
      extracted_from: text,
    })),
    metadata: {
      model: response.model,
      tokens: response.tokens,
    }
  };
}
```

**Tam sistem prompt'u (`src/lib/llm/prompts/extractor.ts`):**

```typescript
export const EXTRACTOR_SYSTEM_PROMPT = `
You are an expert at extracting promotional offers from SaaS/AI product launch content.

YOUR TASK:
Given a piece of text (usually a Product Hunt maker's comment or similar), 
extract ALL promotional offers mentioned. Return structured JSON.

RULES:
1. Extract ONLY explicit offers. Never infer.
2. Be STRICT about codes: only if literally stated as "code X" or similar.
3. Multiple offers in one text → return array.
4. No offers → return { "offers": [] }
5. Confidence reflects your certainty (not validity).

OFFER TYPES:
- "promo_code": Specific discount code to be used
- "free_trial": Time-limited free access
- "extended_trial": Longer than standard trial
- "student_discount": Requires student verification
- "startup_program": Requires startup/company verification
- "lifetime_deal": One-time payment for lifetime access
- "free_tier": Permanently free tier/plan
- "referral_credit": Credit for referring others
- "launch_special": Launch-week only deal

OUTPUT SCHEMA:
{
  "offers": [
    {
      "type": "promo_code" | "free_trial" | ...,
      "code": string | null,
      "title": string,
      "description": string,
      "discount_pct": number | null,
      "discount_flat": number | null,
      "trial_days": number | null,
      "currency": "USD",
      "requires_credit_card": boolean | null,
      "requires_student_verify": boolean | null,
      "conditions": string | null,
      "valid_until_hint": string | null,
      "confidence": number
    }
  ]
}

EXAMPLES:

Input: "Use code LAUNCH50 for 50% off first 3 months. No CC required!"
Output: {"offers":[{"type":"promo_code","code":"LAUNCH50","title":"50% off for 3 months","description":"Get 50% off your first 3 months with code LAUNCH50.","discount_pct":50,"requires_credit_card":false,"confidence":0.95}]}

Input: "Thanks for checking out our product!"
Output: {"offers":[]}

Input: "Free forever for students with .edu emails + 14-day Pro trial for everyone."
Output: {"offers":[
  {"type":"student_discount","title":"Free for students","description":"Students with .edu email get free forever access.","requires_student_verify":true,"confidence":0.90},
  {"type":"free_trial","trial_days":14,"title":"14-day Pro trial","description":"14-day free trial of Pro plan for everyone.","confidence":0.92}
]}

Now process the user's text. Return ONLY valid JSON.
`;
```

**Checklist:**
- [ ] 50 örnek golden set hazırlandı
- [ ] System prompt detaylı ve örneklerle dolu
- [ ] Zod schema validation çalışıyor

#### Salı (3 saat)

**Görev:** Extractor test + eval

**Windsurf prompt'u:**

```
Create src/lib/llm/evals/run-eval.ts:

Script that:
1. Loads golden-set.json
2. For each example, runs extractOffers(text)
3. Compares extracted vs expected:
   - True positive: correctly extracted offer
   - False positive: extracted non-existent offer
   - False negative: missed actual offer
   - Code accuracy: correct code extracted?
   - Type accuracy: correct type?
4. Computes:
   - Precision = TP / (TP + FP)
   - Recall = TP / (TP + FN)
   - F1 = 2*P*R / (P+R)
5. Prints summary:

Eval Results (n=50)
Precision: 0.89
Recall: 0.86
F1: 0.70
Code accuracy: 0.92
Type accuracy: 0.95
Avg tokens: 420
Avg latency: 850ms

6. Saves results to src/lib/llm/evals/results/YYYY-MM-DD.json

Run: npx tsx src/lib/llm/evals/run-eval.ts
```

**İlk target:** F1 >= 0.80 (MVP için yeterli)

**Checklist:**
- [ ] Eval script çalışıyor
- [ ] F1 score ≥ 0.80 ✅ / ❌
- [ ] Fail cases analiz edildi — hangi pattern'ler zor?

#### Çarşamba (3 saat)

**Görev:** Prompt iyileştirme (iterasyon)

Eval'de fail olan case'lere bak. Genelde şu tipler olur:

- *"Extra $5 credit for first signup"* → LLM bunu "promo_code" saydı ama "referral_credit"
- *"First 100 users get lifetime access"* → conditions'a "first 100" koymadı
- *"50% off early birds"* → discount_pct 50 ama "early birds" condition'a girmedi

**Prompt iyileştirme taktikleri:**
- Zor case'leri prompt'a örnek olarak ekle
- `<thinking>` bölümü ekle (Claude tarzı chain-of-thought)
- Post-processing ile fix edilebilecek şeyleri kod tarafına al

**Checklist:**
- [ ] Prompt iyileştirildi
- [ ] F1 score ≥ 0.70 ✅ (0.85 Week 7'de hedef)
- [ ] Regression: eski başarılı case'ler bozulmadı

#### Perşembe (3 saat)

**Görev:** Extraction worker job

**Windsurf prompt'u:**

```javascript
Create worker/jobs/extract-offers.ts:

export async function extractOffersJob() {
  // 1. Get pending items from extraction_queue (max 50 per run)
  const queue = await getExtractionQueue({ status: 'pending', limit: 50 });
  
  if (queue.length === 0) {
    console.log('[Extract] Queue empty');
    return;
  }
  
  console.log(`[Extract] Processing ${queue.length} items`);
  
  // 2. Process in parallel (5 concurrent to avoid rate limits)
  const results = await pMap(queue, async (item) => {
    try {
      const extraction = await extractOffers({
        text: item.text,
        context: { source: item.source }
      });
      
      // 3. Save offers to DB
      for (const offer of extraction.offers) {
        if (offer.confidence < 0.5) continue;
        
        await insertOffer({
          ...offer,
          product_id: item.product_id,
          source: item.source,
          source_url: item.source_url,
          extracted_from: item.text,
          status: offer.confidence >= 0.7 ? 'active' : 'pending_review',
        });
      }
      
      await markQueueItemProcessed(item.id, {
        offers_found: extraction.offers.length,
      });
      
      return { success: true, offers: extraction.offers.length };
    } catch (error) {
      await markQueueItemFailed(item.id, error.message);
      return { success: false, error };
    }
  }, { concurrency: 5 });
  
  const successful = results.filter(r => r.success).length;
  const totalOffers = results.reduce((sum, r) => sum + (r.offers || 0), 0);
  console.log(`[Extract] Done. ${successful}/${queue.length} succeeded. ${totalOffers} new offers.`);
}

Schedule in worker/index.ts: every 15 minutes
```

**Checklist:**
- [ ] Extract worker çalışıyor
- [ ] PH comment'larından gerçek offer'lar çıkarılıyor
- [ ] Low confidence olanlar "pending_review" statüsünde
- [ ] High confidence olanlar "active" statüsünde

**🔴 KRİTİK: LLM Cost Guard (Aylık Bütçe Koruması)**

> Groq quota dolduğunda router OpenAI'ya geçer (paid). Budget guard olmazsa ay sonunda sürpriz fatura. Validator + Content (Hafta 11) gibi başka LLM kullanıcıları da aynı budget'a tabi.

```typescript
// src/lib/llm/budget.ts
import { db } from '../db/client';
import { llmCalls } from '../db/schema';
import { gte, sum, sql } from 'drizzle-orm';
import { startOfMonth } from 'date-fns';
import { logger } from '../logger';

const MONTHLY_LIMIT_USD = 5;        // OpenAI fallback için aylık limit
const SOFT_LIMIT_USD = 4;           // Soft alarm threshold
const HARD_LIMIT_USD = 5;           // Hard stop

let cachedUsage: { value: number; checkedAt: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 dk cache (her call'da DB sorgusu YAPMA)

export async function getMonthlyLLMCost(): Promise<number> {
  if (cachedUsage && Date.now() - cachedUsage.checkedAt < CACHE_TTL_MS) {
    return cachedUsage.value;
  }
  
  const monthStart = startOfMonth(new Date());
  const result = await db
    .select({ total: sum(llmCalls.costUsd) })
    .from(llmCalls)
    .where(gte(llmCalls.createdAt, monthStart));
  
  const total = Number(result[0]?.total ?? 0);
  cachedUsage = { value: total, checkedAt: Date.now() };
  return total;
}

export class BudgetExhaustedError extends Error {
  constructor(public used: number, public limit: number) {
    super(`LLM budget exhausted: $${used.toFixed(2)} / $${limit}`);
    this.name = 'BudgetExhaustedError';
  }
}

export async function checkLLMBudget(provider: string): Promise<void> {
  // Groq + OpenRouter free tier'lar budget'a counted DEĞİL (cost_usd = 0)
  // Sadece OpenAI (paid) bütçeyi etkiler.
  if (provider === 'groq' || provider === 'openrouter') return;
  
  const used = await getMonthlyLLMCost();
  
  if (used >= HARD_LIMIT_USD) {
    logger.error({ used, limit: HARD_LIMIT_USD }, '[LLM Budget] Hard limit reached');
    throw new BudgetExhaustedError(used, HARD_LIMIT_USD);
  }
  
  if (used >= SOFT_LIMIT_USD) {
    logger.warn({ used, limit: SOFT_LIMIT_USD }, '[LLM Budget] Soft alarm — Groq/OpenRouter only');
    // Discord webhook ile alert (Hafta 1'de hazır)
    // await sendDiscordAlert(`⚠️ LLM cost: $${used} / $${HARD_LIMIT_USD}`);
  }
}

// Router'da her call öncesi:
// llm/router.ts içinde:
//   if (provider === 'openai') await checkLLMBudget('openai');
```

**Worker'da kullanım:**
```typescript
// worker/jobs/extract-offers.ts içinde:
import { BudgetExhaustedError } from '../../src/lib/llm/budget';

try {
  const extraction = await extractOffers({...});
} catch (error) {
  if (error instanceof BudgetExhaustedError) {
    logger.error('[Extract] Budget exhausted, stopping batch');
    return;  // Tüm batch'i durdur, ay sonuna kadar bekle
  }
  // ...
}
```

**Admin Dashboard'da (Hafta 9):**
- `/admin/costs` — günlük/aylık LLM cost grafiği
- Budget alert threshold'unu UI'dan ayarla

#### Cuma (3 saat)

**Görev:** OpenClaw entegrasyonu (agent wrapper)

**Windsurf prompt'u:**

```
Add OpenClaw as a provider option in src/lib/llm/router.ts:

Provider: OpenClaw
- Endpoint: process.env.OPENCLAW_URL (default http://localhost:8080)
- Auth: Bearer token (OPENCLAW_API_KEY)
- Models: Whatever is configured in OpenClaw (ChatGPT Business, NIM models)

Use OpenClaw for agent-like tasks:
- Submission validation (Week 9)
- Content generation (Week 11)
- Freshness checks (Week 13+)

For regular extraction, still use Groq → OpenRouter → OpenAI direct.

Add a new function: runAgent(agentName: string, input: any)
This uses OpenClaw's agent execution API rather than raw chat.
```

**Checklist:**
- [ ] OpenClaw bağlantısı çalışıyor
- [ ] Test: basit bir chat request OpenClaw'a gidiyor
- [ ] Fallback: OpenClaw down ise direct providers kullanılıyor

#### Cumartesi (4 saat)

**Görev:** Backfill extraction

Hafta 3'te PH'den gelen tüm comment'ları extract et.

```
Create worker/jobs/backfill-extraction.ts:

Process all extraction_queue items with status='pending' in batches of 50.
Run until queue is empty.
Print progress every batch.
Expected result: ~50-200 new offers added to DB.
```

**Checklist:**
- [ ] 50+ yeni offer eklendi
- [ ] Manuel spot-check yapıldı
- [ ] False positive rate < %15

#### Pazar (2 saat)

**Görev:** Review + X post

> Week 4 ✅
> 🧠 LLM extraction pipeline live
> 🎯 F1 score: 0.70 on golden set (iteration continues to Week 7)
> 📊 200+ active offers extracted automatically
> 💰 Groq free tier handling 95% of requests (zero cost)
>
> The magic: PH maker comment → structured JSON in 800ms.
>
> Next: Frontend time. Landing page + product pages.
>
> #buildinpublic #llm

### 🎯 Hafta 4 Teslim

- ✅ LLM extractor F1 ≥ 0.70 (baseline established)
- ✅ Worker her 15 dakikada çalışıyor
- ✅ 200+ aktif offer otomatik çıkarıldı
- ✅ OpenClaw entegrasyonu hazır

### ⚠️ Potansiyel Tuzaklar

- **LLM inconsistency:** Temperature 0.1 kullan, stabil olsun.
- **JSON parsing errors:** Her zaman try-catch, retry 1x sonra skip.
- **Duplicate offers:** Aynı kod + aynı product → upsert (unique index).
- **Groq rate limit:** 30 req/dk → parallel 5 ile güvendesin.

---

## HAFTA 5: FRONTEND SCAFFOLD

### 🎯 Ana Hedef

Landing page + product page + "today's top 10" feed görünür hale gelsin.

### 🎨 Küçük Zafer

Tarayıcıda `freetierhunt.com`'a gir → gerçek veri gör → scroll et → bir ürüne tıkla → offer listesini gör.

### 📅 Günlük Breakdown

#### Pazartesi (3 saat)

**Görev:** Shadcn/ui setup + design tokens

**Windsurf prompt'u:**

```
In the Next.js app, set up shadcn/ui with brutal design customization:

1. Run: npx shadcn@latest init
2. Config:
   - Style: new-york (minimal)
   - Base color: yellow
   - CSS variables: yes
3. Install components we'll need:
   - button, card, input, badge, table, 
   - dialog, dropdown-menu, select, tabs, sheet

4. Override CSS in src/app/globals.css for brutal style:
   - All borders: 2px solid black
   - Border-radius: 0px (override shadcn defaults)
   - Box-shadow: "4px 4px 0px #000000" on cards/buttons
   - Hover: translate(-2px, -2px) + shadow 6px 6px
   - Active: translate(0, 0) + shadow 2px 2px

5. Define utility classes:
   - .brutal-card
   - .brutal-btn
   - .brutal-input
   - .brutal-badge

6. Update tailwind.config.ts:
   colors: {
     brand: {
       yellow: '#FFD700',
       black: '#000000',
       green: '#00FF41',
       orange: '#FF6600',
       red: '#FF0000'
     }
   },
   fontFamily: {
     mono: ['IBM Plex Mono', 'monospace'],
     sans: ['Inter', 'sans-serif']
   }
```

**Checklist:**
- [ ] shadcn/ui kuruldu
- [ ] Brutal style override çalışıyor
- [ ] Test button: `<Button>Click me</Button>` → brutal görünüyor

#### Salı (3 saat)

**Görev:** Landing page — "Today's Top 10" feed

**Windsurf prompt'u:**

```
Create src/app/page.tsx (home page) with this layout:

Header section:
- Large logo text "FREETIERHUNT 🏹" (IBM Plex Mono bold, 48px)
- Tagline: "Find free credits, trials, and promo codes for AI tools"
- Live stat: "This week community saved: $X,XXX"
- Signup CTA: "Get weekly digest → [email input] [Subscribe →]"

Filter bar:
- Tabs: [🔥 TODAY] [📅 WEEK] [📈 ALL TIME]
- Dropdowns: [CATEGORY ▼] [OFFER TYPE ▼] [DISCOUNT ▼]

Feed table (brutal style):
- Columns: # | PRODUCT | OFFER | TRUST | ACTION
- Each row: 
  - Rank number
  - Product logo (32x32) + name + short tagline
  - Offer badge (emoji + type) + short description
  - Trust bar (████░ format, 5 blocks)
  - Action button: "[USE CODE]" or "[CLAIM →]" or "[VERIFY]"
- 10 rows
- "Show more" button at bottom

Fetch data from /api/offers/today

Make mobile responsive:
- Mobile: transform table rows into stacked cards
- Show filter as bottom sheet
```

**Checklist:**
- [ ] Landing page yüklenebilir durumda
- [ ] Gerçek data gösteriyor (10 offer)
- [ ] Responsive çalışıyor
- [ ] Brutal hissiyat var

#### Çarşamba (3 saat)

**Görev:** Product detail page

**Windsurf prompt'u:**

```
Create src/app/products/[slug]/page.tsx:

Layout:
- Breadcrumb: Home > Products > [name]
- Product header:
  - Logo (64x64)
  - Name (large)
  - Tagline
  - Categories (as badges)
  - Website link (external)
- Stats row: "Launched on PH: date | Upvotes: X | First seen: date"

Active offers section (main content):
- Title: "🎁 Active Offers (X)"
- Grid of offer cards (2 columns on desktop, 1 on mobile)
- Each offer card:
  - Type badge (color-coded by type)
  - Title (bold)
  - Description
  - Code (if applicable, monospace, copy-to-clipboard button)
  - Discount/trial info (large, prominent)
  - Trust score bar
  - "Verified X days ago" or "Last checked X days ago"
  - "Does it work?" 👍/👎 buttons
  - "Get offer →" button

Below: "Related products" — 3 similar products (same categories)

Use generateMetadata for SEO:
- Title: "{name} Free Credits, Trials & Promo Codes | FreeTierHunt"
- Description: "Save up to X% on {name}. {N} verified offers updated daily."
- OG image: dynamic via /api/og/product/[slug]

Fetch data via server component (direct Drizzle query).

**🔴 KRİTİK: Server/Client Component Mimari Kuralları**

```typescript
// VARSAYILAN: Server Component (no 'use client')
// - SEO optimal (HTML SSR)
// - Direct DB query
// - No JS bundle to client

// CLIENT'a sadece şunlar:
'use client';  // Sadece bu durumlarda:
// - Forms (onChange, onSubmit)
// - Modals (state management)
// - Real-time updates (websocket)
// - Browser APIs (localStorage, Cmd+K)

// Pattern: Server parent + Client child
// app/products/[slug]/page.tsx (Server)
//   ├── ProductHeader (Server)
//   │   └── ProductName (Server)
//   │       └── EditProductName (Client) ← interactive
//   ├── OfferList (Server)
//   │   └── OfferCard (Server)
//   │       ├── OfferTitle (Server)
//   │       │   └── EditOfferTitle (Client) ← interactive
//   │       └── OfferDescription (Server)
//   │           └── EditOfferDescription (Client) ← interactive
//   └── ReportModal (Client) ← state
```

**🔴 KRİTİK: ISR (Incremental Static Regeneration)**

500 product page'i her request'te DB'den çekersek:
- 100ms × 500 = SEO yavaş, pahalı
- Vercel function invocation limitlerini doldurur

**Çözüm:**
```typescript
// app/products/[slug]/page.tsx
export const revalidate = 3600; // 1 saat cache (yeni data 1 saatte bir)
export const dynamicParams = true; // Yeni slug'lar dynamic, eskiler cached

export async function generateStaticParams() {
  // Build time'da top 100 product'ı static generate
  const top = await db.select({ slug: products.slug })
    .from(products)
    .orderBy(desc(products.viewsCount))
    .limit(100);
  return top.map(p => ({ slug: p.slug }));
}

// app/page.tsx (homepage)
export const revalidate = 300; // 5 dk cache (today's deals değişebilir)

// Real-time data needed? Use Server Actions or revalidatePath()
```

**On-demand revalidation (worker yeni offer eklediğinde):**
```typescript
// Worker'dan webhook tetikle
await fetch(`${process.env.SITE_URL}/api/revalidate`, {
  method: 'POST',
  headers: { 'x-revalidate-token': process.env.REVALIDATE_SECRET },
  body: JSON.stringify({ paths: [`/products/${slug}`, '/'] })
});

// app/api/revalidate/route.ts
export async function POST(req: Request) {
  if (req.headers.get('x-revalidate-token') !== process.env.REVALIDATE_SECRET) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }
  const { paths } = await req.json();
  for (const path of paths) revalidatePath(path);
  return Response.json({ revalidated: paths });
}
```

**Image Remote Pattern (next.config.js):**
```typescript
// Logo'lar PH/IH'den geliyor, remote pattern olmadan optimize edilmez
module.exports = {
  images: {
    remotePatterns: [
      { hostname: 'ph-files.imgix.net' },
      { hostname: '*.indiehackers.com' },
      { hostname: '*.supabase.co' }
    ]
  }
};
```

**Checklist:**
- [ ] Product detail sayfası çalışıyor
- [ ] Offer cards güzel görünüyor
- [ ] Copy-to-clipboard çalışıyor
- [ ] SEO metadata OK
- [ ] Server/Client component mimarı kuruldu
- [ ] ISR (Incremental Static Regeneration) kuruldu
- [ ] Mobile responsive

#### Perşembe (3 saat)

**Görev:** Global search

**Windsurf prompt'u:**

```
Create a global search component (Client Component, Cmd+K modal):

1. Header'a search icon ekle
2. Click → full-screen modal açılsın (Cmd+K / Ctrl+K shortcut)
3. Modal içinde:
   - Büyük input field (autofocus)
   - Placeholder: "Search 500+ AI tools..."
   - Instant results:
     - Products (top 5)
     - Offers (top 5)
     - Categories (top 3)
   - Keyboard navigation (up/down arrows)
   - Enter → navigate to result
   - Esc → close

🔴 KRİTİK: Race condition koruması (B28)
   - Debounce 300ms (lodash.debounce veya use-debounce)
   - AbortController: yeni search → önceki request'i iptal
   - Loading state ayrı (debouncing vs fetching)
   - Empty result + error state ayrı

Implementation pattern:
'use client';
import { useEffect, useRef, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController>();
  
  const debouncedSearch = useDebouncedCallback(async (q: string) => {
    if (q.length < 2) { setResults(null); return; }
    
    // Cancel previous request
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
        signal: abortRef.current.signal
      });
      if (!res.ok) throw new Error('Search failed');
      setResults(await res.json());
    } catch (err) {
      if (err.name !== 'AbortError') console.error(err);
    } finally {
      setLoading(false);
    }
  }, 300);
  
  useEffect(() => () => abortRef.current?.abort(), []);  // cleanup on unmount
  
  return (...); // brutal modal UI
}

API: /api/search?q= (combined products+offers+categories endpoint)
- Drizzle full-text query (search_vector @@ plainto_tsquery)
- Cache 5 min for popular queries (Cloudflare CDN: Cache-Control: s-maxage=300)
- Rate limit: 30 req/min per IP (search abuse protection)
```

**Supabase full-text search:**

```sql
ALTER TABLE products ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(tagline, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'C')
  ) STORED;

CREATE INDEX products_search_idx ON products USING GIN(search_vector);
```

**Checklist:**
- [ ] Search modal çalışıyor (Cmd+K)
- [ ] Instant results < 500ms
- [ ] Keyboard navigation çalışıyor
- [ ] Arama kalitesi OK

#### Cuma (3 saat)

**Görev:** Filter & category pages

**Windsurf prompt'u:**

```
Create src/app/categories/[slug]/page.tsx:

Category page (e.g., /categories/ai-coding):
- Breadcrumb
- Category header: "AI Coding Tools"
- Subcategory badges (if any)
- Filter bar (same as home but applied to category)
- Product grid with offers

Also create:
- /offers/promo-codes — all promo code offers
- /offers/free-trials — all trial offers
- /offers/student-discounts — all student offers
- /offers/lifetime-deals — all LTD offers

Each with proper SEO (long-tail keywords):
- "Free AI Coding Tools & Discounts 2026"
- "AI Promo Codes — Updated Weekly"

Use dynamic metadata per page.
```

**Checklist:**
- [ ] Category pages çalışıyor
- [ ] Offer type filter pages çalışıyor
- [ ] Her sayfanın unique SEO metadata'sı var

#### Cumartesi (4 saat)

**Görev:** Empty states, loading states, error handling

**Windsurf prompt'u:**

```
Polish the app with proper UX states:

1. Loading skeletons for:
   - Offer cards (gray blocks with pulse animation)
   - Product detail
   - Search results

2. Empty states:
   - "No offers found for this category yet — submit one!" + CTA
   - "Search returned no results — try different keywords"
   - "No active offers for this product — this product has free tier"

3. Error boundaries:
   - Wrap layout in <ErrorBoundary>
   - Show brutal-style error: "Something broke. We logged it. Try refresh."
   - Sentry integration

4. 404 page:
   - /not-found.tsx
   - "Lost? 🏹 Let's find you some deals."
   - Search + popular categories

All states should match brutal design.
```

**Checklist:**
- [ ] Loading states var
- [ ] Empty states var
- [ ] Error boundary çalışıyor
- [ ] 404 sayfa var

#### Pazar (2 saat)

**Görev:** Performance + Lighthouse audit

- Lighthouse test çalıştır (Chrome DevTools)
- Target: Performance 90+, SEO 100
- Fix edilmesi gerekenler:
  - Image optimization (`next/image`)
  - Font preload
  - Critical CSS
  - Remove unused JS

> Week 5 ✅
> 🎨 Landing page + 500+ product pages live
> 🔍 Search working (Cmd+K)
> 📱 Mobile responsive
> ⚡ Lighthouse: 94 performance, 100 SEO
>
> Next: More data sources + user accounts.
>
> Try it: freetierhunt.com (still beta, UI rough)
>
> #buildinpublic

### 🎯 Hafta 5 Teslim

- ✅ Landing page production-ready
- ✅ 500+ product detail pages çalışıyor
- ✅ Search çalışıyor
- ✅ Category/filter pages var
- ✅ Lighthouse 90+
- ✅ Mobile responsive

---

## HAFTA 6: CORE UI & SEARCH İYİLEŞTİRMELERİ

### 🎯 Ana Hedef

UI'ı cilalayıp gerçekten "production-ready" hale getirmek + Meilisearch entegrasyonu.

### 📅 Günlük Breakdown

#### Pazartesi (3 saat)

**Görev:** Meilisearch kurulum (Oracle VM)

```bash
# Oracle VM'de:
docker run -d --restart unless-stopped \
  --name meilisearch \
  -p 7700:7700 \
  -v $(pwd)/meili_data:/meili_data \
  -e MEILI_MASTER_KEY="your-secret-key" \
  -e MEILI_ENV="production" \
  getmeili/meilisearch:latest
```

**Windsurf prompt'u:**

```
Create packages/search/src/index.ts with Meilisearch client:

1. Setup: MeiliSearch client connecting to MEILISEARCH_URL
2. Create indexes:
   - products (searchable: name, tagline, description, categories)
   - offers (searchable: title, description, code, type)
3. Functions:
   - indexProduct(product)
   - indexOffer(offer)
   - searchProducts(query, filters): Promise<Product[]>
   - searchOffers(query, filters): Promise<Offer[]>
   - reindexAll() — nuclear option
4. Create a worker job that syncs DB → Meilisearch every 5 min

Replace the home page search and product search with Meilisearch.
Should be <50ms response time.
```

**Checklist:**
- [ ] Meilisearch çalışıyor Oracle'da
- [ ] Products indexed (500+)
- [ ] Offers indexed
- [ ] Search speed < 100ms

#### Salı-Cuma (12 saat) — Polish Haftası

**Salı:** UI micro-interactions
- Button hover animations
- Loading spinners
- Toast notifications (sonner library)
- Copy-to-clipboard feedback

**Çarşamba:** Dark mode toggle (FOWT-free)
- Ama brutal'ı koru. Dark: siyah arkaplan + sarı text
- 🔴 **next-themes** kullan — SSR'da theme bilinmez, ilk paint'te yanlış renk (FOWT) görünür. Manual `useEffect`+`localStorage` BÖYLE bir bug yaratır.

```bash
pnpm add next-themes
```

```typescript
// app/layout.tsx (Server Component)
import { ThemeProvider } from 'next-themes';
export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

// components/ThemeToggle.tsx ('use client')
import { useTheme } from 'next-themes';
const { theme, setTheme } = useTheme();
// Dark = siyah bg + sarı text, Light = sarı bg + siyah text (brutal style preserved)
```

- Tailwind config: `darkMode: 'class'` + `dark:` variants
- Theme persistence (localStorage, next-themes otomatik)
- System preference detection (defaultTheme="system")
- 🟡 **Kritik:** `<html suppressHydrationWarning>` zorunlu (next-themes class'ı server'da bilinmediği için)

**Perşembe:** OG image generator + Cloudflare cache
- Dynamic OG images: `/api/og/product/[slug]`
- Next.js built-in `ImageResponse` (Edge runtime)
- Per-product unique images
- 🔴 **Edge runtime + Drizzle uyumsuz**: Postgres connection edge'de çalışmaz. Çözüm: pre-fetch metadata Server Component'te → query string olarak geçir → OG route sadece formatla.

```typescript
// app/products/[slug]/page.tsx (Server Component)
export async function generateMetadata({ params }) {
  const product = await getProduct(params.slug);
  const ogParams = new URLSearchParams({
    name: product.name,
    offers: String(product.activeOffersCount),
    saving: String(product.maxDiscount ?? 0)
  });
  return {
    openGraph: {
      images: [{ url: `/api/og/product?${ogParams}`, width: 1200, height: 630 }]
    }
  };
}

// app/api/og/product/route.ts (Edge runtime — DB query YAPMA)
import { ImageResponse } from 'next/og';
export const runtime = 'edge';
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get('name') ?? 'FreeTierHunt';
  const offers = searchParams.get('offers') ?? '0';
  // Sadece args ile render (DB yok!)
  return new ImageResponse(
    <div style={{...brutalStyle}}>{name} • {offers} offers</div>,
    { width: 1200, height: 630 }
  );
}
```

- **🔴 Cloudflare cache zorunlu** (Vercel free tier 100GB bandwidth fast yer):
  - `Cache-Control: public, s-maxage=86400, stale-while-revalidate=604800`
  - Cloudflare Page Rules: `*/api/og/*` → Cache Everything, Edge TTL 1 month

**Cuma:** Sitemap + RSS feed
- `sitemap.xml` (all products, all offers)
- `feed.xml` (RSS for "today's deals")
- `robots.txt`

#### Cumartesi (4 saat)

**Görev:** "Tasarruf hesabı" feature

**Windsurf prompt'u:**

```
Add a savings calculator feature:

1. Each offer stores estimated_value_usd (how much user could save)
2. When user clicks "Used this!" on offer:
   - Increment user.total_saved_usd
   - Show toast: "Nice! You saved $$X. Total savings: $$Y"
3. Homepage header shows:
   - "This month community saved: $X,XXX"
   - Updates real-time (or cached 5min)
4. User dashboard shows:
   - "Your total savings: $X"
   - Breakdown by category
   - Monthly chart

For initial estimated_value_usd:
- Promo code X% off → product.monthly_price * X/100 * 3 months
- Free trial N days → product.monthly_price * (N/30)
- Student discount → full monthly_price
- Lifetime deal → monthly_price * 24 (2 year value)

Store product.monthly_price as a new field (manual entry for now).
```

**Checklist:**
- [ ] Savings tracking çalışıyor
- [ ] Homepage live stat var
- [ ] User dashboard gösterimi var

#### Pazar (2 saat)

> Week 6 ✅
> ⚡ Meilisearch: 40ms search
> 🎨 UI polished: dark mode, animations, toasts
> 💰 Savings calculator: track your $$$
> 🗺️ SEO: sitemap, RSS, OG images
>
> Self-use stats: I've tracked $47 saved this month using my own tool 😂
>
> #buildinpublic

---

## HAFTA 7: INDIE HACKERS + ENRICHMENT

### 🎯 Ana Hedef

İkinci veri kaynağı (Indie Hackers) + Firecrawl ile ürün zenginleştirme.

### 📅 Günlük Breakdown

#### Pazartesi-Salı (6 saat)

**Görev:** IH RSS scraper

**Windsurf prompt'u:**

```
Create src/lib/scrapers/indiehackers/:

1. rss-fetcher.ts:
   - Fetch RSS feeds: show-ih.rss, launched.rss, growth.rss
   - Parse with rss-parser library
   - Return array of IH posts with: title, link, description, pubDate, guid

2. post-fetcher.ts:
   - Given post URL, fetch HTML
   - Parse with cheerio
   - Extract: full body, author, external links, mentioned tools
   - Respectful: 2s delay between fetches, User-Agent header

3. pipeline.ts:
   - Similar to PH pipeline
   - Match IH posts to existing products by domain
   - Queue for offer extraction

Cron: every 60 minutes
```

#### Çarşamba-Perşembe (6 saat)

**Görev:** Firecrawl pricing page enrichment

**Windsurf prompt'u:**

```
Create src/lib/scrapers/firecrawl/:

1. client.ts: Firecrawl API wrapper with credit tracking
2. pricing-extractor.ts:
   - Given a product URL, find /pricing or /plans page
   - Firecrawl scrape (1 credit)
   - LLM extract:
     - Free tier details
     - Paid tier prices
     - Features by tier
     - Any discounts/trials mentioned
   - Return structured pricing data

Cron job: enrich-pricing.ts
- Runs daily
- Picks 16 products/day (480/ay - free tier 500'ün altında)
- Enriches them
- Tracks Firecrawl credit usage (log to DB)

**🔴 KRİTİK: Firecrawl 500 Credit Budget Koruması**

```typescript
// src/lib/scrapers/firecrawl/budget.ts
const MONTHLY_LIMIT = 500;
const SAFETY_MARGIN = 50;  // 450'de stop
const DAILY_TARGET = 16;   // 480/ay

export async function checkFirecrawlBudget(): Promise<{
  allowed: boolean;
  used: number;
  remaining: number;
}> {
  const monthStart = startOfMonth(new Date());
  const used = await db
    .select({ count: count() })
    .from(firecrawlUsage)
    .where(gte(firecrawlUsage.createdAt, monthStart));
  
  const remaining = MONTHLY_LIMIT - used - SAFETY_MARGIN;
  
  if (remaining <= 0) {
    // Sentry alert + email
    await alertBudgetExhausted('firecrawl', used);
    return { allowed: false, used, remaining };
  }
  
  return { allowed: true, used, remaining };
}

// Pricing extractor önce budget'i kontrol etmeli:
export async function enrichPricing(productId: string) {
  const budget = await checkFirecrawlBudget();
  if (!budget.allowed) {
    logger.warn('[Firecrawl] Budget exhausted, fallback to HTTP+cheerio');
    return await httpFallback(productId);  // free
  }
  
  return await firecrawlScrape(productId);
}
```

**Fallback Chain:**
1. **HTTP fetch + cheerio** (free, basit pricing pages için)
2. **Firecrawl** (JS render gerekirse, budget izin verirse)
3. **LLM extraction** (HTML'i parse edemiyorsa)

**Budget Tracking Tablosu (Hafta 2'ye eklenmeli):**
```typescript
export const firecrawlUsage = pgTable('firecrawl_usage', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').references(() => products.id),
  url: text('url').notNull(),
  credits: integer('credits').default(1),
  success: boolean('success').default(true),
  createdAt: timestamp('created_at').defaultNow()
});
```

#### Cuma (3 saat)

**Görev:** Cross-source deduplication

Aynı ürün PH'de de IH'de de olabiliyor. Domain match ile dedup.

#### Cumartesi-Pazar (6 saat)

Review + blog post: *"I built a Firecrawl-powered pricing tracker"*

---

## HAFTA 8: AUTH & USER DASHBOARD

### 🎯 Ana Hedef

Kullanıcılar kayıt olabilsin, offer'ları kaydedebilsin, savings tracklesin.

### 📅 Günlük Breakdown

#### Pazartesi (3 saat)

**Görev:** Supabase Auth UI (Magic Link + OTP backup)

> **🔴 KRİTİK Mobil UX Sorunu:** Magic link mobile'da kötü çalışır. User Safari'de email girer → Mail app'a geçer → link Chrome'da açılır → session başka browser'da → unauthorized.
>
> **Çözüm:** Magic link **+ 6 haneli OTP** kombinasyonu (Supabase Auth bunu destekler).

**Windsurf prompt'u:**

```
Integrate Supabase Auth with magic link + OTP backup:

1. src/app/login/page.tsx
   - Email input
   - "Send magic link + code" button
   - signInWithOtp({ email, options: { shouldCreateUser: true } })
   - Sonrasında iki seçenek göster:
     a) "Check your email for magic link"
     b) OTP input (6 digit) — "Or paste the code from email"

2. src/app/auth/callback/route.ts
   - Handle magic link callback (token in URL)
   - Create user row in public.users (trigger on auth.users insert)
   - Redirect to /dashboard

3. src/app/login/verify/page.tsx (OTP fallback)
   - 6 digit input (numeric)
   - verifyOtp({ email, token, type: 'email' })
   - Redirect to /dashboard

4. Middleware for protected routes:
   - /dashboard, /saved, /alerts → require auth
   - Redirect to /login if not authenticated

5. UserMenu component (header):
   - If not auth: "Sign in" button
   - If auth: Avatar + dropdown: Dashboard, Saved, Settings, Logout

All brutal style.
```

**Supabase Email Template Configuration:**
```
# Dashboard → Authentication → Email Templates → Magic Link
# Subject: "Sign in to FreeTierHunt"
# Body üst kısmı:
#   Click here to sign in: {{ .ConfirmationURL }}
#   Or use code: {{ .Token }}  ← OTP fallback
```

**⚠️ Resend domain verification (DKIM/SPF):**
- Resend dashboard → Add Domain → freetierhunt.com
- Cloudflare DNS'e DKIM, SPF, MX kayıtlarını ekle
- Verify edilmeden mail spam'e düşer

#### Salı (3 saat)

**Görev:** User dashboard

**Windsurf prompt'u:**

```
Create src/app/dashboard/page.tsx:

Layout (server component, auth required):
- Welcome: "Hey {name}, here's your stack"
- Stats row:
  - Total saved: $X
  - Saved offers: N
  - Active alerts: M
- Saved offers list (paginated)
- Recent activity feed:
  - "You saved ElevenLabs offer (\$29/mo)" 3 days ago
  - "Cursor offer you saved was just verified"
- Suggested offers (based on saved categories)
```

#### Çarşamba (3 saat)

**Görev:** Save/unsave offer + "Mark as used"

**Windsurf prompt'u:**

```
Add interactive offer actions:

1. Save button on offer cards:
   - Server action: saveOffer(offerId)
   - Toast: "Saved to your dashboard"
   - Heart icon filled when saved

2. "Mark as used" in dashboard:
   - Prompts for feedback: "Did it work?" Yes/No
   - If yes: increment user.total_saved_usd by offer.estimated_value
   - Updates offer.works_count or doesnt_work_count
   - Increases offer.trust_score

3. Unsave action

Server actions in src/app/actions/offers.ts
Zod validation for all inputs
```

#### Perşembe (3 saat)

**Görev:** Email digest system

**Windsurf prompt'u:**

```typescript
Create email digest with Resend:

1. Email template (React Email):
   - src/emails/weekly-digest.tsx
   - Header: "Your weekly AI deals digest"
   - Sections:
     - "New this week" (top 5 offers)
     - "Expiring soon" (offers ending in 7 days)
     - "Based on your interests" (category match)
     - "Community stats"
   - Footer: unsubscribe link (JWT signed)

2. Worker job: worker/jobs/send-digest.ts
   - Cron: every Monday 10:00 UTC
   - 100 email/day free tier respect (chunk over multiple days)

3. Preferences page: /settings
   - Digest frequency: daily/weekly/never
   - Categories of interest
   - Email verified status
```

**🔴 KRİTİK: Resend 100 Mail/Gün Limit Stratejisi**

```typescript
// worker/jobs/send-digest.ts
import { Resend } from 'resend';
import { adminDb } from '../db/admin-client';
import { sleep } from '../utils';

const resend = new Resend(process.env.RESEND_API_KEY);
const DAILY_LIMIT = 100;
const BATCH_SIZE = 90;       // safety margin
const RATE_DELAY_MS = 1100;  // 10 mail/sec rate limit + margin

export async function sendWeeklyDigest() {
  // Sadece email verified + digest aktif kullanıcılar
  const users = await adminDb.query.users.findMany({
    where: and(
      eq(users.emailDigestFrequency, 'weekly'),
      isNotNull(users.emailVerifiedAt)
    )
  });
  
  if (users.length > BATCH_SIZE) {
    logger.warn(`[Digest] ${users.length} users > ${BATCH_SIZE} daily limit. Çoklu güne yayılacak.`);
  }
  
  // Bu gün için batch al
  const todayBatch = users.slice(0, BATCH_SIZE);
  let sent = 0;
  let failed = 0;
  
  for (const user of todayBatch) {
    try {
      const offers = await getDigestOffers(user);
      if (offers.length === 0) continue;  // Boş digest gönderme
      
      await resend.emails.send({
        from: 'FreeTierHunt <hello@freetierhunt.com>',
        to: user.email,
        subject: `${offers.length} new AI deals this week`,
        react: WeeklyDigest({ user, offers }),
        headers: {
          'List-Unsubscribe': `<https://freetierhunt.com/unsubscribe?token=${signToken(user.id)}>`
        }
      });
      
      sent++;
      await sleep(RATE_DELAY_MS);
    } catch (error) {
      failed++;
      logger.error('[Digest] Send failed', { userId: user.id, error });
      
      // Bounce/spam complaint handling
      if (error.message?.includes('bounce') || error.message?.includes('complaint')) {
        await markEmailBounced(user.id);
      }
    }
  }
  
  logger.info(`[Digest] Sent: ${sent}, Failed: ${failed}, Skipped: ${users.length - todayBatch.length}`);
}
```

**Bounce + Unsubscribe Webhook (signed verification ile):**

> **🔴 KRİTİK:** Webhook signature verify edilmezse, attacker spoof'lu bir POST ile DB'yi manipüle edebilir (örn: rakip kullanıcıların email'lerini "bounced" olarak işaretleyebilir). Resend Svix kullanır.

```bash
pnpm add svix
```

Resend Dashboard → Webhooks → Add Endpoint → `https://freetierhunt.com/api/webhooks/resend`  
Resend "Signing Secret" verir → `RESEND_WEBHOOK_SECRET` env'e ekle.

```typescript
// src/app/api/webhooks/resend/route.ts
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { db } from '@/lib/db/client';
import { users, digestLog } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';

export async function POST(req: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    logger.error('[Resend Webhook] RESEND_WEBHOOK_SECRET not configured');
    return Response.json({ error: 'misconfigured' }, { status: 500 });
  }
  
  const payload = await req.text();
  const hdrs = await headers();
  const svixHeaders = {
    'svix-id': hdrs.get('svix-id') ?? '',
    'svix-timestamp': hdrs.get('svix-timestamp') ?? '',
    'svix-signature': hdrs.get('svix-signature') ?? ''
  };
  
  let event: any;
  try {
    const wh = new Webhook(secret);
    event = wh.verify(payload, svixHeaders);  // 🔴 Throws on invalid signature
  } catch (err) {
    logger.warn({ err }, '[Resend Webhook] Invalid signature');
    return Response.json({ error: 'invalid signature' }, { status: 401 });
  }
  
  // Event types: https://resend.com/docs/dashboard/webhooks/event-types
  const recipient = event.data?.to?.[0] ?? event.data?.to;
  
  switch (event.type) {
    case 'email.bounced':
    case 'email.complained':
      // Hard bounce veya spam complaint → bu user'a artık mail YOK
      await db.update(users)
        .set({ emailVerifiedAt: null, emailDigestFrequency: 'never' })
        .where(eq(users.email, recipient));
      logger.info({ recipient, type: event.type }, '[Resend] User opted out');
      break;
      
    case 'email.opened':
      // digest_log'a kaydet (analytics + idempotency)
      if (event.data?.email_id) {
        await db.update(digestLog)
          .set({ openedAt: new Date(event.created_at) })
          .where(eq(digestLog.emailId, event.data.email_id));
      }
      break;
      
    case 'email.clicked':
      if (event.data?.email_id) {
        await db.update(digestLog)
          .set({ clickedAt: new Date(event.created_at) })
          .where(eq(digestLog.emailId, event.data.email_id));
      }
      break;
      
    case 'email.delivered':
      // No-op: optimistic update yapma, opened/clicked daha değerli
      break;
      
    default:
      logger.debug({ type: event.type }, '[Resend] Unhandled event');
  }
  
  return Response.json({ ok: true });
}
```

**Test:**
```bash
# Resend Dashboard → Webhooks → "Send test event" → bounce simülasyonu
# Verify: digest_log'da bounced_at güncelleniyor + users.emailDigestFrequency='never'
```

**Ölçeklendiriliyorsa:**
- 100+ user beta'da → Resend Pro ($20/ay = 50K email)
- Veya: Brevo free tier (300 email/gün)
- Veya: Daily digest → Weekly'ye düşür

#### Cuma-Pazar (9 saat)

Review, testing, bug fixes, X posts.

### 🎯 Hafta 8 Teslim

- ✅ Auth çalışıyor
- ✅ User dashboard var
- ✅ Save/use offer features
- ✅ Weekly digest çalışıyor

---

## HAFTA 9: SUBMISSION SYSTEM + VALIDATOR AGENT

### 🎯 Ana Hedef

Topluluk offer gönderebilsin, ajan otomatik doğrulasın.

### 📅 Günlük Breakdown

#### Pazartesi (3 saat)

**Görev:** Submission form + rate limiting

> **🔴 KRİTİK: Submission Rate Limiting (B17)**  
> Rate limit olmadan kötü user 1000 submission gönderir → validator → Firecrawl 1000 credit (=full quota) + LLM cost patlar. Hemen koruma kur.

**Rate limit setup (`src/lib/rate-limit.ts`):**
```typescript
import IORedis from 'ioredis';

const redis = new IORedis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });

interface RateLimitConfig {
  key: string;        // unique identifier (userId or IP)
  limit: number;      // max requests
  windowSec: number;  // window in seconds
}

export async function checkRateLimit(cfg: RateLimitConfig): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: number;
}> {
  const redisKey = `rl:${cfg.key}`;
  const now = Date.now();
  const windowStart = now - cfg.windowSec * 1000;
  
  // Sliding window
  await redis.zremrangebyscore(redisKey, 0, windowStart);
  const count = await redis.zcard(redisKey);
  
  if (count >= cfg.limit) {
    const oldest = await redis.zrange(redisKey, 0, 0, 'WITHSCORES');
    const resetAt = oldest.length > 1 ? parseInt(oldest[1]) + cfg.windowSec * 1000 : now;
    return { allowed: false, remaining: 0, resetAt };
  }
  
  await redis.zadd(redisKey, now, `${now}:${Math.random()}`);
  await redis.expire(redisKey, cfg.windowSec);
  
  return { allowed: true, remaining: cfg.limit - count - 1, resetAt: now + cfg.windowSec * 1000 };
}
```

**Windsurf prompt'u:**

```
Create src/app/submit/page.tsx and src/app/actions/submissions.ts:

Form fields (page.tsx):
- Product URL* (auto-fetch product info if exists)
- If not in DB: Product name, tagline, logo (optional)
- Offer type* (dropdown)
- Code (if applicable)
- Description* (what does this offer give?)
- Source URL (where did you find this?)
- Estimated value (optional)
- Your relationship: "I'm the maker" / "I used this" / "I found this"
- Cloudflare Turnstile widget (anonymous spam koruması)

Validation (Zod):
- URL format
- Offer type in enum
- Description min 10 chars, max 2000 chars
- Source URL: same domain as Product URL VEYA whitelisted (PH, IH, Reddit, X)

Server action (actions/submissions.ts):
'use server';
import { checkRateLimit } from '@/lib/rate-limit';
import { headers } from 'next/headers';

export async function submitOffer(formData: FormData) {
  const session = await getSession();
  const hdrs = await headers();
  const ip = hdrs.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
  
  // 🔴 Rate limit (B17): per-user 5/gün, per-IP 10/gün (anonymous)
  const userKey = session?.user?.id ?? `ip:${ip}`;
  const userLimit = await checkRateLimit({
    key: `submit:${userKey}`,
    limit: session ? 5 : 3,
    windowSec: 24 * 3600
  });
  if (!userLimit.allowed) {
    throw new Error(`Rate limit: ${userLimit.remaining}/5 today. Reset: ${new Date(userLimit.resetAt).toISOString()}`);
  }
  
  // IP-level (anonymous + multi-account abuse koruması)
  const ipLimit = await checkRateLimit({ key: `submit-ip:${ip}`, limit: 10, windowSec: 24 * 3600 });
  if (!ipLimit.allowed) throw new Error('IP rate limit exceeded');
  
  // ... validate + insert submission
}

On submit:
- Create submissions row with status='pending'
- Trigger validator agent job (BullMQ)
- Show confirmation: "Thanks! Our AI agent will review in <5 min."
- Email user when status changes (Resend, idempotent)
```

#### Salı (3 saat)

**Görev:** Validator Agent — pre-check + LLM cascade

> **🔴 KRİTİK: Validator Pre-check (B18)**  
> Her submission'a Firecrawl + LLM çağırma → 1 submission ≈ 1 credit + 1500 token. 100 spam submission = 100 credit (1/5 quota!) + cost. Önce ucuz pre-check, sonra pahalı.

**Pre-check stages (artan maliyet):**
1. **Stage 0 — Schema validation** (free): Zod (form'da yapıldı)
2. **Stage 1 — URL reachability** (~50ms, free): HEAD request, 2xx?
3. **Stage 2 — Regex offer signal** (~5ms, free): Açıklamada offer pattern var mı?
4. **Stage 3 — Domain whitelist** (~5ms, free): URL trusted domain'de mi?
5. **Stage 4 — Duplicate check** (~50ms, free): Aynı code/URL kombinasyonu son 30 gün submission'larda var mı?
6. **Stage 5 — HTTP fetch + cheerio** (~500ms, free): Static HTML'de offer keyword'leri?
7. **Stage 6 — Firecrawl scrape** (1 credit): JS render gerekli mi?
8. **Stage 7 — LLM validation** ($): Final structured verdict

**Windsurf prompt'u:**

```typescript
Create worker/agents/validator-agent.ts:

import { hasOfferSignal } from '../../src/lib/scrapers/producthunt/parser';
import { checkUrlReachable, fetchHtml } from '../../src/lib/scrapers/http-client';
import { checkFirecrawlBudget, firecrawlScrape } from '../../src/lib/scrapers/firecrawl';
import { llmRouter } from '../../src/lib/llm/router';
import { checkLLMBudget, BudgetExhaustedError } from '../../src/lib/llm/budget';

async function validateSubmission(submissionId: string) {
  const sub = await getSubmission(submissionId);
  
  // Stage 1: URL reachability (free, fast)
  const urlReachable = await checkUrlReachable(sub.product_url);
  if (!urlReachable) {
    return reject(sub, 'URL not reachable (404/timeout)');
  }
  
  // Stage 2: Regex offer signal in description (free)
  if (!hasOfferSignal(sub.description)) {
    return reject(sub, 'No offer signal detected in description (require "code", "trial", "%", "free", etc.)');
  }
  
  // Stage 3: Domain whitelist (source URL must be trusted)
  const trustedSources = ['producthunt.com', 'indiehackers.com', 'reddit.com', 'x.com', 'twitter.com'];
  if (sub.source_url) {
    const sourceDomain = new URL(sub.source_url).hostname.replace('www.', '');
    const productDomain = new URL(sub.product_url).hostname.replace('www.', '');
    const isTrusted = trustedSources.some(d => sourceDomain.endsWith(d)) || sourceDomain === productDomain;
    if (!isTrusted) {
      return queueForHumanReview(sub, { reason: 'Untrusted source URL', confidence: 0.3 });
    }
  }
  
  // Stage 4: Duplicate check (last 30 days)
  const duplicate = await findDuplicateSubmission(sub.product_url, sub.code, 30);
  if (duplicate) {
    return reject(sub, `Duplicate of submission #${duplicate.id} (${duplicate.status})`);
  }
  
  // Stage 5: HTTP + cheerio fast scan (free)
  let pageText: string;
  try {
    const html = await fetchHtml(sub.product_url, { timeout: 5000 });
    pageText = extractTextFromHtml(html);  // cheerio strip
  } catch {
    pageText = '';
  }
  
  const cheapMatch = pageText.toLowerCase().includes(sub.code?.toLowerCase() ?? '____');
  
  // Stage 6: Firecrawl (1 credit) — sadece cheap scan başarısızsa
  let pageContent = pageText;
  if (!cheapMatch && pageText.length < 500) {
    const budget = await checkFirecrawlBudget();
    if (!budget.allowed) {
      return queueForHumanReview(sub, { reason: 'Firecrawl budget exhausted, needs manual review', confidence: 0.4 });
    }
    const scraped = await firecrawlScrape(sub.product_url);
    pageContent = scraped.markdown;
  }
  
  // Stage 7: LLM validation ($) — son adım
  try {
    await checkLLMBudget('groq');  // Groq free
  } catch (e) {
    if (e instanceof BudgetExhaustedError) {
      return queueForHumanReview(sub, { reason: 'LLM budget exhausted', confidence: 0.4 });
    }
  }
  
  const validation = await llmRouter.chat({
    messages: [
      { role: 'system', content: VALIDATOR_PROMPT },
      { role: 'user', content: JSON.stringify({
          submission: sub,
          page_content: pageContent.slice(0, 5000)
        })
      }
    ],
    response_format: 'json',
    temperature: 0.1,
  });
  
  const result = JSON.parse(validation.content);
  
  // Decision logic:
  if (result.confidence > 0.8 && result.verdict === 'valid') {
    await autoApprove(sub, result);
  } else if (result.confidence > 0.5) {
    await queueForHumanReview(sub, result);
  } else {
    await autoReject(sub, result.reason);
  }
  
  await notifyUser(sub.submitter_id, result);
}

// Validator prompt:
const VALIDATOR_PROMPT = `
You are validating a user-submitted offer for our AI tools directory.

Given:
1. User's submission (claim about an offer)
2. Actual page content from the product's website

Determine:
- Is the offer described on the page?
- Is the code (if any) actually mentioned?
- Are the discount/trial numbers accurate?

Return JSON:
{
  "verdict": "valid" | "invalid" | "partial" | "unclear",
  "confidence": 0.0-1.0,
  "reason": "string explaining decision",
  "corrections": { "field": "corrected value" }
}
`;
```

**Checklist:**
- [ ] Validator çalışıyor
- [ ] Test submissions dene (3 valid, 2 invalid)
- [ ] Auto-approve/reject doğru karar veriyor

#### Çarşamba (3 saat)

**Görev:** Admin review panel (sen için)

> **🔴 KRİTİK: Tek source of truth — `users.role`**  
> Hafta 2'de `users.role` field eklendi (`'user' | 'admin'`). `ADMIN_EMAILS` env değişkeni SADECE bootstrap (ilk admin atama) için. Runtime check her zaman `users.role` üzerinden olmalı.

**Bootstrap migration (Hafta 2 sonu, manuel SQL):**
```sql
-- İlk admin'i belirle (sadece 1 kez çalıştır)
UPDATE users SET role = 'admin' WHERE email = 'senin@email.com';
```

**Helper (`src/lib/auth/admin.ts`):**
```typescript
import { db } from '../db/client';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { createClient } from '../supabase/server';

export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect('/login');
  
  const [row] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);
  
  if (row?.role !== 'admin') {
    redirect('/');  // Veya 403 page
  }
  
  return { user, role: row.role };
}

export async function isAdmin(userId: string): Promise<boolean> {
  const [row] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row?.role === 'admin';
}
```

**Windsurf prompt'u:**

```
Create src/app/admin/submissions/page.tsx:

Admin-only page (protected via requireAdmin() helper from @/lib/auth/admin):
- Server component (Server-side auth check before render)
- Top of page: const { user } = await requireAdmin();
- Table of pending submissions
- Columns: Submitter, Product, Type, AI Verdict, Confidence, Actions
- Each row expandable to show full details
- Actions: [Approve] [Reject] [Edit & Approve]
- Bulk actions: approve all > 0.9 confidence (with confirmation modal showing count)

Also /admin/dashboard with:
- Total submissions today
- Approval rate (last 30 days)
- Top submitters
- AI agent accuracy (post-human-review)
- LLM cost this month (links to /admin/costs)
- Firecrawl credits remaining

Also /admin/users (Hafta 13 polish):
- List of users with role
- Promote/demote action (admin role)

For server actions:
- src/app/actions/admin.ts → all actions await requireAdmin() first
```

**Middleware'de ekstra koruma (`src/middleware.ts`):**
```typescript
// /admin/* prefix matcher
export const config = {
  matcher: ['/admin/:path*']
};

export async function middleware(req: NextRequest) {
  // Cheap check: session var mı? (yoksa /login'e at)
  // Tam role check Server Component'te yapılır (DB query gerekir)
  const supabase = createMiddlewareClient(req);
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.redirect(new URL('/login', req.url));
  return NextResponse.next();
}
```

#### Perşembe (3 saat)

**Görev:** Voting + community verification

**Windsurf prompt'u:**

```
Add community verification to offer cards:

1. On each active offer: "Does it work?" buttons (👍/👎)
2. Authenticated users can vote once per offer
3. Store in offer_votes table
4. Update offer.works_count / doesnt_work_count
5. Recalculate trust_score:
   - Base: from source (PH=0.7, IH=0.6, manual=0.5)
   - + confidence from extraction
   - + community (works_rate * 0.3)
   - - recency penalty (>30 days since check = -0.1)
6. If doesnt_work_count > works_count + 3:
   - Auto-flag: status='flagged'
   - Queue for re-verification

Show vote counts: "👍 23  👎 2  |  Verified 3 days ago"
```

#### Cuma (3 saat)

**Görev:** Report expired/wrong offer

**Windsurf prompt'u:**

```
Add "Report issue" flow:

1. On offer card: small "⚠️ Report" link
2. Opens modal:
   - Radio: "Expired" | "Wrong info" | "Scam" | "Other"
   - Optional text: details
3. Creates offer_reports row
4. Auto-logic:
   - 3+ "expired" reports in 7 days → flag + re-verify
   - 1 "scam" report → immediate human review
5. Admin panel: /admin/reports
```

#### Cumartesi-Pazar (6 saat)

Testing + fixing bugs.

> Week 9 ✅
> 📝 Community submissions live
> 🤖 AI validator: 87% agreement with human judgment
> 👍👎 Voting + trust scores
> 🚨 Report system
>
> Starting to feel real. Anyone want to beta test?
> DM me.
>
> #buildinpublic

---

## HAFTA 10: POLISH & SOFT LAUNCH

### 🎯 Ana Hedef

İlk 10-20 gerçek kullanıcı. Bug'ları canlı kullanıcıyla görüp düzelt.

### 📅 Günlük Breakdown

#### Pazartesi (3 saat)

**Görev:** Pre-launch checklist

- [ ] `freetierhunt.com` canlı + SSL OK
- [ ] 500+ products indexed
- [ ] 200+ active offers
- [ ] Landing page responsive
- [ ] Search <500ms
- [ ] Auth çalışıyor
- [ ] Submission çalışıyor
- [ ] Email digest gönderiliyor
- [ ] 404 + error pages
- [ ] Privacy policy + ToS sayfası
- [ ] Cookie consent banner
- [ ] GDPR data export endpoint (`/api/account/export`)
- [ ] GDPR data delete endpoint (`/api/account/delete`)
- [ ] Contact email: `hello@freetierhunt.com`
- [ ] About sayfası
- [ ] Footer links
- [ ] Analytics working (Cloudflare + PostHog)
- [ ] Sentry capturing errors
- [ ] Lighthouse 90+
- [ ] Mobile tested (real phone)
- [ ] Security audit (XSS, CSRF, SQL injection)
- [ ] Load test (k6 - hafta 11'e bakın)

**🔴 KRİTİK: GDPR Compliance Endpoints**

```typescript
// app/api/account/export/route.ts (Right to Access)
export async function GET(req: Request) {
  const user = await requireAuth(req);
  
  const data = {
    profile: await getUserProfile(user.id),
    saved_offers: await getSavedOffers(user.id),
    votes: await getUserVotes(user.id),
    submissions: await getUserSubmissions(user.id),
    activity: await getUserActivity(user.id),
    exported_at: new Date().toISOString()
  };
  
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="freetierhunt-${user.id}.json"`
    }
  });
}

// app/api/account/delete/route.ts (Right to be Forgotten)
export async function DELETE(req: Request) {
  const user = await requireAuth(req);
  const { confirmation } = await req.json();
  
  if (confirmation !== user.email) {
    return Response.json({ error: 'Email confirmation mismatch' }, { status: 400 });
  }
  
  // Cascade delete: saved_offers, votes, submissions
  await db.delete(users).where(eq(users.id, user.id));
  
  // Anonymize public data (votes, submissions kept for trust score)
  await db.update(offerVotes)
    .set({ userId: null, voterIp: null })
    .where(eq(offerVotes.userId, user.id));
  
  await supabase.auth.admin.deleteUser(user.id);
  
  return Response.json({ deleted: true });
}
```

**Privacy Policy DPA Linkleri (gerekli):**
- Supabase: https://supabase.com/dpa
- Resend: https://resend.com/legal/dpa
- Vercel: https://vercel.com/legal/dpa
- Cloudflare: https://www.cloudflare.com/cloudflare-customer-dpa/

#### Salı (3 saat)

**Görev:** Legal pages

**Windsurf prompt'u:**

```
Create legal pages with AI assistance:

1. src/app/privacy/page.tsx
   - Cover: email, cookies, analytics, third-party services
   - GDPR compliant, link DPA URLs above
   - Easy to read, not legalese
   - "Contact: hello@freetierhunt.com"

2. src/app/terms/page.tsx
   - Standard ToS
   - No warranty on offers (buyer beware)
   - Takedown policy
   - 🔴 **Affiliate disclosure (FTC compliant)**:
     "Some links on this site are affiliate links. If you purchase through them, FreeTierHunt may earn a small commission at no extra cost to you. This funds the free tier of our service. We never accept payment for placement; rankings are based purely on community trust and offer quality."
   - Schema'ya `offers.is_affiliate: boolean default false` ekle (Hafta 2 schema'sına eklendi)
   - Offer card UI: affiliate link'in yanında küçük `(aff)` veya 💰 emoji + tooltip "This is an affiliate link"
   - Programmatik enforcement: `<OfferLink>` component her zaman badge render etsin

3. src/app/about/page.tsx
   - Your story (vibe coder, ayda \$80 harcıyordun, etc.)
   - Mission: help indie makers save on AI tools
   - How it works (3 steps)
   - Contact info

4. src/app/contact/page.tsx
   - Email: hello@freetierhunt.com
   - Twitter: @freetierhunt
   - "Takedown request" form

Use brutal design throughout.
```

#### Çarşamba (3 saat)

**Görev:** Onboarding flow

**Windsurf prompt'u:**

```
Create onboarding for first-time users:

After first login (detect user.onboarded_at IS NULL):
1. Welcome screen: "Welcome to FreeTierHunt!"
2. Quick survey:
   - What AI tools do you use? (checkboxes: 20 popular ones)
   - How much do you spend monthly? (\$0-25, \$25-75, \$75-200, \$200+)
   - What do you want to do here? (save money / discover tools / submit offers)
3. Set digest preference: daily/weekly
4. "Here are offers matching your interests" (pre-selected)
5. Set user.onboarded_at = now()

Skip option at every step.
```

#### Perşembe (3 saat)

**Görev:** 10 closest friend beta test

X'te 10 tanıdık vibe coder/maker'a DM at:

> Hey [name], I built a tool to find free credits and deals for AI tools.
> Would love 5 mins of your feedback before wider launch.
> freetierhunt.com
>
> Specifically curious:
> - Does it load fast?
> - Can you find something useful in 60 seconds?
> - Any bugs?
>
> No obligation, just honest feedback 🙏

**Feedback formu (Tally veya Google Form):**
- Nasıl buldun? (1-10)
- Ne kadar faydalı? (1-10)
- En iyi özellik?
- En kötü özellik?
- Eksik bir şey?
- Tavsiye eder misin?

#### Cuma (3 saat)

**Görev:** Feedback'e göre fix

Genelde bu aşamada çıkan sorunlar:
- Mobile'da bir şey bozuk
- Bir butonun ne yaptığı anlaşılmıyor
- Copy-paste çalışmıyor
- Bazı offer'lar garip görünüyor

3-5 öncelikli fix yap.

#### Cumartesi (4 saat)

**Görev:** Content prep (Hafta 11 için)

İlk 3 blog post'u yaz (draft):
1. *"How I saved $40/month on AI tools as a vibe coder"*
2. *"GitHub Student Pack 2026: Best AI Tools Included"*
3. *"Free Tier Face-Off: Gemini vs Claude vs ChatGPT"*

Her biri 1500-2500 kelime, long-tail SEO odaklı.

#### Pazar (2 saat)

> Week 10 ✅
> 👥 First 12 beta users
> 🐛 Fixed 7 bugs they found
> 📝 3 blog drafts for SEO
> 📊 Product quality: 8.2/10 avg rating
>
> Soft launch next week. Fingers crossed 🤞
>
> #buildinpublic

---

## HAFTA 11: CONTENT & SEO

### 🎯 Ana Hedef

İlk 3 blog post yayında + strategic Reddit posts.

### 📅 Günlük Breakdown

#### Pazartesi (3 saat)

**Görev:** Blog infrastructure

**Windsurf prompt'u:**

```
Create blog structure:

1. src/app/blog/page.tsx — blog index
2. src/app/blog/[slug]/page.tsx — post detail
3. src/content/blog/ — MDX files
4. Use next-mdx-remote (contentlayer deprecated) for MDX
5. Each post frontmatter:
   ---
   title: string
   description: string (for SEO)
   publishedAt: ISO date
   author: string
   category: string
   coverImage: string
   tags: string[]
   ---
6. Per-post SEO metadata
7. RSS feed at /blog/feed.xml
8. Sitemap includes blog posts
9. "Related posts" component
```

#### Salı (3 saat)

**Görev:** İlk blog post yayına

**Blog 1:** *"How I Saved $40/mo on AI Tools as a Vibe Coder"*

**Outline:**
- Hook: *"I was paying $82/mo for AI tools. Now I pay $38."*
- Problem: too many tools, too many free tiers to track
- Solution: I built FreeTierHunt
- Breakdown: my old stack vs new stack with $ figures
- 5 actionable tips for anyone
- CTA: try it at freetierhunt.com

Bu post otantik, utility-focused, self-centered story. Reddit/HN severdik.

#### Çarşamba (3 saat)

**Görev:** Blog 2 + 3 yayına

Aynı format, farklı açılar.

#### Perşembe (3 saat)

**Görev:** Reddit strategic post

**Subreddit:** r/SideProject

**Title:** *"I built a tool to track free tiers and promo codes for AI tools — lessons learned"*

**Body outline:**
- Hook: *"Vibe coder burada. Ayda $80 AI harcamamdan sıkıldım."*
- Problem (empathetic)
- What I built
- Tech stack (Reddit loves this)
- Surprising findings
- Not an ad, real value
- Link at bottom

**Mini-thread plan:**
- Saat 10:00 UTC'de post (US morning)
- İlk saat: her yoruma yanıtla
- 24 saat aktif ol

#### Cuma (3 saat)

**Görev:** Load Test (PH launch öncesi - KRİTİK)

> **NOT:** PH'den günlük 5K+ traffic gelir. Vercel free tier 100GB/ay. İlk gün 50GB harcayabilir.

```bash
npm install -D k6
```

**🔴 KRİTİK: Production'a karşı load test ATMA!**  
> Beta user'ları etkiler. Vercel Preview URL'inde test et veya off-peak saatlerde (TR gece 03:00 UTC).  
> `BASE_URL` env ile preview/prod arasında geçiş yap.

**k6 test script (load-test.js):**
```javascript
import http from 'k6/http';
import { check, sleep, group } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'https://freetierhunt-preview.vercel.app';  // 🔴 default preview
// Production'a karşı çalıştırırken: k6 run -e BASE_URL=https://freetierhunt.com load-test.js

export const options = {
  stages: [
    { duration: '30s', target: 50 },   // Warmup
    { duration: '2m', target: 200 },   // Peak (PH launch hızı)
    { duration: '30s', target: 0 }     // Cooldown
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% < 500ms
    http_req_failed: ['rate<0.01'],    // <%1 hata
    'http_req_duration{path:home}': ['p(95)<300'],
    'http_req_duration{path:product}': ['p(95)<400'],
    'http_req_duration{path:search}': ['p(95)<600']
  }
};

export default function() {
  // Realistic traffic mix (PH launch profile)
  group('home', () => {
    const res = http.get(`${BASE_URL}/`, { tags: { path: 'home' } });
    check(res, { 'status 200': r => r.status === 200 });
  });
  
  group('product page', () => {
    const slug = ['cursor', 'windsurf', 'claude', 'chatgpt'][Math.floor(Math.random() * 4)];
    const res = http.get(`${BASE_URL}/products/${slug}`, { tags: { path: 'product' } });
    check(res, { 'status 200': r => r.status === 200 });
  });
  
  group('search api', () => {
    const queries = ['ai', 'free', 'cursor', 'gpt'];
    const q = queries[Math.floor(Math.random() * queries.length)];
    const res = http.get(`${BASE_URL}/api/search?q=${q}`, { tags: { path: 'search' } });
    check(res, { 'status 200': r => r.status === 200 });
  });
  
  sleep(Math.random() * 3 + 1);  // 1-4 sn arası realistic gap
}

// Pre-flight: 1 user, 30 sn (smoke test)
export function setup() {
  console.log(`[k6] Target: ${BASE_URL}`);
  const res = http.get(`${BASE_URL}/api/health`);
  if (res.status !== 200) throw new Error('Target not healthy');
}
```

**Çalıştırma:**
```bash
# 1. Önce preview'da test (güvenli):
k6 run load-test.js

# 2. Off-peak'te production'a (TR gece 03:00 UTC = öğleden sonra US):
k6 run -e BASE_URL=https://freetierhunt.com load-test.js
```

**Sorun çıkarsa fallback'ler:**
- ISR `revalidate` süresini düşür (5 dk → 1 saat)
- Cloudflare Cache Rules: `/products/*` 1 saat cache, `/api/og/*` 1 ay cache
- Vercel Pro upgrade hazır ($20) — kredi kartı önceden ekle (manuel upgrade çabuk olur)
- Discord webhook'a alert ekle: response time p95 > 1000ms ise notify

#### Cumartesi-Pazar (6 saat)

- Reddit follow-up (IH, r/cursor)
- Diğer küçük post'lar
- X thread
- İstatistikleri izle (PostHog)
- **PH Launch materyalleri hazırla:** screenshots, demo video, maker comment draft (Hafta 12 için)

> Week 11 ✅
> 📝 3 blog posts live
> 🔥 Reddit post: 347 upvotes, 89 comments
> 📈 Organic traffic: 1,200 uniques this week
> 👥 Total users: 89
>
> Ramping up for public launch next week.
>
> #buildinpublic

---

## HAFTA 12: PUBLIC LAUNCH

### 🎯 Ana Hedef

Product Hunt launch + dalga dalga duyuru.

### 📅 Günlük Breakdown

#### Pazartesi (3 saat)

**Görev:** PH launch materials (Hafta 11'de başladığını finalize et)

> **NOT:** Maker's Comment + 5 screenshot + 30sn video + 8-tweet X thread = gerçekçi 8-12 saat. Hafta 11 sonu draft, Hafta 12 Pazartesi finalize.

**PH page hazırlığı:**
- Tagline (60 char): *"Find free credits & deals for AI tools"*
- Description: 260 char
- First comment (Maker's comment): senin story
- Gallery: 5 screenshots + 1 30sn demo video
- Topics: AI, Developer Tools, Productivity
- **PH Hunters listesi:** Launch'tan 1 hafta önce 5-10 hunter'a DM at
- **Backup plan:** Rejected ise launch 1 gün ileri al, e-mail support'a

**Launch day teaser (Pazar gece):**

> Tomorrow, I'm launching on @ProductHunt.
>
> 12 weeks ago I was paying $80/mo for AI tools. 
> Now $30.
>
> Built FreeTierHunt to help others do the same.
>
> Launch tomorrow at 00:01 PST.
> Your upvote = everything.
>
> 🏹 https://producthunt.com/posts/freetierhunt

#### Salı (launch day — 5 saat)

**Görev:** PH launch 00:01 PST

1. 00:01 PST: Submit
2. Maker's Comment: senin hikayen
3. İlk saat: bilinen her yere paylaş (X, LinkedIn, Discord, WhatsApp gruplar)
4. Her saat başı engagement kontrol
5. Yorumlara yanıtla (hepsine)
6. 12 saat aktif kal

**X thread template:**

```
1/ Today I'm launching @freetierhunt on @ProductHunt

It helps vibe coders save \$40+/mo on AI tools.

Here's the story... 🧵

2/ 12 weeks ago, I was drowning in AI tool subscriptions:
- Cursor Pro: \$20
- ChatGPT Plus: \$20
- Windsurf: \$15
- Google AI: \$20
- Misc tools: \$15
Total: \$90/mo

3/ Then I noticed: every tool has hidden free tiers, student discounts, 
launch promos. But they're scattered across:
- Product Hunt
- Indie Hackers
- Reddit
- Twitter
- Creator YouTubes

Nobody aggregates them.

4/ So I built FreeTierHunt.

Every day, an agent:
- Scrapes PH launches
- Extracts offers with LLM
- Verifies with Firecrawl
- Updates trust scores
- Emails you what's new

5/ Results after 12 weeks:
- 850+ AI tools indexed
- 340 active offers
- My monthly AI cost: \$90 → \$34
- Saved: \$56/mo (= \$672/year)

6/ Tech stack (for the nerds):
- Next.js + Supabase + Vercel
- Groq (free) → OpenRouter (free) → GPT (paid fallback)
- Oracle Always Free for workers
- OpenClaw for agents
- Firecrawl for enrichment

Total hosting cost: \$0

7/ Who is this for?
- Vibe coders
- Indie makers
- Students building AI projects
- Anyone spending \$50+/mo on AI tools

Not for: enterprise teams (yet)

8/ Launching on @ProductHunt right now:
[LINK]

If this could save you money, I'd love your upvote.

And honest feedback — this is built in public.

Let's save money together 🏹
```

#### Çarşamba-Cuma (9 saat)

**Görev:** Post-launch iteration

- PH rank takip (top 10 ideal, top 20 OK)
- Her feedback'i kaydet
- 5 en büyük bug fix
- Yeni kullanıcılara onboarding email
- Press outreach (TechCrunch, Indie Hackers newsletter, etc.)

#### Cumartesi (4 saat)

**Görev:** Launch retro

```
Week 12 🚀 LAUNCH WEEK

PH stats:
- Upvotes: [X]
- Rank: #[Y] of the day
- Comments: [Z]

Growth:
- New users: [N] in 48h
- Traffic: [M] uniques
- Newsletter subs: [K]

Feedback themes:
- [Good]: ...
- [Bad]: ...
- [Feature requests]: ...

Next 30 days: fix bugs, write more content, iterate based on feedback.

Thank you everyone 🙏

#buildinpublic
```

#### Pazar (2 saat)

**Görev:** Hafta 13+ planning

12 hafta tamamlandı! Nereye gidiyoruz?
- Hangi feature request'ler önemli?
- Hangi kategorilerde eksik?
- Monetizasyon ne zaman?

---

## HAFTA 13: STABILIZATION (Post-Launch)

> **Hafta 12 launch sonrası 1 hafta sakin geçirilir**: bug fix, customer support, momentum maintain.  
> Yeni feature ATMA. Mevcut sorunları kapat.

### 🎯 Ana Hedef

PH launch sonrası gelen ilk feedback dalgasını işle, kritik bug'ları kapat, momentum'u koru.

### 🎨 Küçük Zafer

Hafta sonunda: 0 P0 bug, ≤3 P1 bug, ilk 100 active user retention'ı ≥%30.

### 📅 Günlük Breakdown

#### Pazartesi (3 saat) — Triage & Hot Fixes

- Sentry error queue'yu temizle (top 10 error)
- PH/X/Discord/Email feedback'i tek bir spreadsheet'e topla
- Tag: P0 (broken), P1 (annoying), P2 (nice-to-have), P3 (later)
- Sadece P0 ve P1 bu hafta

#### Salı (3 saat) — User Support

- Customer support email'lerini yanıtla (≤24h hedef)
- Discord/X DM'lerine cevap ver
- "Top 5 confusing UX" listesini çıkar — Hafta 14 polish'i için

#### Çarşamba (3 saat) — Performance Tuning

- PostHog'da slow page list'i çıkar
- DB slow queries (Supabase Dashboard → Reports → Query Performance)
- N+1 query hot spot'ları fix et
- Cache headers'ı ince ayar (Cloudflare Analytics ile bandwidth track)

#### Perşembe (3 saat) — Data Quality Sweep

- Manual review queue'yu temizle (Hafta 9 admin panel)
- Düşük trust score'lu offer'ları yeniden değerlendir
- Expired offer'ları kapat (`status='expired'`)
- LLM extractor'ın yanlış extraction'larını golden set'e ekle

#### Cuma (3 saat) — Press / Outreach Follow-up

- TechCrunch / Indie Hackers Newsletter / Hacker News pickup'ı kontrol et
- Eğer pickup geldiyse → reply traffic'i izle, X thread sürdür
- Newsletter waiting list'ten kullanıcılara onboarding emaili (Resend chunk)

#### Cumartesi (4 saat) — Retro

- Launch metrik'leri yaz (`notes/launch-retro.md`):
  - Total visitors / unique
  - Signups
  - Activation rate (saved at least 1 offer)
  - Retention day-7
  - Top offer (en çok save edilen)
  - LLM cost
  - Firecrawl credit usage
- Top 3 takeaway'i blog post'a çevir

#### Pazar (2 saat) — Plan Hafta 14+

- Hangi feature request en çok geldi? Ranking yap.
- Ay 2 roadmap'i taslakla (3-4 feature)
- Build-in-public update:

> Week 13 ✅ Stabilization done.
> 
> Stats: [X] users, [Y] offers used, [Z] saved.
> Top fix: [biggest bug fixed].
> Next month: [3 priorities].
> 
> Thanks for the support 🙏 #buildinpublic

### ⚠️ Potansiyel Tuzaklar

- **Yeni feature kafayı bozma** — bu hafta SADECE stabilization.
- **Negatif feedback'i kişisel alma** — pattern'a bak, individual yorum'a değil.
- **Burnout risk** — launch sonrası 1 hafta soft tempo (15 saat OK).

---

## 🎉 12 HAFTA TAMAMLANDI!

Bu noktada elinde olanlar:
- ✅ Canlı bir SaaS
- ✅ 500+ kullanıcı (umarız)
- ✅ Otomatik işleyen pipeline
- ✅ Topluluk
- ✅ SEO temeli
- ✅ Build-in-public hikayeni

---

## EKLER

### Ek A: Haftalık Kontrol Listesi Template

**Her Pazar 15 dakika:**

- [ ] Bu hafta hedefim ne?
- [ ] Son hafta hedefi başarıldı mı?
- [ ] Oracle VM sağlıklı mı? (CPU, RAM, disk)
- [ ] Errors artan/azalan? (Sentry)
- [ ] Yeni offers ekleniyor mu?
- [ ] Pipeline breakage var mı?
- [ ] Kullanıcı sayısı değişimi
- [ ] LLM cost ne durumda?
- [ ] Firecrawl kredi ne kadar?
- [ ] X post planı
- [ ] Sonraki hafta önceliği

### Ek B: Troubleshooting Quick Reference

| Problem | Çözüm |
|---------|-------|
| **Groq rate limit hit** | Router parallelism'i 5'ten 3'e düşür, ya da OpenRouter'a geç. |
| **Supabase connection limit** | Connection pooling kullan (Supabase Pooler). |
| **Vercel build fail** | Local'de `pnpm build` çalışıyor mu? Env vars Vercel'de var mı? |
| **OpenClaw timeout** | Oracle VM yükü yüksek olabilir. `pm2 restart all`. |
| **Sudden drop in extractions** | Extraction queue'yu kontrol et. Belki bir prompt change regression getirdi. |
| **Search results stale** | Meilisearch reindex gerekebilir. |

### Ek C: Prompt Kütüphanesi

Tüm kritik LLM prompt'ları (extractor, validator, content generator) `src/lib/llm/prompts/` altında version-controlled.

### Ek D: 13. Haftadan Sonrası

**Ay 4-6 hedefleri:**
- Chrome extension prototipi
- Freshness checker agent
- Content agent (tweet otomasyonu)
- 2000+ kullanıcı
- İlk $50 affiliate gelir

**Ay 7-12 hedefleri:**
- Discovery agent
- Mobile app (opsiyonel)
- Türkçe versiyon
- $200+ aylık affiliate
- Maker dashboard V1

**Yıl 2:**
- Değerlendir: sürdür, büyüt, veya başka projeye geç
- Lifestyle business olarak oturmuşsa → sonsuza kadar devam
- Büyüme isteği varsa → pro tier ekle, ekibe al

### Ek E: Aylık Bakım Listesi

**Her ayın ilk Pazartesi (1 saat):**

- [ ] `pnpm audit` — security vulnerability check
- [ ] Dependabot PR'larını review et + merge
- [ ] Sentry error rate trend'i (artıyor mu?)
- [ ] LLM cost trend'i (`SELECT date_trunc('day', created_at), SUM(cost_usd) FROM llm_calls`)
- [ ] Firecrawl credit kullanımı (≤80% hedef)
- [ ] Supabase: free tier limits (DB size, requests, storage)
- [ ] Vercel: bandwidth + function invocation
- [ ] Backup restore test (1 gün rastgele backup'ı test DB'ye restore et)
- [ ] Prompt eval F1 score (regression check)
- [ ] Top 10 expired offer'ı manuel verify

### Ek F: Disaster Recovery Runbook

> **🚨 Bu rehberi `notes/disaster-recovery.md`'ye kopyala. Acil durumda 3am'da hata yapma.**

#### Senaryo 1: Database silindi / corrupted

```bash
# 1. PANIK YAPMA. Backup var.
ssh ubuntu@oracle-vm
ls -lh /home/ubuntu/backups/  # En son backup'ı bul

# 2. Yeni Supabase project oluştur (eski'yi geri getirme)
#    Dashboard → New project → freetierhunt-recovery
#    Yeni DATABASE_URL + DIRECT_URL'i kaydet

# 3. Restore backup
gunzip < /home/ubuntu/backups/freetierhunt_LATEST.sql.gz | psql "$NEW_DIRECT_URL"

# 4. Smoke check
psql "$NEW_DIRECT_URL" -c "SELECT count(*) FROM products;"  # Beklenen değere yakın mı?
psql "$NEW_DIRECT_URL" -c "SELECT count(*) FROM offers WHERE status='active';"

# 5. Vercel + Worker env'i güncelle
#    Vercel → Settings → Environment Variables → DATABASE_URL, DIRECT_URL
#    Oracle VM: nano /home/ubuntu/freetierhunt/.env

# 6. Migration (eğer schema drift varsa)
pnpm db:push

# 7. Worker restart
pm2 restart freetierhunt-worker

# 8. Vercel redeploy (env değiştiği için)
#    git commit --allow-empty -m "trigger redeploy" && git push

# 9. DNS düşmedi (Cloudflare aynı), site çalışmalı
curl https://freetierhunt.com/api/health  # → {"status":"ok"}

# 10. Discord webhook'a "DR complete" mesajı + post-mortem yaz
```

**RTO (Recovery Time Objective):** ~30 dk  
**RPO (Recovery Point Objective):** ~24 saat (daily backup interval)

#### Senaryo 2: Worker (Oracle VM) çöktü

```bash
# 1. PM2 restart
ssh ubuntu@oracle-vm
pm2 restart freetierhunt-worker
pm2 logs freetierhunt-worker --lines 100  # error pattern?

# 2. Memory issue mi?
free -h
htop  # process'ler

# 3. Redis connection?
redis-cli -a $REDIS_PASSWORD ping  # → PONG

# 4. Disk dolu mu?
df -h  # /var/log?

# 5. Hâlâ çalışmıyorsa: VM reboot
sudo reboot
# 5 dk bekle, SSH back, pm2 status
```

#### Senaryo 3: Vercel build başarısız (production down)

```bash
# 1. Latest deployment'ı kontrol et
#    Vercel Dashboard → freetierhunt → Deployments

# 2. Önceki başarılı deployment'a rollback
#    Deployments → [son başarılı] → "Promote to Production"

# 3. Bug'ı yerel'de reproduce et
git checkout main
pnpm install
pnpm build  # error?

# 4. Fix + push
```

#### Senaryo 4: Supabase free tier limit doldu

- **DB size > 500MB**: Eski `extraction_queue` (status='completed', >30 gün) sil
- **Bandwidth > 5GB/ay**: ISR cache sürelerini artır
- **Connection > 60**: Pooler kullanıldığını verify et (`?pgbouncer=true`)

**Backup link'leri (`.env` dışı, panik durumunda):**
- Supabase: https://supabase.com/dashboard/project/[id]/database/backups
- Vercel: https://vercel.com/[user]/freetierhunt/deployments
- Oracle VM: ssh + `pm2 list`

### Ek G: README.md Şablonu (Local Setup)

> Hafta 1 Pazartesi'de README.md'ye ekle. Yarın bilgisayarın patlarsa başka makinada 5 dk'da kurabilesin.

```markdown
# FreeTierHunt 🏹

Aggregator for AI tool free tiers, trials, and promo codes.

## Local Setup (5 dk)

### Prerequisites
- Node.js 20 LTS
- pnpm 9+ (`npm install -g pnpm`)
- Postgres client (pgAdmin / TablePlus) — opsiyonel

### Steps

1. **Clone + install**
   ```bash
   git clone git@github.com:[user]/freetierhunt.git
   cd freetierhunt
   pnpm install
   ```

2. **Environment variables**
   ```bash
   cp .env.example .env.local
   # Doldur (1Password/Bitwarden 'FreeTierHunt' folder'ından):
   #   DATABASE_URL=...     (Supabase pooler, port 6543)
   #   DIRECT_URL=...       (Supabase direct, port 5432, drizzle migration)
   #   GROQ_API_KEY=...
   #   OPENROUTER_API_KEY=...
   #   PH_API_KEY=...
   #   RESEND_API_KEY=...
   #   FIRECRAWL_API_KEY=...
   #   SENTRY_DSN=...
   #   NEXT_PUBLIC_SENTRY_DSN=...
   ```

3. **Database setup**
   ```bash
   pnpm db:push    # schema'yı push (sadece dev)
   pnpm db:seed    # 20 product + 30 offer seed
   pnpm db:studio  # browser'da DB inspect
   ```

4. **Run dev server**
   ```bash
   pnpm dev
   # → http://localhost:3000
   ```

5. **Worker (opsiyonel, scraping test için)**
   ```bash
   # Önce Redis kurulu olmalı (Docker veya native)
   docker run -p 6379:6379 redis:7-alpine
   # Worker başlat
   pnpm tsx worker/index.ts
   ```

### Common Issues

| Problem | Solution |
|---------|----------|
| `pnpm db:push` fails | DIRECT_URL (port 5432) kullanılıyor mu? Pooler 6543 migration desteklemez. |
| Sentry init error | NEXT_PUBLIC_SENTRY_DSN var mı? `.env.local` server'da değil client'a expose edilmeli. |
| Worker Redis connect fail | Redis çalışıyor mu? `redis-cli ping` |
| Vercel build "Cannot resolve module" | `pnpm-lock.yaml` commit'lendi mi? Vercel install command "pnpm install" mi? |

### Project Structure

- `src/app/` — Next.js 15 App Router (pages + API routes)
- `src/lib/db/` — Drizzle schema + queries
- `src/lib/llm/` — LLM router + prompts + budget guard
- `src/lib/scrapers/` — PH + IH + Firecrawl
- `worker/` — Background jobs (PM2 on Oracle VM)
- `fixes/` — Plan revision diffs (geçici, post-launch silinebilir)
- `scripts/` — Build, deploy, backup automation

### Documentation
- Full execution plan: `# 📄 DOSYA 2 \`freetierhunt-v3-part2-execution.txt`
- Audit findings: `audit-findings.md`
- DR runbook: Ek F (plan dosyasında)

### License
MIT (or your choice)
```

---

## 🎊 KAPANIŞ NOTU

Sen 12 haftada bir SaaS yapacaksın. **Kod bilmeden, $0 bütçeyle, haftada 21 saat çalışarak.**

Bu mümkün çünkü:
- **Windsurf** senin teknik partner'ın
- **OpenClaw** senin ajan ekibin
- **Firecrawl + PH API** senin veri kaynağın
- **Oracle** senin serverın
- **Sen** senin en iyi kullanıcın

Bu rapor bir kutsal kitap değil, bir rehber. Bazı haftalar geride kalacaksın, bazı haftalar öne geçeceksin. Önemli olan: **her gün bir şey ship et.**

Her takıldığında sor:
- *"Bu gerçekten gerekli mi?"*
- *"Vibe coding ile nasıl yapabilirim?"*
- *"Benim için değil, kullanıcım için en kolay ne?"*

Ve unutma: **Kendin için yapıyorsun.** Kimse kullanmasa bile, sen kullanacaksın. Bu başarıdır.

---

## 💬 SONRAKİ ADIMLAR

### Hemen Yap (Bugün)
1. Bu raporu Notion/Obsidian'a kaydet (referans için)
2. Hafta 0 checklist'ini aç
3. Domain satın al: `freetierhunt.com`
4. Bana sor: *"Hafta 1'in ilk günü başlamadan önce ne bilmeliyim?"*

### Bu Hafta Yap
- Hafta 0'ı tamamla (tüm hesaplar + yerel setup)
- İlk teaser tweet at
- Pazar akşamı Hafta 1'e başla

### Sonsuza Kadar Yap
- Pazar günleri retro + plan
- Her başarıyı paylaş (build-in-public)
- Bana güncelle (ihtiyaç oldukça)

---

**Raporu bitirdim. 🎯**

Sorman gereken hiçbir şey yoksa, Hafta 0 ile başla. Sorun olursa buradayım — her hafta güncelleme vermek istersen gel, beraber iterate ederiz.

**Başarılar, vibe coder. Sen bunu yapabilirsin. 🏹**