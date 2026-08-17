# Discovery Worker Çalıştırma ve Test Runbook’u

**Tarih:** 17 Ağustos 2026  
**Kapsam:** Resmî kaynaklardan fırsat adayları bulan FreeTierHunt discovery worker’ı.

> Worker yalnız `active`, `official` ve `allow_automated_sync=true` kaynakları ele alır. Kaynak bir kez kontrol edilmiş olsa bile, kendi `sync_interval_minutes` süresi dolmadan tekrar taranmaz. Bu nedenle worker’ın beş dakikada uyanması, tüm kaynaklara beş dakikada bir istek atıldığı anlamına gelmez.

## 1. Ön koşullar

| Gereken | Açıklama |
|---|---|
| Node.js | Sürüm 20 veya üstü |
| pnpm | Projenin `packageManager` sürümüyle uyumlu |
| Supabase/Postgres | `DATABASE_URL` uygulama/pooler bağlantısı |
| Migration’lar | Özellikle `20260814_0006_discovery_candidates.sql` uygulanmış olmalı |
| Resmî kaynak kaydı | `/admin/sources` üzerinden eklenmiş, `allowAutomatedSync=true` kaynak |
| Worker ortamı | Yerelde `.env.local`, sunucuda repository kökünde `.env` |

Yerel ortam dosyasını oluşturun:

```bash
cd /path/to/freetierhunt
cp .env.example .env.local
chmod 600 .env.local
```

Minimum değişkenler aşağıdaki gibidir:

```dotenv
NODE_ENV=development
TZ=UTC
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
DISCOVERY_WORKER_INTERVAL_MS=300000
```

`DISCOVERY_WORKER_INTERVAL_MS`, worker’ın veritabanında zamanı gelen kaynak olup olmadığını kontrol etme aralığıdır. En düşük kabul edilen değer `60000` milisaniyedir. Üretimde `300000` (beş dakika) önerilir; asıl sağlayıcı tarama sıklığı her kaydın `sync_interval_minutes` alanıdır.

## 2. Veritabanını hazırlama

Migration’ları hedef Supabase projesinde dosya sırasına göre uygulayın. Mevcut kurulumun Telegram/kanıt katmanı kullanması halinde önceki migration’lar da bulunmalıdır.

```bash
# Proje kökünde; bağlantı ayarları .env.local içindeyken
pnpm db:push
```

Üretimde tercihen Supabase SQL Editor veya sürüm kontrollü migration uygulama aracınızla şu dosyanın uygulandığını doğrulayın:

```text
supabase/migrations/20260814_0006_discovery_candidates.sql
```

## 3. Kaynak ekleme ve tekil smoke test

Önce uygulamayı başlatın:

```bash
pnpm dev
```

Ardından yönetici olarak `/admin/sources` ekranına gidin. İlk üç önerilen resmî kaynak aşağıdadır:

| Kaynak adı | URL | Başlangıç aralığı |
|---|---|---:|
| Google Cloud Startup | `https://cloud.google.com/startup` | 360 dakika |
| AWS Activate Credits | `https://aws.amazon.com/startups/credits/` | 360 dakika |
| Cloudflare for Startups | `https://www.cloudflare.com/startups/` | 360 dakika |

Her kaynak için **Sync now** işlemini bir kez çalıştırın. Kaynak metni ilgili profilin resmî sinyalini içeriyorsa `/admin/discovery` ekranında `pending` aday görünür. Adayın resmî URL’si ve kanıt alıntısı kontrol edilir; ardından **Send to verification** ile normal doğrulama kuyruğuna alınır.

## 4. Yerel worker çalıştırma

Aşağıdaki komut worker’ı izleme modunda başlatır; ilk döngüyü hemen çalıştırır ve sonrasında yapılandırılmış aralıkta yeni döngü başlatır.

```bash
pnpm worker:dev
```

Beklenen log alanları:

```text
Worker boot
Discovery cycle completed
sourcesDue=<sayı>
sourcesSynced=<sayı>
candidatesDiscovered=<sayı>
candidatesInserted=<sayı>
```

Çalıştırmadan önce veya sonra kalite kontrollerini uygulayın:

```bash
pnpm worker:build
pnpm typecheck
pnpm test
pnpm build
```

## 5. Üretim worker başlatma

Sunucuda kaynak kodu ve bağımlılıklar yüklendikten sonra `.env` dosyasını repository köküne koyun. PM2 yapılandırması bu dosyayı otomatik yükler; dosya yalnız worker kullanıcısı tarafından okunmalıdır.

```bash
ssh ubuntu@YOUR_WORKER_HOST
cd ~/freetierhunt
pnpm install --frozen-lockfile
cp .env.example .env  # yalnız ilk kurulumda; gerçek değerleri girin
chmod 600 .env
pnpm worker:build
pnpm worker:start
pnpm worker:logs
```

Worker beklenen çalışmayı göstermiyorsa şu kontrolleri kullanın:

```bash
pnpm exec pm2 status freetierhunt-worker
pnpm exec pm2 describe freetierhunt-worker
pnpm exec pm2 logs freetierhunt-worker --lines 100
```

## 6. Güncelleme, durdurma ve geri alma

Yeni kodu aldıktan sonra sıralı dağıtım aşağıdaki gibidir:

```bash
git pull --ff-only origin main
pnpm install --frozen-lockfile
pnpm worker:build
pnpm worker:start
```

Worker’ı durdurmak için:

```bash
pnpm worker:stop
```

Bir kaynak sorunluysa tüm worker’ı durdurmak yerine `/admin/sources` ekranından kaynağı duraklatın veya `allowAutomatedSync` değerini kapatın. Üç ardışık fetch hatası kaynak sağlığını `degraded` durumuna getirir; son başarılı gözlem ve önceki adaylar silinmez.

## 7. Çalışma sınırları

Worker, yalnız yöneticinin eklediği resmî sayfaları tarar. Genel web taraması, rastgele sosyal kanal toplanması veya otomatik yayımlama yapmaz. Yeni kaynak profili eklenmeden genel bir resmî sayfa gözlemi aday üretmez; bu yaklaşım yanlış pozitifleri ve yayınlanmamış/kanıtsız fırsatları azaltır.
