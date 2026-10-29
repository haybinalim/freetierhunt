Elbette! Her iki parçayı da indirilebilir `.md` dosyaları olarak hazırlıyorum. Aşağıda tam içerikleri bulacaksın — bunları kopyalayıp kendi dosyalarını oluşturabilirsin.

---

## 📥 İndirme Talimatları

### Yöntem 1: Manuel Kopyalama (En Kolay)
1. Aşağıdaki her kod bloğunu (```` ``` ```` içindeki) tamamen kopyala
2. Bilgisayarında yeni bir text editör aç (VS Code, Notepad++, TextEdit)
3. İçeriği yapıştır
4. `freetierhunt-v3-part1-strateji.md` ve `freetierhunt-v3-part2-execution.md` olarak kaydet

### Yöntem 2: Terminal ile (Geliştirici Yöntemi)
Mac/Linux'ta terminalde:
```bash
# Dosyaları oluştur
touch freetierhunt-v3-part1-strateji.md
touch freetierhunt-v3-part2-execution.md

# VS Code ile aç
code freetierhunt-v3-part1-strateji.md
code freetierhunt-v3-part2-execution.md
```

Sonra aşağıdaki içerikleri yapıştır.

---

# 📄 DOSYA 1: `freetierhunt-v3-part1-strateji.md`

Aşağıdaki tüm içeriği kopyala ve `freetierhunt-v3-part1-strateji.md` olarak kaydet:

```markdown
# FreeTierHunt — İmplementasyon Raporu v3.0
## Parça 1: Strateji, Mimari & Karar Özeti

**Proje:** FreeTierHunt  
**Tagline:** *"The credits you need to bring your idea to life."*  
**Hedef:** AI araçlarının ücretsiz krediler, trial'lar, promo kodları ve öğrenci indirimlerini tek yerde sunan vibe-coder dostu agregatör  
**Kurucu:** Solo vibe coder, haftada 21 saat, $0 bütçe  
**Zaman Dilimi:** 12 hafta MVP, 6 ay organic büyüme, 12 ay sürdürülebilirlik  
**Rapor Tarihi:** 2026  
**Versiyon:** 3.0

---

## 📑 İçindekiler

1. [Yönetici Özeti](#1-yönetici-özeti)
2. [Vizyon & Manifesto](#2-vizyon--manifesto)
3. [Ürün Tanımı](#3-ürün-tanımı)
4. [Hedef Kitle](#4-hedef-kitle)
5. [Kaynak Envanteri](#5-kaynak-envanteri)
6. [Teknik Mimari](#6-teknik-mimari)
7. [Veri Pipeline](#7-veri-pipeline)
8. [OpenClaw Ajan Mimarisi](#8-openclaw-ajan-mimarisi)
9. [Tasarım Sistemi](#9-tasarım-sistemi)
10. [Monetizasyon](#10-monetizasyon)
11. [Büyüme Stratejisi](#11-büyüme-stratejisi)
12. [Risk Yönetimi](#12-risk-yönetimi)
13. [Yasal & Etik Çerçeve](#13-yasal--etik-çerçeve)
14. [Başarı Kriterleri](#14-başarı-kriterleri)
15. [Kritik Karar Özeti](#15-kritik-karar-özeti)

---

## 1. Yönetici Özeti

### 1.1 Tek Cümleyle

**FreeTierHunt**, vibe coder'ların ve AI tinkerer'ların yeni AI araçlarını **ücretsiz veya indirimli** denemesi için gerekli kredileri, deneme sürelerini, promo kodlarını ve öğrenci indirimlerini Product Hunt, Indie Hackers ve diğer kaynaklardan otomatik toplayıp tek panelde sunan bir kaynak havuzudur.

### 1.2 Neden Bu Proje?

Kurucu, **aylık en az $78 AI araç harcaması** yapıyor (Google AI Pro + ChatGPT Business + Windsurf Pro). Senin gibi on binlerce vibe coder var. Yeni çıkan her AI aracında promo kod, free tier veya student discount olabilir ama bu bilgiler **6+ kaynakta dağınık** ve **24-72 saatte expire** oluyor.

FreeTierHunt bu boşluğu doldurur: **kullanıcı para tasarrufu eder, makerlar launch trafiği alır, ekosistem kazanır.**

### 1.3 Lifestyle Hedefi

Bu VC-backed bir unicorn değil. Hedef:
- **Ay 1-6:** Kendim için çalışan bir proje (aylık $30+ tasarruf)
- **Ay 6-12:** 500-2000 kullanıcılı organik bir topluluk
- **Ay 12+:** Affiliate geliri ile **kendini finanse eden** bir proje ($50-500/ay)
- **Yıl 2+:** İsteğe bağlı büyüme — ya Pro tier, ya da open source rehber projeye dönüştürme

### 1.4 Haksız Avantaj

Kurucu bu projenin **ideal kullanıcısıdır**. Bu indie maker dünyasının en güçlü silahı: *"founder-market fit."*

- ✅ Kendin vibe coder'sın → target persona = sen
- ✅ Kendi ihtiyacın var → motivasyon tükenmez
- ✅ OpenClaw + 20K Firecrawl + multi-LLM access → rakiplerin sahip olmadığı teknik güç
- ✅ $0 bütçe + Oracle Always Free + Vercel Free = sürdürülebilir cost yapısı
- ✅ Türkiye'de konumlan + dünyayı hedefle = düşük cost, yüksek reach

---

## 2. Vizyon & Manifesto

### 2.1 Vizyon Cümlesi

> **"Her indie maker'ın, fikrini hayata geçirmek için gereken bütün krediler cebine girsin."**

### 2.2 Misyon (3 yıl)

1. **Transparency:** Expired kodları asla gizleme. "Last checked" timestamp her teklifte.
2. **No gatekeeping:** Ana feature'lar sonsuza kadar ücretsiz kalacak.
3. **Community first:** Submission'ları bireysel makerlar yapacak, topluluk doğrulayacak.
4. **Maker-friendly:** Hiçbir maker'a kendi ürününü "scrape edilmiş" hissettirme — takedown talepleri 24 saat içinde çözülür.

### 2.3 Değerler (Ürün Kararlarında Pusula)

| Değer | Pratik Anlamı |
|-------|---------------|
| **Sadelik** | Feature eklemeden önce "gerçekten ihtiyaç var mı?" sor |
| **Otantiklik** | Fake marketing, fake reviews, fake urgency yok |
| **Otomasyon** | Manuel iş 2 saatten uzun sürerse ajanla automate et |
| **Bootstrapping** | $10'dan fazla aylık harcama = red flag, alternatif ara |
| **Öğrenme** | Her hafta 1 yeni şey öğren, paylaş |

### 2.4 Yaratılış Hikayesi (Marketing Story)

> *"Ben de sizin gibi vibe coder'ım. Her ay Cursor, ChatGPT, Windsurf, Midjourney gibi araçlara $80+ ödüyordum. Sonra fark ettim: çoğunun yıllarca kimsenin bilmediği free tier'ları, student discount'ları, launch promo'ları var. Ama bunları bulmak 6 kaynak taramak demek. Ben de düşündüm: bunu bir kez yapayım, herkes kullansın. İşte FreeTierHunt burada."*

Bu hikaye **launch day Twitter thread'inin** temelini oluşturacak.

---

## 3. Ürün Tanımı

### 3.1 Ne YAPACAK?

1. **Keşif:** Yeni çıkan AI araçlarını otomatik listeler (PH + IH + diğer kaynaklar)
2. **Teklif Agregasyonu:** Her araç için **tüm aktif teklifleri** gösterir (free tier, trial, promo, student, LTD)
3. **Doğrulama:** Topluluk + ajan ile teklifleri doğrular, expired olanları flag'ler
4. **Arama & Filtre:** Kategori, teklif tipi, en yüksek indirim, en yeni
5. **Tasarruf Hesabı:** Kullanıcıya "bu ay $X tasarruf ettin" gösterir
6. **Submission:** Topluluk yeni teklifler ekleyebilir (ajan doğrulaması sonrası yayınlanır)

### 3.2 Ne YAPMAYACAK? (V1'de)

- ❌ Stack builder (V2'de)
- ❌ Mobile app (V2+)
- ❌ Chrome extension (V2'de)
- ❌ Enterprise tier (belki hiç)
- ❌ Maker dashboard (V2'de)
- ❌ Paid subscription (6 ay sonra değerlendirilir)
- ❌ Student verification sistemi (sadece GitHub Student Pack link'i gösteririz)
- ❌ Fiyat karşılaştırma (V2'de)
- ❌ Otomatik kod uygulama (Honey gibi, V3+)

### 3.3 Core User Journey (İlk Ziyaret)

```
1. Landing page: "Today's Top 10 AI Credits" tablosu (scrollable, filtrelemeli)
   ├─ Her satır: Logo + Ürün adı + Teklif tipi badge + "Claim" butonu
   └─ Üst banner: "$X saved by community this week"

2. Kullanıcı bir teklife tıklar
   ├─ Ürün detay sayfası açılır
   ├─ Tüm aktif tekliflerini yan yana görür
   └─ "Copy code & visit site" butonu

3. "Did it work?" modal (24h sonra email/bildirim)
   ├─ 👍 Works → trust score +
   └─ 👎 Doesn't work → flag, re-verify

4. "Save $30/mo" prompt → free account signup
   ├─ Email ile kayıt
   └─ Dashboard: "My Saved Offers" + "This month: $X saved"
```

### 3.4 Ürün-Pazar Uyumu Sinyalleri

Proje **doğru yolda** olduğunu şu sinyallerle anlayacağız:
- ✅ Kendi her hafta kullanıyor mu?
- ✅ X'te kendiliğinden paylaşan var mı? (organic mention)
- ✅ Submission gelen var mı? (community participation)
- ✅ "Bu kod hâlâ çalışıyor!" feedback'i geliyor mu?
- ✅ Bir makerdan "teşekkür" veya "kendi kodumu da ekleyebilir miyim" mesajı?

---

## 4. Hedef Kitle

### 4.1 Primary Persona: "Vibe Coder Veli"

```yaml
profile:
  age: 22-35
  location: Global (Türkiye, Hindistan, Amerika, Avrupa)
  role: Solo maker, öğrenci, yan proje geliştiricisi
  tech_level: Windsurf/Cursor kullanıcısı, kod bilmese de projeler çıkarıyor
  monthly_ai_spend: $30-200
  
pain_points:
  - Premium AI araçları pahalı, bütçesi yetmiyor
  - Free tier'ların nerede olduğunu bilmiyor
  - Her yeni araç için fiyat/teklif araştırması yorucu
  - Trial bitince devam etmek istediği ama ücretsiz alternatif arıyor
  
channels_active:
  - X/Twitter (@ Türk + global indie maker çevresi)
  - Reddit (r/SideProject, r/ChatGPTCoding, r/LocalLLaMA)
  - YouTube (AI tutorials izliyor)
  - Discord (çeşitli indie maker sunucular)
  
jobs_to_be_done:
  - "Yeni AI aracını risksiz denemek istiyorum"
  - "Ayda $100+ AI harcamamı $20'ye düşürmek istiyorum"
  - "Öğrenciyken sahip olduğum avantajları maksimize etmek istiyorum"
  - "Yeni çıkan aracı launch gününde promo kodla almak istiyorum"
```

### 4.2 Secondary Persona: "Student Ayşe"

- Üniversite öğrencisi CS/Design alanında
- GitHub Student Pack'e üye ama diğer fırsatları bilmiyor
- Aylık AI bütçesi $0-15
- Ücretsiz + öğrenci indirimli araçlar için **en sadık kullanıcı olur**
- GitHub Student Pack'e erişim bizim için **trust signal**

### 4.3 Tertiary Persona: "Content Creator Canan"

- YouTube/TikTok AI tutorials
- Video'larında "işte kullandığım araçlar, burada %X indirim" paylaşıyor
- Affiliate link'leri için bizi kullanabilir
- V2'de **creator program**a geçiş

### 4.4 NOT Hedef Kitle

- ❌ Enterprise IT alıcıları (B2B, long sales cycle)
- ❌ Agency/consultancy (başka ihtiyaçları var)
- ❌ Non-technical kullanıcılar (ürünlerimiz onlara yabancı)
- ❌ Pazarlamacılar (SEO/ad tool'lar aramıyoruz)

### 4.5 İlk 100 Kullanıcı Nereden?

**Somut kanal listesi** (priority sırayla):

1. **Kişisel ağ:** X'teki 200 takipçi, tanıdık vibe coder'lar (15-20 user)
2. **Reddit strategic posts:**
   - r/SideProject ("I built a tool to track AI free tiers")
   - r/ChatGPTCoding
   - r/LocalLLaMA
   - r/ClaudeAI
   - r/cursor
   - r/WindSurfCascade (20-30 user)
3. **Indie Hackers:** "I launched today" post (10-15 user)
4. **Discord sunucuları:**
   - Build in Public Discord
   - Indie Hackers Discord
   - Cursor/Windsurf community
   - Turkish AI Discord sunucuları (5-10 user)
5. **Direct outreach:** Twitter'da AI deal tweet'i atan 20-30 kişiye DM (10-15 user)
6. **Product Hunt:** 3 ay build-in-public sonrası büyük launch (20-30 user)

**Toplam hedef:** İlk 3 ayda **100-150 kullanıcı** (hiç para harcamadan)

---

## 5. Kaynak Envanteri

### 5.1 Sahip Olduklarınız (Altın Madeni)

| Kaynak | Spec | Parasal Eşdeğer | Projede Kullanımı |
|--------|------|-----------------|-------------------|
| **Oracle Always Free** | 4 CPU ARM + 24GB RAM + 200GB storage | ~$150/ay | Background workers, cron jobs, DB, OpenClaw |
| **OpenClaw kurulumu** | ChatGPT + NVIDIA NIM bağlı | ~$50/ay | Tüm ajan görevleri |
| **Firecrawl** | 20.000 kredi | ~$200 (bir seferlik) | Pricing page enrichment, deep scraping |
| **Google AI Pro** | Gemini 2.5 Pro API access | $20/ay | Secondary LLM (backup) |
| **ChatGPT Business** | GPT-4o, GPT-4.1 | $30/ay | Primary extraction (via OpenClaw) |
| **Windsurf Pro** | Cascade AI, premium models | $15/ay | **Kod yazma aracın** |
| **NVIDIA NIM** | 40 req/dk, GLM/Kimi/Minimax | $0 (rate limit only) | Backup LLM, experiments |
| **OpenRouter Free** | Llama, Mistral, Qwen models | $0 | Tertiary LLM, low-stakes tasks |
| **Groq Free Tier** | Llama 3.1/3.3, çok hızlı | $0 | Primary LLM (hız odaklı) |
| **Cloudflare Hesap** | Free tier | $0 | DNS, CDN, DDoS koruma |
| **GitHub Free** | Public repos, 2K Actions min/ay | $0 | Code hosting, CI/CD |
| **Haftada 21 saat** | 3 saat/gün | Paha biçilmez | Execution |

**Toplam ekosistem değeri: ~$500+/ay seviyesinde kaynakla $0 efektif maliyet.**

### 5.2 Alınması Gerekenler (Launch Öncesi)

| Item | Maliyet | Zorunluluk | Zamanlama |
|------|---------|------------|-----------|
| **Domain (freetierhunt.com)** | ~$12/yıl | **Zorunlu** | Hafta 1 |
| **Vercel Pro** (ihtiyaç olursa) | $20/ay | Opsiyonel | V2'de |
| **Resend email** | Free tier: 3K email/ay | **Zorunlu** (free) | Hafta 4 |
| **Brave Search API** | Free tier mevcut | Opsiyonel | Hafta 8+ |
| **Tavily API** | Free tier mevcut | Opsiyonel | Hafta 8+ |

**Launch için gereken minimum ek harcama: $12 (domain)**

### 5.3 Free Tier'larla Hangi Limitlerdeyiz?

| Servis | Free Tier Limit | Ne Zaman Yetmez? |
|--------|-----------------|-------------------|
| **Vercel** | 100GB bandwidth/ay + 100GB-hours serverless | ~50K unique/ay sonrası |
| **Supabase** | 500MB DB + 2GB bandwidth + 50K MAU auth | ~10K MAU sonrası |
| **Meilisearch self-host** | Oracle'da, sınırsız | Hiç yetmez |
| **Cloudflare** | Sınırsız CDN + 100K Worker req/gün | ~200K visit/gün sonrası |
| **Resend** | 3K email/ay, 100/gün | ~1K abone sonrası |
| **GitHub Actions** | 2K dakika/ay | ~20 deploy/gün sonrası |

**Sonuç:** İlk 10K aylık unique visitor'a kadar **tamamen $12/yıl** (sadece domain) maliyetle çalışabilirsin. Bu, lifestyle hedefi için mükemmel.

### 5.4 LLM Multi-Provider Strateji

Tek provider'a bağlı kalmamak için **fallback chain**:

```
Extraction Request
   │
   ▼
[1] Groq (Llama 3.3 70B) — PRIMARY
   ├─ Hız: 500 tokens/sec
   ├─ Kalite: Yeterli
   ├─ Ücret: Free tier (30 req/dk)
   └─ Kullanım: %70 task'lar
   │
   ├─ Fail / rate limit
   ▼
[2] OpenRouter (Llama 3.1 405B free) — SECONDARY
   ├─ Hız: Orta
   ├─ Kalite: Yüksek
   ├─ Ücret: Free tier
   └─ Kullanım: %20 task'lar (complex)
   │
   ├─ Fail / capacity
   ▼
[3] ChatGPT Business (GPT-4o-mini) — TERTIARY
   ├─ Zaten ödüyorsun (sunk cost)
   ├─ Kalite: En iyi
   └─ Kullanım: %8 task'lar (yüksek öncelik)
   │
   ├─ Fail
   ▼
[4] NVIDIA NIM (Kimi K2.5) — BACKUP
   ├─ Rate limit: 40 req/dk
   ├─ Kalite: Yüksek (GLM 4.5 / Kimi K2)
   └─ Kullanım: %2 task'lar (overflow)
```

**Tahmini aylık LLM cost: $0** (hepsi free tier veya sunk cost)

---

## 6. Teknik Mimari

### 6.1 Stack Kararı (Final)

```yaml
frontend:
  framework: Next.js 15 (App Router)
  styling: Tailwind CSS + shadcn/ui (customized brutal)
  state: Zustand + TanStack Query
  hosting: Vercel Free Tier

backend:
  runtime: Next.js API Routes + Server Actions
  orm: Drizzle (type-safe, vibe-coding dostu)
  database: Supabase (500MB free, Postgres)
  auth: Supabase Auth (free, email magic link)
  search: Meilisearch (self-host on Oracle)
  cache: Upstash Redis Free (10K req/gün)

workers:
  platform: Oracle Always Free VM
  orchestration: BullMQ + Redis
  scheduler: node-cron
  agents: OpenClaw (existing)

scraping:
  primary: Product Hunt GraphQL API (resmi)
  rss: Indie Hackers RSS feeds
  enrichment: Firecrawl (pricing pages)
  fallback: Playwright (Oracle'da, bot detection için)

llm:
  routing: Custom LLM router (4-tier fallback)
  providers: Groq + OpenRouter + OpenAI + NVIDIA NIM

devops:
  ci_cd: GitHub Actions (free 2K min)
  monitoring: Vercel Analytics + PostHog free
  error_tracking: Sentry free (5K errors/ay)
  logs: Oracle VM + Axiom free (500MB/ay)

communications:
  email: Resend free (3K/ay)
  dns: Cloudflare free
```

### 6.2 Yüksek Seviye Mimari Diyagramı

```
┌────────────────────────────────────────────────────────┐
│  KULLANICI (browser)                                   │
└────────────────┬───────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────┐
│  CLOUDFLARE (CDN + DNS + DDoS)                         │
└────────────────┬───────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────┐
│  VERCEL (Next.js App)                                  │
│  • Server-side rendering                                │
│  • API routes                                           │
│  • Edge functions (light logic)                         │
└───────┬──────────────────────┬──────────────────────────┘
        │                      │
        ▼                      ▼
┌──────────────┐      ┌──────────────────────────────────┐
│  SUPABASE     │      │  ORACLE ALWAYS FREE (workers)    │
│  • Postgres   │      │  • BullMQ + Redis                 │
│  • Auth       │      │  • OpenClaw (agents)              │
│  • Storage    │      │  • Meilisearch                    │
└───────────────┘      │  • Cron jobs                      │
                       │  • Playwright (fallback scrape)  │
                       └───────┬───────────────────────────┘
                               │
                               ▼
                       ┌──────────────────────────────────┐
                       │  EXTERNAL APIs                    │
                       │  • PH GraphQL                     │
                       │  • Firecrawl                      │
                       │  • Groq / OpenRouter / OpenAI     │
                       │  • Brave / Tavily                 │
                       │  • Resend                         │
                       └──────────────────────────────────┘
```

### 6.3 Monorepo Yapısı (Turborepo)

```
freetierhunt/
├── apps/
│   ├── web/                      # Next.js app (Vercel)
│   │   ├── app/
│   │   │   ├── page.tsx          # Ana sayfa (top 10)
│   │   │   ├── products/[slug]/page.tsx
│   │   │   ├── submit/page.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   └── api/
│   │   ├── components/
│   │   └── lib/
│   │
│   └── worker/                   # Oracle VM (background)
│       ├── jobs/
│       │   ├── scrape-ph.ts
│       │   ├── scrape-ih.ts
│       │   ├── extract-offers.ts
│       │   ├── verify-offers.ts
│       │   └── send-digest.ts
│       └── index.ts
│
├── packages/
│   ├── db/                       # Drizzle schema + migrations
│   ├── llm/                      # LLM router + prompts
│   ├── scrapers/                 # Per-source adapters
│   ├── agents/                   # OpenClaw integrations
│   └── ui/                       # Shared components
│
├── turbo.json
└── package.json
```

### 6.4 Neden Bu Stack?

| Karar | Alternatif | Neden Bu? |
|-------|-----------|-----------|
| **Next.js** | Remix, Astro | Windsurf/Cursor en iyi Next.js biliyor, ekosistem geniş |
| **Supabase** | Neon, Oracle DB | Auth + Storage + DB tek yerde, vibe coding dostu |
| **Drizzle** | Prisma | Daha hızlı, daha az sihir, TS-native |
| **Tailwind** | Vanilla CSS | shadcn/ui ekosistemi, prototip hızı |
| **Vercel** | Railway, Fly | Next.js native, free tier cömert |
| **Oracle workers** | Railway | Zaten var, sıfır ek maliyet |
| **BullMQ** | Inngest | Self-host, ücretsiz |
| **Meilisearch** | Algolia | Self-host free, Algolia $50/ay başlıyor |

---

## 7. Veri Pipeline

### 7.1 Veri Kaynak Stratejisi

**İlk 3 ay için 3 kaynak:**

1. **Product Hunt (Primary)** — GraphQL API
   - Günlük: Top 50 launches + their comments
   - Complexity budget: 6000/15min (yeterli)
   - Maker's Comment = altın madeni (promo kodları burada)

2. **Indie Hackers (Secondary)** — RSS + light scraping
   - RSS feeds: `show-ih.rss`, `launched.rss`
   - 30 dk güncelleme
   - Rate limit: 1 req/2sn

3. **Uneed.best (Tertiary)** — Daily scrape
   - Günde 1 kez
   - Küratörlük edilmiş PH dışı ürünler

### 7.2 Pipeline Akışı

```
┌─────────────────────────────────────────────────────┐
│ 1. SCHEDULER (cron jobs, Oracle VM)                 │
│    - Every 30 min: PH leaderboard fetch             │
│    - Every 60 min: IH RSS fetch                     │
│    - Every 24 hour: Uneed scrape                    │
└────────────────┬────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────┐
│ 2. RAW STORAGE (Supabase Storage, s3-compatible)    │
│    raw/ph/2026-04-22/post-123.json                  │
│    raw/ih/2026-04-22/post-456.json                  │
└────────────────┬────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────┐
│ 3. NORMALIZER (worker)                              │
│    - Parse raw → ProductCandidate                    │
│    - Dedupe by domain                                │
│    - Upsert to products table                        │
└────────────────┬────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────┐
│ 4. EXTRACTION PIPELINE                              │
│    ┌─────────────────────────────────────────┐      │
│    │ 4a. Regex pre-filter (fast, free)       │      │
│    │     - "code", "trial", "discount" signals│      │
│    │     - Skip if no signal (saves LLM cost)│      │
│    └─────────────────────────────────────────┘      │
│                     ▼                               │
│    ┌─────────────────────────────────────────┐      │
│    │ 4b. LLM Extractor (OpenClaw agent)      │      │
│    │     - Structured JSON output             │      │
│    │     - Confidence score                   │      │
│    │     - Multi-provider fallback            │      │
│    └─────────────────────────────────────────┘      │
│                     ▼                               │
│    ┌─────────────────────────────────────────┐      │
│    │ 4c. Schema Validator (Zod)              │      │
│    │     - Code format check                  │      │
│    │     - Discount sanity                    │      │
│    └─────────────────────────────────────────┘      │
└────────────────┬────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────┐
│ 5. VERIFICATION (Validator Agent)                   │
│    - URL reachable? (head request)                   │
│    - Product website'ta teklif görünür mü?          │
│    - Firecrawl ile pricing page parse (1 kredi)     │
│    - Trust score hesapla                             │
└────────────────┬────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────┐
│ 6. DB UPSERT                                         │
│    - offers tablosu                                  │
│    - status = 'active' if trust > 0.6                │
│    - status = 'pending_review' if 0.3-0.6            │
│    - status = 'rejected' if < 0.3                    │
└────────────────┬────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────┐
│ 7. INDEX UPDATE (Meilisearch)                        │
│    - Full-text search index refresh                  │
└────────────────┬────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────┐
│ 8. NOTIFICATION                                      │
│    - New offer matching user alerts → queue          │
│    - Digest email collection                         │
└─────────────────────────────────────────────────────┘
```

### 7.3 Firecrawl Strateji (20K kredi için 3 yıl)

**Akıllı kullanım planı:**

| Kullanım | Kredi/çağrı | Sıklık | Aylık kredi |
|----------|-------------|--------|-------------|
| Yeni ürün pricing page | 1 | ~100/ay (yeni launches) | 100 |
| Haftalık freshness check | 1 | Top 100 ürün × 4 hafta | 400 |
| Deep dive (full site crawl) | 3 | Sadece "featured" ürünler, 10/ay | 30 |
| Ad-hoc research | 1 | 50/ay | 50 |
| **TOPLAM AYLIK** | | | **~580** |

**20.000 / 580 = 34 ay ≈ 3 yıl yetiyor.** 🎯

**Fallback:** Firecrawl kredisi biterse:
- Playwright (Oracle'da self-host)
- Brave Search API (free tier)
- Tavily API (free tier)

### 7.4 Veri Modeli Özeti

```typescript
// Simplified schema — tam versiyonu Parça 2'de
products: {
  id, slug, name, tagline, description,
  website_url, website_domain, logo_url,
  categories, tags, is_ai_native,
  ph_id, ih_url,
  first_seen_at, last_launched_at,
  embedding (pgvector)
}

offers: {
  id, product_id, type, status,
  code, title, description,
  discount_pct, trial_days,
  redemption_url, conditions,
  source, source_url, extracted_from,
  extraction_confidence, llm_model,
  verified, trust_score, last_checked_at,
  upvotes, downvotes, works_count, doesnt_work_count,
  valid_from, valid_until,
  created_at
}

users: {
  id, email, name,
  github_id, twitter_id,
  is_student, is_maker,
  total_saved_usd,  // total tasarruf
  created_at
}

saved_offers: {
  user_id, offer_id, used, saved_usd, saved_at
}
```

Tam şema Parça 2'de.

---

## 8. OpenClaw Ajan Mimarisi

### 8.1 Ajan Stratejisi

OpenClaw senin **yarı otonom teknik ortağın** olacak. 4 ana ajan:

### 8.2 MVP Ajanlar (Hafta 1-12)

#### 🤖 Agent 1: Deal Extractor Agent

**Görev:** PH comment'larından ve IH post'larından promo/trial bilgilerini çıkarmak

**Input:** Ham metin (comment body, post content)
**Output:** Structured offer JSON

**Workflow:**
```
1. Regex pre-filter (has "code"/"trial"/"discount"?)
   ├─ No signals → skip
   └─ Yes → continue
2. LLM call (Groq first, fallback chain)
3. Validate schema
4. Calculate confidence
5. Return structured offer
```

**Prompt** (Parça 2'de tam hali):
```
You are a promo code extractor.
Given the text, return JSON with all offers found.
Types: promo_code | free_trial | student_discount | ...
Be strict, not generous.
Empty array if no offers.
```

**Tahmini kullanım:** 300 extraction/gün → Groq free tier yeterli

#### 🤖 Agent 2: Submission Validator Agent

**Görev:** Topluluktan gelen submission'ları otomatik doğrulamak

**Workflow:**
```
1. URL reachable mi? (head request)
2. Firecrawl ile landing page scrape (1 kredi)
3. LLM call:
   - "Bu sayfada '{code}' kodu görünüyor mu?"
   - "Bu sayfada '{trial_days} day free trial' bilgisi var mı?"
4. Confidence > 0.7 → auto-approve
   0.4-0.7 → human review queue
   < 0.4 → auto-reject
```

**Tahmini kullanım:** 10-30 submission/gün → tamamen ücretsiz

### 8.3 V2 Ajanlar (Hafta 13-24)

#### 🤖 Agent 3: Freshness Checker Agent

**Görev:** Haftalık aktif offer'ları kontrol et, expired olanları flag

**Workflow:**
```
Her Pazar sabah:
1. status='active' offerları listele
2. Her biri için:
   a. Firecrawl ile redemption_url scrape
   b. Kod/teklif hâlâ sayfada mı?
   c. "Expired" ibaresi var mı?
3. Sonuçlara göre:
   - Still active → last_checked_at güncelle
   - Expired → status='expired', notify submitter
```

**Tahmini kullanım:** Haftada ~400 check = ayda 1600 Firecrawl credit

#### 🤖 Agent 4: Content Agent

**Görev:** Günlük top deal'leri tweet'e dönüştür

**Workflow:**
```
Her sabah 09:00:
1. Dün eklenen/yükselen top 3 offer'ı çek
2. LLM call: "Write a 280-char tweet in the style of @pieterlevels
   about this deal: {offer}"
3. Oluştur → Sana onaya gönder (Telegram bot veya email)
4. Sen "✅ onayla" → Twitter API ile post
```

**Tahmini kullanım:** Günde 1-3 tweet → minimum LLM cost

### 8.4 V3 Ajan (Hafta 25+)

#### 🤖 Agent 5: Discovery Agent

**Görev:** X/Reddit/HN'de proaktif promo aramak

**Workflow:**
```
Her 6 saatte:
1. Queries:
   - "AI tool" + "promo code" + 24h filter
   - "launched" + "discount" + Reddit
   - "{product_name} code" (top 500 ürün için)
2. Brave/Tavily API ile search
3. Sonuçları LLM'e gönder, offer olup olmadığını değerlendir
4. Otomatik eklemek yerine "suggested" queue'ya koy
5. Sen gözden geçir, onayla
```

**Tahmini kullanım:** Günde 30-50 query → Brave free tier yeterli

### 8.5 Ajan Orkestrasyonu

```
┌────────────────────────────────────────┐
│       OpenClaw (Oracle VM)             │
│  ┌──────────────────────────────┐      │
│  │ Orchestrator (main loop)     │      │
│  │  - Task queue                │      │
│  │  - LLM router                │      │
│  │  - Error handling            │      │
│  └──────┬───────────────────────┘      │
│         │                              │
│    ┌────┴────┬────────┬────────┐       │
│    ▼         ▼        ▼        ▼       │
│  Extractor  Valid   Freshness Content  │
│  Agent      Agent   Agent    Agent     │
└─────────────────────────────────────────┘
         │         │         │         │
         ▼         ▼         ▼         ▼
      [LLM Router: Groq→OpenRouter→GPT→NIM]
```

### 8.6 Insan-Ajan İş Bölümü

| Görev | Kim Yapar? | Frekans |
|-------|------------|---------|
| Yeni kaynak keşfi | Sen + Discovery Agent | Haftalık |
| Prompt iyileştirme | Sen | 2 haftada 1 |
| Edge case debugging | Sen | Günlük (ilk ay) |
| Content tweet onayı | Sen | Günlük |
| Submission auto-approve | Agent | Sürekli |
| Freshness check | Agent | Haftalık |
| Extraction | Agent | Sürekli |
| Community moderation | Sen | Haftalık (ilk başta) |

**Tahmini senin haftalık manuel iş: 3-5 saat** (kalanı otomatik)

---

## 9. Tasarım Sistemi

### 9.1 Nomadlist-Inspired Brutal Design

**Ana prensipler:**
1. **Function > form:** Her piksel değer yaratsın
2. **Ugly-beautiful:** Süslü değil, karakterli
3. **Info-dense:** Tablolar, listeler, raw data
4. **No SaaS tropes:** Gradient'siz, illustration'sız, stock photo'suz

### 9.2 Renk Paleti

```css
:root {
  --bg-primary: #FFD700;       /* Sarı — ana arka plan */
  --bg-secondary: #FFFFFF;      /* Beyaz — cards */
  --bg-accent: #000000;         /* Siyah — header, buttons */
  --text-primary: #000000;      /* Siyah — ana metin */
  --text-secondary: #333333;    /* Koyu gri */
  --text-link: #0000FF;         /* Saf mavi — linkler */
  --border: #000000;            /* Siyah — tüm border'lar */
  --success: #00FF41;           /* Matrix yeşil */
  --warning: #FF6600;           /* Turuncu */
  --error: #FF0000;             /* Saf kırmızı */
}
```

### 9.3 Tipografi

```css
/* Başlıklar ve vurgu */
font-family: 'IBM Plex Mono', 'Courier New', monospace;

/* Normal metin */
font-family: 'Inter', 'Helvetica Neue', sans-serif;

/* Sayılar ve kodlar */
font-family: 'JetBrains Mono', monospace;

/* Boyutlar */
--font-xs: 12px;
--font-sm: 14px;
--font-base: 16px;
--font-lg: 20px;
--font-xl: 28px;
--font-2xl: 40px;
```

### 9.4 UI Component Kılavuzu

**Örnek: Offer Card**

```
┌──────────────────────────────────────────┐  ← siyah 2px border
│ [LOGO] Cursor Pro        $40/mo          │
│        AI Code Editor                    │
│                                          │
│ 🎁 GITHUB STUDENT PACK                    │  ← sarı badge
│    FREE for verified students            │
│                                          │
│ ✓ Verified 2 days ago by 34 people       │  ← küçük yeşil text
│                                          │
│ [COPY CODE]  [VISIT →]                   │  ← siyah butonlar
└──────────────────────────────────────────┘
```

**Örnek: Home Page (Top 10 Feed)**

```
╔══════════════════════════════════════════════════════════════╗
║ FREETIERHUNT 🏹                              [LOGIN] [MENU]  ║
║ Find free credits, trials, and promo codes for AI tools      ║
║ This week community saved: $14,237                           ║
╠══════════════════════════════════════════════════════════════╣
║  [🔥 TODAY] [📅 WEEK] [📈 ALL TIME]  [AI VIDEO ▼] [CATEGORY]║
╠══════════════════════════════════════════════════════════════╣
║ # │ PRODUCT      │ OFFER           │ TRUST │ CLAIM          ║
║───┼──────────────┼─────────────────┼───────┼────────────────║
║ 1 │ ElevenLabs   │ 🎁 50% off 3mo  │ ████  │ [USE LAUNCH50] ║
║ 2 │ Cursor       │ 🎓 Free student │ ████  │ [VERIFY]       ║
║ 3 │ Midjourney   │ ⏱️ 14-day trial │ ███░  │ [CLAIM]        ║
║ 4 │ HeyGen       │ 💰 $30 credit   │ ████  │ [COPY HG30]    ║
║ 5 │ fal.ai       │ 🆓 $5 signup    │ ████  │ [SIGN UP →]    ║
║...                                                            ║
╚══════════════════════════════════════════════════════════════╝
```

### 9.5 Kritik UI Kuralları

- ✅ **Border:** Her kart, her buton 2px solid black
- ✅ **Shadow:** `box-shadow: 4px 4px 0px #000000` (brutal)
- ✅ **Hover:** `translate: -2px -2px` + `shadow: 6px 6px 0 #000`
- ❌ **Border-radius:** 0px (keskin köşeler) veya max 2px
- ❌ **Gradient:** Yok
- ❌ **Animation:** Minimum (sadece hover + loading)
- ✅ **Emoji:** Bol bol (deal tipi için: 🎁 🎓 ⏱️ 💰 🆓 🎉)
- ✅ **Monospace:** Sayılar, kodlar, timestamps için

### 9.6 Mobile Responsive

```
Mobile (< 640px):
- Grid → single column
- Tablo → card view
- Nav → hamburger
- Filters → bottom sheet

Tablet (640-1024px):
- 2 column grid
- Nav visible

Desktop (> 1024px):
- Tablo view default
- Full nav
- Side filters
```

---

## 10. Monetizasyon

### 10.1 6-Ay Plan: Tamamen Ücretsiz

**Aylar 1-6:**
- Hiçbir paywall yok
- Hiçbir pro tier yok
- Affiliate link'ler açıkça disclose edilir: "This is an affiliate link, we may earn commission"
- Tek gelir: **affiliate commission** (pasif, sessiz)

**Neden?**
- Lifestyle hedefi = para baskısı yok
- Trust + community kazanmak = long-term value
- Erken monetize = wrong signals, wrong users

### 10.2 Ay 6-12: Affiliate Optimizasyonu

**Odak:** Affiliate programları olan tool'larla partnership kur.

**Affiliate potansiyel (sample):**
| Tool | Commission | Estimated Revenue/mo (at 1K users) |
|------|------------|-------------------------------------|
| ElevenLabs | 20% first month | $50-100 |
| Jasper | 30% recurring | $100-200 |
| Writesonic | 30% first 12mo | $80-150 |
| Canva Pro | $36/signup | $60-100 |
| Grammarly | $0.20/signup | $20-40 |
| **Toplam tahmini (Ay 12)** | | **$300-600/ay** |

**Bu lifestyle için yeterli:** Domain + Vercel Pro + ufak harcamalar = ~$50/ay gider. Geri kalan net kar.

### 10.3 Ay 12+: Opsiyonel Pro Tier

**Eğer kullanıcı talebi varsa** (sadece bu durumda):

**Pro Tier — $5/ay** (yumuşak fiyat):
- 📧 Instant email alerts (free: haftalık digest)
- 🔔 Custom alert queries (free: 3 alert max)
- 📊 Personal savings analytics
- 💾 Unlimited saved offers
- ⚡ Early access to new features
- ❤️ "Supporter" badge

**Hedef:** Toplam kullanıcının %2-3'ü → 2000 user × 2% = 40 × $5 = $200/ay

### 10.4 Gelir Çeşitlendirme Opsiyonları

| Kanal | Zamanlama | Tahmini Katkı |
|-------|-----------|----------------|
| Affiliate links | Ay 3+ | %70 |
| Pro subscriptions | Ay 12+ | %20 |
| Featured listings (maker ücretli placement) | Ay 18+ | %5 |
| Sponsored newsletter | Ay 24+ | %5 |

**Toplam hedef Yıl 2 MRR:** $500-1500/ay (lifestyle için ideal)

### 10.5 Affiliate Etik Kuralları

1. **Disclosure:** Her affiliate link'te "(affiliate)" etiketi
2. **Ranking bias yok:** Affiliate olan offer'ı affiliate olmayandan üste koymayız
3. **Trust > revenue:** Düşük kaliteli ama yüksek komisyonlu ürünü öne çıkarmayız
4. **Opt-out:** Kullanıcı "affiliate link'siz göster" seçeneğine sahip olur (Pro feature)

---

## 11. Büyüme Stratejisi

### 11.1 Üç Faz

#### Faz 1: Foundation (Hafta 1-12)
**Hedef:** MVP canlı + 50 kullanıcı
- Kimseye göstermE, önce sen kullan
- Hafta 10'da 10 yakın arkadaşa soft-launch
- X'te build-in-public başla (hafta 4)

#### Faz 2: Organic Growth (Ay 4-9)
**Hedef:** 500-1000 kullanıcı
- Reddit strategic posts
- IH launch post
- 2-3 Discord sunucusunda varlık
- Content marketing (blog + SEO)

#### Faz 3: Bigger Launch (Ay 9-12)
**Hedef:** 2000-5000 kullanıcı
- Product Hunt launch (artık hazırsın)
- Türkçe versiyon çıkışı
- İlk affiliate partnerships

### 11.2 X (Twitter) Stratejisi — Ajanla

Ajanının yapacakları (sana onay için sunacak):

**Günlük:**
- "Top 3 AI deals today" thread
- Bir spesifik tool hakkında detaylı post

**Haftalık:**
- "This week: X people saved $Y" brag post
- Build-in-public progress (senin stats)

**Aylık:**
- "State of AI free tiers" raporu
- Bir kategorinin derin analizi

**Senin manuel görevin:**
- Ajanın önerdiği içeriği 2 dakika içinde onayla/red et
- Haftada 2-3 kez kişisel "genuine" post (ajan değil, sen)
- Mention'lara yanıt (büyük maker'lar etkileşime girerse)

### 11.3 Reddit Stratejisi

**HAFTA 10 civarı:** İlk stratejik post.

**Format (önemli):**
```
Title: I built a tool to find free AI credits and promo codes — 
       here's what I learned about AI pricing

Body:
- Giriş: "Ben vibe coder'ım, ayda $80+ AI harcamasından sıkıldım"
- Problem: "Promo kodlar 6 kaynakta dağınık"
- Çözüm: "Bir agregatör yaptım, link bio'da"
- Değer: "İşte topladığım 5 ilginç finding" (reddit sever listeleri)
- CTA: "Feedback çok değerli, lütfen yorumlayın"

❌ SAKIN YAPMA:
- Pure ad post
- Aşırı emoji
- "Check out my amazing..." cringe
```

**Hedef subreddit'ler (posting sırası):**
1. r/SideProject (en kolay, hoşgörülü)
2. r/indiehackers
3. r/ChatGPTCoding
4. r/cursor
5. r/ClaudeAI
6. r/LocalLLaMA (dikkat: çok teknik)

### 11.4 Content Marketing (SEO)

**Hafta 8'den itibaren başla.**

**İlk 10 blog yazısı** (SEO için hedefli):

1. "Complete Guide to AI Tool Free Tiers in 2026"
2. "Cursor Student Discount: How to Get It Free"
3. "ElevenLabs vs Alternatives: Best Free TTS"
4. "Midjourney Alternatives with Free Tier"
5. "AI Video Generator Free Trial Comparison"
6. "How I Built My AI Stack for $20/month"
7. "GitHub Student Pack: Best AI Tools Included"
8. "Product Hunt Launch Deals: Weekly Roundup"
9. "Free Tier Math: Can You Really Build AI Product for $0?"
10. "NVIDIA NIM API Free Tier: Complete Guide"

**Key:** Her yazı bir **target product + "free" keyword** kombinasyonu. Long-tail SEO.

### 11.5 Türkçe Strateji (Ay 6+)

- Türkçe landing page (same content, translated)
- Türkçe blog (özgün içerik + çeviriler)
- Türk AI topluluklarına outreach
- "AI Araçları Ücretsiz Kullanma Rehberi" gibi Türkçe content

---

## 12. Risk Yönetimi

### 12.1 Risk Matrisi

| Risk | Olasılık | Etki | Puan | Azaltma |
|------|----------|------|------|---------|
| **Vibe coding karmaşık tasks'te zorlanır** | Yüksek | Yüksek | 🔴 9 | Stack basit tutuldu, modüler ilerle, her hafta sonu review |
| **PH API kısıtlanır/kapatılır** | Orta | Yüksek | 🟡 6 | 3 kaynağa yayılım, manual submission fallback |
| **Motivasyon drop (lifestyle projelerinde yaygın)** | Orta | Yüksek | 🟡 6 | Build-in-public accountability, kendi kullanım = self-motivation |
| **LLM hallucination → fake code** | Orta | Yüksek | 🟡 6 | Validator agent + community voting + last_checked |
| **Firecrawl kredi hızla tükenir** | Düşük | Orta | 🟢 4 | Akıllı kullanım planı (aylık 580 kredi) + fallback (Playwright) |
| **Oracle Free Tier kapatılır (rare ama oldu)** | Düşük | Yüksek | 🟡 5 | Haftalık DB backup + Railway/Fly hızlı migration plan |
| **Domain/trademark sorunu** | Düşük | Düşük | 🟢 2 | Hafta 1'de trademark search |
| **İlk 6 ay hiç kullanıcı gelmez** | Orta | Düşük (sen OK'sin) | 🟢 3 | Kendin için çalışıyor, OK |
| **Maker takedown request** | Düşük | Düşük | 🟢 2 | 24h takedown policy public |
| **Scraping legal issue** | Çok düşük | Yüksek | 🟢 3 | Public data only, respectful, robots.txt obedient |

### 12.2 Erken Uyarı Sinyalleri

**Weekly check:**
- [ ] Extraction accuracy %85'ten düşük mü? → Prompt iyileştirme
- [ ] LLM cost $0 ötesine çıktı mı? → Multi-provider dengele
- [ ] Oracle CPU %80+ mı? → Workload dağıt
- [ ] PH rate limit hit oldu mu? → Polling interval arttır
- [ ] Firecrawl usage 800/ay aştı mı? → Alternatif kaynak devreye al

### 12.3 "Proje Başarısız" Olma Senaryoları

**Ne zaman projeyi pause/kill ederiz?**

❌ **6 ay sonra sen bile kullanmıyorsan:** Product-market fit yok. Pivot veya kapat.

❌ **Manuel iş haftada 10 saati aşıyorsa:** Otomasyon başarısız. Ajanları gözden geçir.

❌ **İlk aylarda 3+ önemli bug sürekli tekrarlıyorsa:** Stack yanlış seçilmiş, refactor gerekir.

✅ **"Başarısız" = "devam etmeye değer değil" DEĞİL:**
- Kendin kullanıyorsan ✅ başarılı
- 20 kişi bile kullansa ✅ başarılı
- Ayda $10 tasarruf sağlıyorsa ✅ başarılı

**Başarı bar'ını düşük tut, uzun vadeye odaklan.**

---

## 13. Yasal & Etik Çerçeve

### 13.1 Yasal Temel

**Scraping Yasallığı:**
- ✅ Public data only
- ✅ robots.txt obedient
- ✅ Rate limit respect (1-2 req/sn)
- ✅ User-Agent: "FreeTierHuntBot/1.0 (+https://freetierhunt.com/bot)"
- ✅ Attribution: "Data sourced from Product Hunt, Indie Hackers"

**Yasal riskler (düşük ama var):**
- PH ToS'u scraping'i kısıtlarsa → API only mode
- Maker takedown talebi → 24h SLA

### 13.2 Gizlilik (GDPR/KVKK)

**Topladığımız:**
- Email (mandatory, auth için)
- Saved offers (optional)
- Click events (privacy-respecting, IP hash)

**Toplamadıklarımız:**
- Gerçek isim (optional)
- Konum tracking
- Third-party tracking pixels (PostHog self-host)

**Kullanıcı hakları:**
- Data export (GET /api/me/export)
- Account deletion (1 tıkla)
- Cookie consent (Cookiebot-like basit implementation)

### 13.3 Content Moderation

**Submission'lar için:**
- Ajan ön-kontrol (Validator)
- Spam detection (aynı IP 5+ submission/gün)
- Community flagging
- Sen manuel review (haftalık)

**İçerik politikası (basit):**
- No adult content
- No scam/fraud promises
- No political/religious
- No copyright violation (logo kullanımı attribution ile)

### 13.4 Maker Hakları

**Public maker rights statement:**
```
1. Your product, your offers. You own the truth.
2. Request takedown anytime: takedown@freetierhunt.com
3. We respond in 24 hours max.
4. Claim your product to manage listings (verified badge).
5. Report inaccuracies, we fix within 48 hours.
```

### 13.5 Affiliate Disclosure

**Footer'da sabit:**
> "FreeTierHunt may earn a commission when you use affiliate links. This never affects our rankings or reviews. Read our [affiliate policy]."

---

## 14. Başarı Kriterleri

### 14.1 Sen İçin Başarı

**Ana metrik:** Aylık $30+ tasarruf (self-use)

**Destekleyici metrikler:**
- Her hafta en az 2 kez kullanmak
- Kendi stack'inde **3+ aracı** FreeTierHunt üzerinden almak
- Bir arkadaşıma öneriyor olmak ("şunu dene")

### 14.2 Ürün Başarısı

| Timeline | Metrik | Hedef |
|----------|--------|-------|
| Hafta 12 | MVP live | ✅ |
| Ay 3 | Ürün sayısı | 500+ |
| Ay 3 | Aktif teklif sayısı | 150+ |
| Ay 3 | Kullanıcı sayısı | 50 |
| Ay 6 | Kullanıcı sayısı | 300 |
| Ay 6 | Aylık organic visitor | 2K |
| Ay 9 | Affiliate gelir | $50/ay |
| Ay 12 | Kullanıcı sayısı | 1K |
| Ay 12 | Aylık visitor | 10K |
| Ay 12 | Aylık gelir (affiliate) | $200+ |

### 14.3 Kalite Metrikleri

- **Extraction F1 score:** > 0.85 (offers doğru çıkartılıyor mu)
- **Verification rate:** > %70 (teklifler 7 gün içinde doğrulanmış)
- **Expired offer false positive:** < %5 (expired gösterdiğimiz ama aktif)
- **User "works!" rate:** > %75 (kullanıcıların çalıştığını onayladığı)

---

## 15. Kritik Karar Özeti

### 15.1 Tek Sayfa Özet

```
PROJE: FreeTierHunt (freetierhunt.com)
PAZARLAMA: "The credits you need to bring your idea to life."
HEDEF: Lifestyle, self-sustaining, senin için $30+/ay tasarruf

TEKNİK STACK:
  Frontend: Next.js 15 + Tailwind + shadcn/ui (brutal style)
  Backend: Supabase (DB + Auth) + Vercel (hosting)
  Workers: Oracle VM + BullMQ + OpenClaw agents
  LLM: Groq → OpenRouter → ChatGPT Business → NVIDIA NIM fallback chain
  Scraping: PH API + IH RSS + Firecrawl enrichment

KAYNAKLAR:
  Eldeki değer: ~$500/ay ekosistem, $0 efektif maliyet
  Alınacak: $12 (domain)
  Aylık cash burn: $0 (tamamen free tier)

ZAMAN:
  MVP: 12 hafta
  Soft launch: Hafta 10
  Public launch: Ay 3-4
  PH launch: Ay 9-12

MONETİZASYON:
  Ay 1-6: %100 ücretsiz, sadece affiliate (opt-in disclosed)
  Ay 6-12: Affiliate optimization
  Ay 12+: Opsiyonel $5/ay Pro tier (eğer talep varsa)

TASARIM:
  Nomadlist-inspired brutal
  Sarı + Siyah + Beyaz
  Monospace + Inter fontlar
  2px border, 0 radius, 4px box-shadow

HEDEF KİTLE:
  Primary: Vibe coder'lar (senin gibi)
  Secondary: Öğrenciler
  Tertiary: Content creator'lar

BÜYÜME:
  İlk 50: Kişisel ağ + X
  50→500: Reddit + IH
  500→2000: Content SEO + PH launch
  2000→5000: Türkçe versiyon + affiliate partners

AJANLAR (OpenClaw):
  MVP: Deal Extractor + Submission Validator
  V2: Freshness Checker + Content Agent
  V3: Discovery Agent

RİSK TOP 3:
  1. Vibe coding karmaşıklıkta zorlanır → modüler geliştir
  2. Motivasyon drop → build-in-public accountability
  3. LLM hallucination → multi-layer validation

BAŞARI:
  Sen: Ayda $30+ tasarruf
  Ürün: Ay 12'de 1K kullanıcı, $200/ay affiliate
```

### 15.2 Net Adımlar (Sonraki 7 Gün)

1. **Gün 1:** `freetierhunt.com` domain satın al (Cloudflare Registrar, $10)
2. **Gün 1:** GitHub organization "freetierhunt" oluştur
3. **Gün 2:** Supabase + Vercel hesapları (free tier)
4. **Gün 2:** Resend hesabı + DNS setup
5. **Gün 3:** Next.js 15 starter project (Windsurf ile)
6. **Gün 4:** Drizzle schema + Supabase bağlantı
7. **Gün 5:** PH API key + ilk test fetch
8. **Gün 6:** OpenClaw'da Deal Extractor Agent prototipi
9. **Gün 7:** Weekly review + Hafta 2 planning

---

## 📄 Sonraki Adım

**Parça 2: 12 Haftalık Execution Plan** dosyasını aç.

Bu parça **strateji + kararlar**. Parça 2'de şunlar var:

1. Hafta Hafta Detaylı Execution Plan (12 hafta × günlük breakdown)
2. Windsurf Prompt'ları (her task için hazır, kopyala-yapıştır prompt'lar)
3. Database Schema (tam SQL, Drizzle definitions)
4. Kod Örnekleri (kritik komponentler)
5. OpenClaw Agent Prompt'ları (detaylı extractor + validator prompt'ları)
6. Her Hafta Kontrol Listesi
7. Potansiyel Tuzaklar ve Çözümleri
8. Hafta 13+ Sonrası Yol Haritası

---

**Rapor Sonu — Parça 1**  
**© 2026 FreeTierHunt Planning Document**
```

---

# 📄 DOSYA 2: `freetierhunt-v3-part2-execution.md`

⚠️ **Önemli Not:** Parça 2 çok uzun (15K+ kelime), bu yüzden bir sonraki mesajda vereceğim. Tek mesajda token limitini aşar.

**Devam etmemi ister misin?** "Parça 2'yi ver" dediğinde, parça 2'nin tam markdown içeriğini kod bloğu içinde vereceğim.

---

## 💡 Profesyonel İpucu: Daha Kolay İndirme

Eğer çok dosya ile uğraşmak istemiyorsan, alternatif olarak:

### Seçenek A: GitHub Gist Oluştur
1. [gist.github.com](https://gist.github.com) git
2. Her iki içeriği ayrı gist olarak kaydet
3. "Raw" butonuyla .md olarak indir

### Seçenek B: Obsidian/Notion'a Yapıştır
1. Obsidian veya Notion'da iki sayfa aç
2. İçerikleri yapıştır
3. Markdown olarak export et

### Seçenek C: VS Code + Markdown Preview
1. VS Code'da `.md` dosyaları oluştur
2. Markdown preview (Cmd+Shift+V) ile görüntüle
3. İstersen PDF'e export et

---

**Parça 2'yi almak için bana "Parça 2'yi ver" de**, tam içeriği kod bloğu içinde vereyim. 🚀