# FreeTierHunt — Ürün ve Uygulama Geliştirme Planı

**Hazırlayan:** Manus AI  
**Tarih:** 13 Ağustos 2026  
**Kapsam:** Meşru AI aracı ücretsiz katmanları, denemeler, promosyonlar, öğrenci fırsatları ve resmî kredi kampanyaları

## Yönetici özeti

FreeTierHunt’ın temeli doğru yönde kurulmuş: Next.js tabanlı kullanıcı arayüzü, Drizzle veri modeli, teklif sayfaları, arama, anonim geri bildirim ve temel moderasyon görünümü mevcut. Ancak depo hâlâ bir **ürün iskeleti** durumunda. README’nin de belirttiği gibi projenin durum etiketi “bootstrapped”dır; otomatik kaynak alma, teklif doğrulama, kullanıcı hesabı, kalıcı bildirimler ve üretim kalitesindeki yönetim süreçleri henüz tamamlanmamıştır.[1]

En yüksek değerli değişiklik, kapsamı daraltarak güvenilirliği artırmaktır: FreeTierHunt yalnızca **resmî sayfayla veya izlenebilir bir kaynakla kanıtlanabilen fırsatları** yayımlamalıdır. Telegram, yalnızca kamuya açık ve önceden izinli bir kanalın bir fırsata işaret ettiği durumlarda *keşif sinyali* olabilir; ham mesaj deposu veya kapalı grup tarama kaynağı olmamalıdır. Telegram’ın API koşulları, kullanıcı gizliliğini korumayı ve Telegram verisini yapay zekâ modellerini eğitmek ya da geliştirmek için toplamamayı şart koşar.[8]

> **Önerilen ürün vaadi:** “AI araçları için kanıtlı ücretsiz katmanları, süreli denemeleri ve resmî promosyonları; son doğrulama tarihi, uygunluk şartları ve kaynak kanıtıyla bulun.”

Ödeme aracı verileri, BIN eşleştirmeleri, kart denemeleri, hesap erişimi veya ödeme sistemlerini yanıltmaya yönelik içerikler ürün kapsamı dışında tutulmalıdır. Bu sınır hem teklif kalitesini hem de marka güvenini korur.

| Alan | Bugünkü durum | Öncelik | Hedef durum |
|---|---|---:|---|
| Teklif görüntüleme | Çalışan sayfalar, seed verisi ve temel filtreler var | Orta | Kanıt, tarih ve uygunluk bilgisi olan teklifler |
| Otomatik keşif | İşleyici yalnızca yer tutucu | Çok yüksek | Kaynak kayıt defteri, kuyruklu alma ve normalizasyon |
| Doğrulama | Manuel onay/reddet akışı | Çok yüksek | Kanıt-temelli doğrulama, tazelik ve tekrar kontrolü |
| Gönderim güvenliği | Temel JSON doğrulaması | Çok yüksek | Kaynak URL’si, hız limiti, tekrar tespiti ve inceleme kuyruğu |
| Hesaplar/bildirimler | Supabase iskeleti; kaydetme yerelde | Yüksek | Giriş, sunucu taraflı kaydetme, tercih ve uyarılar |
| Üretim hazırlığı | Typecheck geçiyor; build ortam değişkeni yüzünden kırılıyor | Çok yüksek | Ortamdan bağımsız build, testler, staging ve gözlemlenebilirlik |

## Depo inceleme bulguları

Uygulamanın ana sayfası veritabanından teklif ve istatistik çekiyor; buna rağmen çağrı metninde hâlâ “Coming soon” ve bekleme listesi yer tutucusu bulunuyor.[2] Veri şeması ürünler, teklifler, oylar, raporlar, gönderimler, iş kuyrukları ve LLM kullanım kaydı için iyi bir başlangıç sağlıyor; fakat teklifin **kaynağı**, kanıtı, son kontrol tarihi, doğrulama sonucu ve kaynak güven skoru birinci sınıf nesneler değildir.[3]

Arka plan işleyicisi UTC ayarını yapıp başlıyor, ancak kuyruklar ve zamanlayıcılar yalnızca yorum satırında yer alıyor; dolayısıyla teklif keşif/doğrulama otomasyonu gerçekte çalışmıyor.[4] Aynı biçimde, gönderim uç noktası yalnızca özellik bayrağı ve şema kontrolü ardından bekleyen kayıt ekliyor. Kullanıcı kimliği, hız sınırı, kaynak URL’si, yinelenen gönderim kontrolü, doğrulama işi veya bildirim mevcut değil.[5]

Yönetici ekranı temel bir manuel inceleme akışı sunuyor: ürün mevcut değilse oluşturuyor, teklif ekliyor ve gönderimi onaylıyor ya da reddediyor. Yapay zekâ kararı, kanıt görünümü, düzenleyerek onaylama, toplu işlem, denetim izi ve kuyruk telemetrisi bulunmuyor.[6] Yönetici yetkisi de hedeflenen Supabase rol modelinden önceki, tek paylaşılan gizli anahtara dayalı geçici yöntemle korunuyor.[7]

| Kontrol | Sonuç | Plan etkisi |
|---|---|---|
| `pnpm typecheck` | Geçti | Tip güvenliği korunmalı; yeni işlerde zorunlu kontrol olmalı |
| `pnpm lint` | Geçti, `console` uyarıları var | ESLint CLI’ye geçiş ve uyarısız lint hedefi |
| `pnpm build` | Başarısız | DB istemcisi import aşamasında `DATABASE_URL` yoksa hata veriyor; build-safe sınır kurulmalı |
| Test altyapısı | Birim/E2E test betikleri görünmüyor | Kritik akışlar için Vitest ve Playwright eklenmeli |
| CI | Temel lint/typecheck/build doğrultusunda | Migration, test, secret taraması ve preview smoke test eklenmeli |

## Ürün kapsamı ve kaynak politikası

Başlangıçta amaç “her promosyonu bulmak” değil, **güvenilir fırsatı hızlı bulmak** olmalıdır. Her teklif için kullanıcıya cevap verilmesi gereken dört soru vardır: teklif nedir, kimler uygundur, ne zaman doğrulandı ve kanıt nerede?

| Kaynak sınıfı | Kabul kuralı | Üründe gösterim | Otomasyon düzeyi |
|---|---|---|---|
| Birincil resmî kaynak | Üreticinin fiyatlandırma, kampanya, doküman veya blog sayfası | “Resmî kaynak” rozeti ve kanıt bağlantısı | Tam otomatik alma + doğrulama |
| Resmî üretici topluluğu | Üreticinin doğrulanabilir şekilde yönettiği açık kanal/hesap | Kaynak ve üretici ilişkisi açıkça yazılır | İzin listeli konektör |
| Lansman/ekosistem kaynağı | Product Hunt, GitHub Student Pack vb. açık ve güvenilir yayın | “Üçüncü taraf kaynak” rozeti | Aday çıkarma; resmî sayfayla teyit |
| Kullanıcı gönderimi | Ürün URL’si + kaynak URL’si + açıklama + ilişki beyanı | İnceleme sonrasında yayımlanır | Hız limitli, kuyruklu değerlendirme |
| Kamuya açık Telegram kanalı | Yalnızca izin listeli, konuyla uyumlu ve izlenebilir kamuya açık kanal; resmî sayfa ile teyit şartı | Kanal mesajı “aday sinyal” olarak saklanır; teklif kanıtı değildir | Opt-in/izin listeli, düşük sıklıklı |

Bu çerçevede Telegram için doğru tasarım, “kanal avcısı” değil **kaynak kayıt defteri**dir. Yönetici, görünen herkese açık bir kanal URL’sini ekler; kanalın türünü, sahibini, konu etiketlerini, alma iznini ve tarama sıklığını belirler. Sistem yalnızca bu kayıt defterindeki kanallardan aday toplar, teklifi önce aynı ürünün resmî alan adı üzerinde doğrular ve kanıt üretmeden yayımlamaz. Özel gruplar, davet gerektiren alanlar, kişisel veri içeren mesajlar ve ödeme bilgisi iddiaları hiçbir aşamada alınmaz ya da saklanmaz. Telegram API ile bir kanal içeriğine erişen bir istemcinin resmî sponsorlu mesaj işlevini desteklemesi gerekliliği de tasarım değerlendirmesine dahil edilmelidir.[8]

## Hedef teknik mimari

### 1. Kanıt-merkezli veri modeli

Mevcut şema korunmalı, ancak aşağıdaki tablolar/mantıksal nesneler eklenmelidir. Birincil anahtarlar Supabase Auth ile uyumlu UUID olmalı; uygulama kullanıcısı ile kimlik sağlayıcı kullanıcısı arasında tek ve açık bir eşleme kurulmalıdır.

| Nesne | Temel alanlar | Gerekçe |
|---|---|---|
| `sources` | tür, ad, URL, sahiplik, izin durumu, güven puanı, aktiflik | Nereden gelindiğini görünür ve denetlenebilir yapmak |
| `source_items` | kaynak, dış kimlik, URL, yayımlanma/alınma zamanı, özet, içerik karması | Aynı mesaj/sayfa için tekrarları önlemek |
| `offer_evidence` | teklif, kaynak öğesi, alıntı, kanıt URL’si, çıkarım yöntemi, gözlem zamanı | “Nerede yazıyor?” sorusunu cevaplamak |
| `verification_runs` | teklif, kontrol türü, sonuç, güven, hata, maliyet, zaman | Doğrulama ve tekrar kontrolünü denetlemek |
| `offer_feedback` | teklif, kullanıcı/ziyaretçi, sonuç, ayrıntı, zaman | “Çalıştı/çalışmadı” sinyalini saklamak |
| `user_preferences` | ilgi alanı, bölge, öğrenci durumu beyanı, bildirim tercihi | Kişiselleştirilmiş ancak veri-minimum uyarılar |
| `audit_log` | aktör, işlem, nesne, önce/sonra özeti, zaman | Yönetici kararlarında geri izlenebilirlik |

Teklif üzerinde `source_id`, `eligibility`, `region`, `estimated_monthly_value`, `last_verified_at`, `verification_state`, `trust_score` ve `canonical_claim_url` görünür olmalıdır. `product_id`, `user_id` ve `offer_id` ilişkileri gerçek yabancı anahtarlarla bağlanmalı; silme/güncelleme davranışları açıkça belirlenmelidir.

### 2. Keşiften yayına boru hattı

```text
Kaynak kayıt defteri
        ↓
İzinli alma / RSS / resmî API
        ↓
Normalize et + alan adı kanonikleştir + tekrarları birleştir
        ↓
Ucuz kontroller: URL, tarih, şema, alan adı, aynı teklif
        ↓
Resmî sayfadan kanıt alma ve yapılandırılmış çıkarım
        ↓
Güven eşiği: otomatik taslak / insan incelemesi / ret
        ↓
Yayın + son kontrol tarihi + yeniden doğrulama işi
        ↓
Topluluk geri bildirimi → yeniden doğrulama önceliği
```

İşleyici, mevcut yer tutucu programdan ayrıştırılmış modüllerle kurulmalıdır: `source-sync`, `offer-normalizer`, `evidence-fetcher`, `validator`, `expiry-sweeper`, `reverify` ve `digest`. Her iş, benzersiz iş anahtarı, sınırlı yeniden deneme, üstel bekleme, zaman aşımı, idempotency ve yapılandırılmış log taşımalıdır. LLM, yalnızca URL/alan adı/anahtar sözcük/tekrar kontrolü geçtikten sonra yapılandırılmış çıkarım için kullanılmalı; LLM sonucu doğrudan yayımlama yetkisi almamalıdır.

### 3. Kullanıcı deneyimi

İlk beta için ana sayfa, katalog, ürün sayfası, gönderim formu, kaydedilen teklifler ve temel ayarlar yeterlidir. Her teklif kartında tür, değer, uygunluk, son doğrulama, süresi, kaynak rozeti ve “teklife git” bağlantısı görünmelidir. Kodu olan teklifler için kod ancak resmî kanıt üzerinde görünüyorsa sunulmalı; ürün sayfasına giden bağlantı izlenebilir yönlendirme olmadan açıkça belirtilmelidir.

Ürün detay sayfasında **kanıt kutusu**, geçmiş doğrulamalar, koşullar, bölge/öğrenci gereksinimleri, son kullanma zamanı ve topluluk geri bildirimi yer almalıdır. “Çalışmadı” geri bildirimi özellikle değerli bir sinyal kabul edilmeli; belirli eşiklerde teklif otomatik olarak “yeniden doğrulanacak” durumuna geçmelidir. Kullanıcılar için kaydetme sunucu tarafında kalıcı olmalı; kimliği olmayan ziyaretçiler sadece geçici yerel kaydetmeyi kullanabilmelidir.

## Önceliklendirilmiş altı haftalık yol haritası

Aşağıdaki plan, mevcut geniş 13 haftalık belgeyi aşamalı bir beta teslimine dönüştürür. Her haftanın sonunda canlıya alınabilir bir dikey dilim üretilir; çalışmayan altyapı özellikleri sonraki haftalara taşınmaz.

| Hafta | Hedef | Somut teslimler | Tamamlanma ölçütü |
|---|---|---|---|
| 0 — Yeniden temel alma (2 gün) | Üretim hattını güvenilir kılmak | Ortam sözleşmesi, örnek `.env`, build-safe DB sınırı, ESLint CLI, migration başlangıcı, CI korumaları | Temiz ortamda typecheck, lint ve build geçer; gizli anahtar olmadan public sayfalar çökmüyor |
| 1 — Güvenilir teklif çekirdeği | Kanıtlı 50 tekliflik beta kataloğu | `sources`/`evidence`/`verification` şeması, manuel kürasyon aracı, teklif görünümünde kanıt ve son doğrulama | En az 50 aktif teklif; her birinin kaynak URL’si ve doğrulama tarihi var |
| 2 — Resmî kaynak alma | Tek kaynaktan uçtan uca otomasyon | Bir resmî kaynak konektörü, BullMQ işleri, normalizasyon, tekrar tespiti, taslak inceleme kuyruğu | Kaynak değişikliğinden taslağa tüm akış tekrar çalıştırılabilir ve idempotent |
| 3 — Güvenli topluluk gönderimi | Kullanıcı katkısını kontrollü açmak | Kaynak URL’si/ilişki beyanı alanları, hız limiti, Turnstile, URL doğrulama, duplicate kontrolü, moderasyon kanıt paneli | Spam/tekrar vakaları otomatik bekletilir; onay kararı denetim kaydı üretir |
| 4 — Kimlik, kaydetme ve tazelik | Tekrar ziyareti ve geri bildirim | Supabase UUID eşlemesi, magic-link/OTP, sunucu taraflı kaydetme, “çalıştı/çalışmadı”, yeniden doğrulama kuyruğu | Kullanıcı oturumu, kaydedilenler ve geri bildirim üç farklı oturumda kalıcıdır |
| 5 — İzinli Telegram pilotu ve uyarılar | Kontrollü yeni keşif kanalı | Kaynak kayıt defteri, en fazla 3 izinli kamuya açık kanal, aday sinyali işleme, resmî sayfa teyidi, haftalık özet | Hiçbir Telegram sinyali kanıtsız yayımlanmaz; her adayın kaynak/işlem kaydı vardır |
| 6 — Launch hazırlığı | Ölçüm, kalite ve büyüme | Uçtan uca testler, hata/iş telemetrisi, SEO metaverisi, sitemap, iş runbook’u, beta geri bildirim döngüsü | Staging smoke testi, 7 günlük hata raporu ve ölçülebilir beta geri bildirim döngüsü hazır |

## Hafta 0 için teknik görev listesi

İlk iki günün amacı, yeni özellik yazmadan önce güvenilir geliştirme akışını kurmaktır. `src/lib/db/client.ts` uygulama yüklenirken doğrudan veritabanı bağlantısına bağımlı olduğu için ortamsız build hata veriyor; bağlantı yalnızca istek veya dinamik sunucu bileşeni çalışırken oluşturulmalı ya da çevrimdışı build için zararsız bir yapı sağlanmalıdır. Bu değişiklik, statik kod derlemesini gerçek bağlantı bilgisinden ayırır.

| İş | Dosya alanı | Kabul kriteri |
|---|---|---|
| Ortam sözleşmesi | `.env.example`, `src/lib/env.ts` | Gerekli/isteğe bağlı/sadece sunucu değişkenleri belgelenir; doğrulama hata mesajları eyleme dönüktür |
| DB başlatma | `src/lib/db/client.ts` | Build, yalnızca route import edildi diye bağlantı dizesi eksik hatası vermez |
| Migration disiplini | `drizzle/`, CI | `db:generate` çıktısı sürüm kontrolündedir; prod’da `db:push` kullanılmaz |
| Lint modernizasyonu | `package.json`, ESLint config | `next lint` yerine ESLint CLI; yeni uyarı oluşmaz |
| Test altyapısı | `tests/`, package scripts | Şema/normalizasyon birim testleri ve en az bir API entegrasyon testi |
| CI | `.github/workflows/ci.yml` | Kurulum, typecheck, lint, test, build; bağımlılık ve secret taraması |

## Hafta 1–3 için kabul kriterleri

Katalog güveni, teklif sayısından önce gelir. Yayımlanacak bir teklif için asgari şartlar aşağıdaki gibidir.

| Kural | Zorunlu mu? | Uygulama |
|---|---:|---|
| Kanonik ürün alan adı | Evet | URL ayrıştırma ve izinli alan adı eşleşmesi |
| Resmî veya açıkça etiketlenmiş üçüncü taraf kaynak | Evet | `source_id` + kaynak etiketi |
| Kanıt URL’si ve kısa alıntı | Evet | `offer_evidence` kaydı |
| Son doğrulama zamanı | Evet | `last_verified_at` |
| Uygunluk/istisna bilgisi | Evet, bilinmiyorsa “belirsiz” | Yapılandırılmış `eligibility` alanı |
| Süre sonu veya “süresiz” beyanı | Evet | `expires_at` ya da açık işaret |
| Kopya kontrolü | Evet | ürün + kod + değer + kanonik URL karma anahtarı |
| İnsan onayı | Yüksek risk/kararsızlıkta | Moderasyon kuyruğu |

## Metrikler ve işletim ritmi

Beta sürecinde gösteriş metrikleri yerine veri kalitesini ölçmek gerekir. Her hafta küçük bir “kalite saati” ayrılarak aktif teklifler tekrar gözden geçirilmelidir.

| Metrik | Tanım | Başlangıç hedefi |
|---|---|---:|
| Kanıt kapsamı | Kanıt URL’si ve gözlem zamanı olan aktif teklif oranı | %100 |
| Tazelik | Son 30 günde doğrulanan aktif teklif oranı | %90+ |
| Doğruluk sinyali | “Çalıştı” geri bildirimi / toplam anlamlı geri bildirim | Haftalık izleme; eşik sonrası yayın otomasyonu |
| Çürüme süresi | Geçersiz raporundan teklifin gizlenmesine kadar geçen süre | 24 saat altı |
| Tekrar oranı | Aynı fırsat için yinelenen aday yüzdesi | Kaynak bazında izleme |
| Moderasyon gecikmesi | Bekleyen gönderimin ilk kararına kadar süre | 48 saat altı |
| Otomasyon maliyeti | Teklif başına HTTP/LLM/arama maliyeti | Kaynak ve iş türüne göre bütçeli |

## Risk azaltma kararları

Birinci risk, kalitesiz veya süresi geçmiş promosyonların kullanıcı güvenini azaltmasıdır. Çözüm, teklif değerini büyük gösteren tasarımdan önce “son doğrulama” ve kanıtı görünür kılmaktır. İkinci risk, kaynak alma maliyetinin spam gönderimlerle büyümesidir; çözüm, pahalı alma/LLM adımlarından önce ücretsiz doğrulama kontrolleri ve kota uygulamaktır. Üçüncü risk, tek yöneticili manuel süreçte yayın hatalarıdır; çözüm denetim izi, geri alınabilir onay ve iki aşamalı yüksek riskli içerik yayınlamadır.

Telegram pilotunun temel riski kaynak kalitesidir. Bu nedenle Telegram’dan gelen her öğe, teklif değil **aday** sayılmalıdır. İzinsiz özel alanlara erişilmemeli, ham kişisel veri saklanmamalı ve kamuya açık içerik için bile alım frekansı, saklama süresi ve silme süreci kaynak kayıt defterinde tanımlanmalıdır. API kullanımı ayrıca Telegram’ın gizlilik ve kanal erişimine ilişkin şartlarıyla uyumlu tasarlanmalıdır.[8]

## İlk somut sprint önerisi

İlk uygulama sprinti, yeni bir Telegram konektörü yazmak değil aşağıdaki dar kapsamı bitirmek olmalıdır: bir “resmî kaynak” ekleme ekranı, teklif için kanıt kaydı, `last_verified_at` alanı, mevcut kartta kanıt rozeti, yönetici incelemesinde kanıt görünümü ve ortamdan bağımsız başarılı build. Bu dikey dilim tamamlandığında ürün, seed listesi olmaktan çıkıp denetlenebilir bir fırsat kataloğuna dönüşür. Ondan sonra bir resmî kaynak konektörü ve en son izinli Telegram pilotu düşük riskle eklenebilir.

## Kaynakça

[1] [FreeTierHunt README — durum, teknoloji yığını ve proje kapsamı](https://github.com/haybinalim/freetierhunt/blob/a7de091/README.md)  
[2] [Ana sayfa — teklif listesi ve bekleme listesi yer tutucusu](https://github.com/haybinalim/freetierhunt/blob/a7de091/src/app/page.tsx)  
[3] [Veri şeması — mevcut ürün, teklif, geri bildirim ve kuyruk tabloları](https://github.com/haybinalim/freetierhunt/blob/a7de091/src/lib/db/schema.ts)  
[4] [Arka plan işleyicisi — iş kuyrukları için mevcut yer tutucu](https://github.com/haybinalim/freetierhunt/blob/a7de091/worker/index.ts)  
[5] [Gönderim API’si — mevcut doğrulama ve ekleme akışı](https://github.com/haybinalim/freetierhunt/blob/a7de091/src/app/api/submissions/route.ts)  
[6] [Yönetici gönderim ekranı — mevcut manuel moderasyon akışı](https://github.com/haybinalim/freetierhunt/blob/a7de091/src/app/admin/submissions/page.tsx)  
[7] [Yönetici erişim koruması — geçici `ADMIN_TOKEN` yaklaşımı](https://github.com/haybinalim/freetierhunt/blob/a7de091/src/lib/admin/guard.ts)  
[8] [Telegram API Terms of Service — gizlilik, AI veri kullanımı ve kanal erişimi koşulları](https://core.telegram.org/api/terms)
