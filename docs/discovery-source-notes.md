# İlk Resmî Keşif Kaynağı Notları

**Erişim tarihi:** 14 Ağustos 2026

| Sağlayıcı | Resmî keşif URL’si | Yapılandırılmış fırsat sinyali | Adapter önceliği |
|---|---|---|---|
| Google Cloud | `https://cloud.google.com/startup` | Startup programı, kredi değeri, segment ve başvuru URL’si aynı resmî sayfada bulunur. | P0 |
| AWS | `https://aws.amazon.com/startups/credits/` | Kredi katmanları, değerler, temel uygunluk ve başvuru bağlantıları yayımlanır. | P0 |
| Cloudflare | `https://www.cloudflare.com/startups/` | Kredi katmanları, süre, uygunluk, kapsamlar ve istisnalar tek sayfada bulunur. | P0 |

## Adapter yaklaşımı

Bu sayfalar birer **resmî kaynak adapterı** ile periyodik olarak çekilmelidir. Adapter önce HTTP koşullu istek/ETag mekanizmasını, sonra içerik karması değişimini kullanır. Değişiklik algılanırsa sayfa; başlık, resmî URL, kanıt alıntısı, kredi/değer, uygunluk, süre ve kart/yenileme koşulları için aday alanlara normalleştirilir. Ardından teklif adayları `under_review` durumunda moderasyona gider; sayfa tek başına otomatik yayın kararı vermez.

## Kaynaklar

[1] [Google Cloud — Google for Startups Cloud Program](https://cloud.google.com/startup)  
[2] [AWS — Activate Credits](https://aws.amazon.com/startups/credits/)  
[3] [Cloudflare — Cloudflare for Startups](https://www.cloudflare.com/startups/)
