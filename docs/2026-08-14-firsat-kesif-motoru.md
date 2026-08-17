# FreeTierHunt Fırsat Keşif Motoru

**Tarih:** 14 Ağustos 2026  
**Durum:** Uygulama tasarımı ve ilk teslim dilimi  
**Amaç:** FreeTierHunt’ın fırsatları yalnızca kullanıcı/partner gönderiminden beklemek yerine, resmî kaynaklardan proaktif biçimde aday fırsatlar üreten bir keşif motoruna dönüşmesi.

## Temel ayrım

> **Keşif**, “hangi resmî sayfada yeni veya değişmiş bir fırsat var?” sorusunu yanıtlar. **Doğrulama**, “bu fırsat yayımlanabilir mi ve koşulları doğru mu?” sorusunu yanıtlar. İkisi aynı iş değildir ve iki ayrı durum makinesiyle yönetilmelidir.

| Katman | Girdi | Çıktı | Otomasyon kuralı |
|---|---|---|---|
| Kaynak kaydı | Resmî sağlayıcı URL’si veya yazılı izinli partner feed’i | Aktif/süreli kaynak | Kaynak yöneticisi onayı gerekir |
| Tarama | Koşullu HTTP isteği, API veya RSS/Atom feed | Değişmiş kaynak gözlemi | ETag/Last-Modified/content hash ile değişiklik algılanır |
| Aday çıkarımı | Yeni/değişmiş resmî gözlem | `discovery_candidate` | Kaynak profili veya feed şemasıyla deterministik çıkarım |
| Normalleştirme | Aday başlık, URL, değer, koşullar | Tekil aday/fingerprint | Aynı kaynaktan aynı fırsat tekrar üretilmez |
| Doğrulama | Resmî sayfa metni | Yapılandırılmış kanıt önerisi | AI yalnız resmî sayfayı görür |
| Moderasyon | Aday + kanıt | Yayınlanmış, reddedilmiş veya stale teklif | İnsan onayı olmadan otomatik yayın yok |

## Fırsatlar nereden bulunacak?

İlk keşif portföyü, resmî kredi ve program sayfalarından başlar. Google Cloud, AWS ve Cloudflare’ın startup programı sayfaları sırasıyla kredi değerleri, uygunluk ve başvuru yolları sunar.[1] [2] [3] Bunlar kullanıcı mesajına ya da kupon dizinine bağımlı olmayan birincil kaynaklardır.

| Öncelik | Kaynak türü | Keşif biçimi | İlk örnekler | Aday çıkarma şekli |
|---|---|---|---|---|
| P0 | Resmî program/teklif sayfası | Periyodik HTTP + değişiklik algılama | Google Cloud Startup, AWS Activate, Cloudflare Startups | Sağlayıcı profili + kanıt alıntısı |
| P0 | Resmî RSS/Atom/blog duyurusu | Feed poll + yeni item kontrolü | Sağlayıcı ürün/blog duyuruları | Feed item → resmî hedef URL |
| P1 | İzinli partner feed’i | İmzalı/API anahtarlı JSON veya CSV | Accelerator, VC, öğrenci programı ortakları | Şema doğrulama + resmî URL |
| P1 | Sağlayıcı self-service gönderimi | Yönetim formu/portal | SaaS ve API sağlayıcıları | İlişki ispatı + resmî URL |
| P2 | Topluluk bildirimi | Uygulama içi form | Kullanıcı keşfi | Resmî URL zorunlu; düşük öncelik |
| P2 | İzinli Telegram kanalı | Yapılandırılmış bot komutu | Yalnızca kanal sahibi onaylı partner | URL adayı; Telegram verisi AI’ya girmez |

## İlk uygulama dilimi

İlk dilim üç resmî kaynak için **profil tabanlı adapter** üretir. Bu adapterlar, sayfa değiştiğinde başlık/değer/uygunluk/süre işaretlerini deterministik olarak aday kaydına çevirir. Her aday, `source_observation_id`, resmî URL, kanıt alıntısı, taşıyıcı alanlar ve kaynak-temelli fingerprint ile saklanır. Aynı aday aynı gözlem veya sonraki eşdeğer içerik değişiminde tekrar üretilemez.

Aday, doğrudan `offers` tablosuna yazılmaz. Önce `discovery_candidates` kuyruğuna girer. Adayın durumu `pending`, `accepted`, `dismissed` veya `superseded` olur. Moderatör, kabul edilen adaydan submission/teklif oluşturur; resmî sayfa AI doğrulaması bu noktada yalnız resmî gözlem metni üzerinden çalışır.

## Zamanlanmış çalışma

Tarama görevi, kaynak başına `sync_interval_minutes` kullanır. Her döngü yalnızca zamanı gelmiş `active` + `allow_automated_sync` kaynakları seçer. ETag/Last-Modified dönen veya içerik karması değişmeyen sayfalarda aday çıkarımı yapılmaz. Başarısız istekler ayrı fetch run kaydı üretir; üç ardışık başarısızlıkta kaynak `degraded` olur ve yönetim yüzeyinde görünür.

Dakikalık/saatlik iş programı, kalıcı uygulama altyapısındaki arka plan görevinde çalışmalıdır; oturum başlatan dış görevler bu yüksek frekanslı deterministik iş için uygun değildir. İlk uygulama, mevcut worker yüzeyinde job kaydı ve kilitli tek tüketici yaklaşımı kullanır.

## Aday kalite kuralları

| Kontrol | Kural |
|---|---|
| Birincil URL | Adayın `officialUrl` alanı resmî kaynağın kendisi veya o kaynak içindeki başvuru sayfası olmalı |
| Kaynak kanıtı | Aday alıntısı, gözlem metninde birebir bulunmalı |
| Değer | Para/kredi tutarı açıkça belirtilemiyorsa aday düşük öncelikli `pending` olarak kalmalı |
| Fingerprint | `sourceId + canonical URL + offer type + normalized headline` ile hesaplanmalı |
| Yinelenen kayıt | Aynı fingerprint ve aktif aday varsa yeni aday oluşturulmamalı |
| Yayın | Hiçbir discovery candidate otomatik olarak `active` offer olmaz |

## Sonraki adapter dalgaları

İlk üç kaynak çalıştıktan sonra RSS/Atom adapterı, GitHub Student Pack gibi resmî program sayfaları, Supabase/Vercel/Render gibi geliştirici kredi programları ve izinli partner feed adapterı eklenir. Genişleme kriteri kaynak sayısı değil; yüksek doğruluk, düşük tekrar oranı ve güncel kanıtla kapatılan aday oranıdır.

## Kaynakça

[1] [Google Cloud — Google for Startups Cloud Program](https://cloud.google.com/startup)  
[2] [AWS — Activate Credits](https://aws.amazon.com/startups/credits/)  
[3] [Cloudflare — Cloudflare for Startups](https://www.cloudflare.com/startups/)
