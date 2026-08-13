# FreeTierHunt — Kaynak, Adapter ve Tarama Stratejisi Güncellemesi

**Tarih:** 13 Ağustos 2026  
**Dayanak:** Kullanıcının sağladığı “Free Tier Hunt — Kaynaklar, Benzer Projeler ve Tarama Mimarisi” araştırması  
**Durum:** v2 yol haritası için bağlayıcı kaynak edinim eki

## 1. Karar özeti

Araştırma belgesi, FreeTierHunt’ın yalnızca AI araçlarıyla sınırlı kalmaması gerektiğini; **bulut kredileri, geliştirici free tier’ları, startup programları, öğrenci programları ve süreli abonelik fırsatları** için kanıt-temelli bir katalog hâline gelmesi gerektiğini gösteriyor. Bu değerlendirme kabul edilmiştir.

Bununla birlikte ürün, “internetteki her kuponu tarayan bot” olmayacaktır. Başlangıçtaki ana ürün hedefi aşağıdaki gibi güncellenmiştir:

> **FreeTierHunt; geliştiriciler, öğrenciler ve erken aşama startup’lar için resmî kaynakla doğrulanmış free tier, kredi, deneme ve program fırsatlarını; uygunluk, yenileme, güncellik ve kanıt bilgileriyle sunan bir fırsat istihbarat ürünüdür.**

Bu ek plan, daha önce uygulanan kanıt grafiği modelini korur; kaynak seçimi, adapter sözleşmesi, tarama sıklığı, sinyal kaynaklarının rolü, teklif türleri ve sıralı uygulama planını somutlaştırır.

| Karar alanı | Güncel karar |
|---|---|
| İlk odak | AI/API, cloud, geliştirici araçları ve startup programları |
| Yayın standardı | Resmî doğrulama URL’si, kanıt alıntısı, gözlem zamanı ve koşul alanları zorunlu |
| Topluluk/sinyal kaynakları | Yalnızca aday üretir; tek başına yayın kanıtı değildir |
| Tarama yaklaşımı | API/RSS/izinli webhook önce; düşük frekanslı HTTP sonra; genel web taraması en son |
| Telegram | Otomatik kanal tarama yok; yalnızca izinli bot/ortak akışında yapılandırılmış resmî bağlantı sinyali veya bildirim |
| İşletim modeli | İlk aşamada zamanlanmış hafif worker + Postgres; iş hacmi kanıtlanınca sürekli worker/kuyruk |

## 2. Araştırmadan alınan ve planı değiştiren noktalar

Araştırma üç değerli ürün yaklaşımını bir araya getiriyor: kürasyonlu katalog (`free-for-dev`, Awesome Startup Deals), kaynak-adapter tabanlı alma ve teklif sonrası trial/yenileme takibi.[1] FreeTierHunt’ın hedef mimarisi bu üç katmanı bağlamalı; ancak bunları aynı sprintte kurmamalıdır.

| Araştırma bulgusu | Mevcut v2 ile ilişkisi | Plan güncellemesi |
|---|---|---|
| Startup kredileri, cloud free tier ve geliştirici limitleri temel kullanıcı değeridir | V2 ilk odağı AI araçlarıydı | Katalog kapsamı “AI + developer infrastructure + startup programs” olarak genişletildi |
| Dizinler iyi keşif kaynağıdır, doğrulama kaynağı değildir | V2 kanıt grafiğiyle uyumlu | Kürasyonlu dizinler yalnızca `candidate` üretir; resmî alan adı doğrulanmadan yayın yok |
| Kaynak başına adapter bakım maliyetini azaltır | V2’de kaynak tabloları var, adapter sözleşmesi yok | Standart `SourceAdapter` arayüzü ve sağlık modeli eklendi |
| Fırsatlar ülke/segment bazında değişir | V2’de `regions` ve `eligibility` mevcut | Varyant kimliği, startup aşaması ve program gereksinimleri eklenir |
| Trial bitişi/yenileme takibi ayrı bir kullanıcı değeri üretir | V2’de uyarı fikri vardı | Keşiften sonraki “trial takip” modülü Sprint 7’ye ayrıldı |
| Reddit/X/Telegram hızla sinyal üretir ama düşük güvenlidir | V2’de Telegram zaten sınırlandırıldı | Sinyal alma yalnızca aday kuyruğu, resmî URL bulma ve insan inceleme ile sınırlandırıldı |

## 3. Yeni ürün kapsamı ve sınıflandırma

### 3.1 İlk katalog kapsamı

İlk yayın diliminde odak, benzer ihtiyaç ve veri yapısına sahip dört dikeydir. Her dikeyte aynı kanıt standardı uygulanır; yalnızca uygunluk alanları farklılaşır.

| Dikey | Örnek sağlayıcı/program türü | Birincil kullanıcı | Zorunlu koşul alanları |
|---|---|---|---|
| AI/API | Model API’leri, inference, agent araçları | Indie maker, geliştirici | Aylık kota, kredi kartı, model/servis kapsamı, abuse sınırı |
| Cloud/startup kredileri | AWS, Google Cloud, Azure, Cloudflare, DigitalOcean vb. | Erken aşama startup | Startup aşaması, program/partner şartı, kredi sonu, ülke, başvuru URL’si |
| Developer free tier | Vercel, Supabase, GitHub, PostHog, Sentry vb. | Bireysel geliştirici ve ekip | Kullanıcı/ekip, proje, depolama, build/event/trace kotası |
| Eğitim/nonprofit programı | GitHub Education, vendor education/nonprofit programları | Öğrenci, eğitimci, nonprofit | Doğrulama yöntemi, bölge, yenileme, mezuniyet/uygunluk bitişi |

Genel kupon siteleri, perakende fırsatlar, ayrıcalıklı davetler, hesap paylaşımı iddiaları, “group buy” ve ödeme yöntemi bilgisi gerektiren iddialar ilk katalog kapsamı dışındadır. Araştırma belgesinin kupon sitelerini aday sinyali olarak değerlendirme önerisi korunur; ancak kullanıcıya gösterim için resmî kampanya veya sağlayıcı başvuru sayfası şarttır.[1]

### 3.2 Teklif türleri ve varyantlar

Mevcut `free_tier`, `trial`, `credit`, `discount` türleri uygulama çekirdeği için yeterliydi. Kaynak belgesine göre veri modelinin aşağıdaki türleri de ayırt edebilmesi gerekir.

| Yeni tip | Açıklama | Yayın özel kuralı |
|---|---|---|
| `promo_code` | Sağlayıcının resmî olarak yayımladığı veya yetkili ortağa verdiği kod | Kodun kullanılabilirliği resmî kanıtla doğrulanır |
| `coupon` | Belirli plan/ürün için indirim mekanizması | Yenileme fiyatı ve bitiş koşulu zorunlu |
| `startup_perk` | Startup’a özel kredi, indirim veya program | Aşama, partner/KYC/başvuru şartı zorunlu |
| `temporary_free` | Sınırlı tarih aralığında ücretsiz erişim | Başlangıç/bitiş veya “belirsiz” tazelik durumu zorunlu |
| `discounted_subscription` | Süreli ya da yenilenen indirimli abonelik | Otomatik yenileme, iptal ve sonraki fiyat zorunlu |

Bir teklif, ülke, para birimi, kullanıcı tipi veya başvuru yoluna göre ayrışıyorsa yeni teklif yaratmak yerine **offer variant** olarak tutulmalıdır. Örnek: bir startup programının “pre-funded”, “Seed–Series A” ve “AI-first” kolları ortak kaynakta görünse bile ayrı uygunluk, değer ve son kullanma koşullarına sahiptir.[1]

## 4. Kaynak öncelik matrisi

Kaynaklar aynı rolü oynamaz. Her kaynağa hem **keşif değeri** hem **yayın kanıtı değeri** atanmalıdır.

| Seviye | Kaynak türü | Örnek | Sistemdeki rol | Varsayılan güven aralığı |
|---|---|---|---|---:|
| P0 | Resmî sağlayıcı programı/fiyat/şart sayfası | AWS Free Tier, Google for Startups, Azure Startup, ürün pricing sayfası | Birincil doğrulama ve yayın kanıtı | 90–100 |
| P1 | Resmî API, RSS veya partner webhook | Product Hunt API, sağlayıcı blog RSS, izinli partner feed’i | Aday üretme + değişiklik tespiti; resmî hedef URL doğrulanır | 70–90 |
| P2 | Kürasyonlu geliştirici/startup dizini | free-for-dev, Awesome Startup Deals, StartupPerks, DevDeals, InnMind | Aday/öncelik sinyali; tek başına yayın kanıtı değil | 40–70 |
| P3 | Topluluk ve sosyal sinyal | Reddit, X, izinli Telegram bot akışı, newsletter | Erken uyarı; insan inceleme kuyruğu | 10–40 |
| P4 | Genel kupon/deal sayfası | Slickdeals, RetailMeNot, StackSocial, AppSumo | En düşük öncelikli aday; açık resmî URL şartı | 0–30 |

**Temel yayın politikası:** P0 kanıtı olmadan bir P1–P4 kaydı `candidate`, `evidence_required` veya `under_review` durumunda kalır. P0 kaynağı, resmi teklif URL’si, ilgili kanıt alıntısı ve gözlem zamanı kayıt altına alındığında `published` durumuna geçebilir.

## 5. Başlangıç kaynak portföyü

İlk 30 kaynak, yüksek değerli ve nispeten yapılandırılmış kaynaklardan oluşmalıdır. Kullanıcının araştırması bu seçimi açıkça desteklemektedir.[1]

### Dalga A — Resmî çekirdek (ilk 12 adapter)

| Grup | Başlangıç kaynakları | Alım yöntemi | Yeniden kontrol |
|---|---|---|---|
| Cloud/startup | AWS Free Tier + Activate, Google for Startups, Microsoft for Startups | Düşük frekanslı HTTP + manuel kanıt | 24–48 saat |
| Developer platform | Cloudflare, Vercel, Supabase, GitHub | Resmî pricing/program sayfası + RSS varsa RSS | 24–48 saat |
| Gözlemlenebilirlik | PostHog, Sentry, Datadog | Resmî pricing sayfası | 48 saat |
| AI/API | OpenAI, Anthropic, Google AI, Hugging Face | Resmî pricing/developer programı | 24–48 saat |

Bu dalganın hedefi kaynak sayısı değil, **20–30 kaynak üzerinde %100 kanıt kapsamı ve güvenilir değişiklik tespiti**dir.

### Dalga B — Yapılandırılmış keşif (sonraki 8 adapter)

| Kaynak | Rol | Alım yöntemi | Çıktı |
|---|---|---|---|
| Product Hunt API v2 | Yeni ürün/lansman adayları | Resmî GraphQL API | Ürün adayı + dış URL + lansman metni |
| Sağlayıcı blog RSS | Program/kota değişiklikleri | RSS/Atom + ETag | Resmî değişiklik adayı |
| GitHub REST API | free-for-dev ve Awesome Startup Deals değişiklikleri | Commit/PR/release izlemesi | Yeni/değişen adaylar |
| StartupPerks, DevDeals, InnMind | Startup fırsat adayları | İzin/şartlar uygunsa düşük sıklıklı adapter | Resmî başvuru URL’si için aday |
| E-posta ingest | Yetkili newsletter forward kutusu | IMAP/webhook veya posta sağlayıcı kuralı | İnsan incelemeli aday |

### Dalga C — Sinyal ve topluluk (yalnızca kalite eşiği sonrası)

Reddit Data API, X Recent Search ve izinli Telegram bot akışı yalnızca aday üretir. İçerik, sağlayıcının resmî alan adına giden bağlantı veya doğrulanabilir ortak program URL’si içermiyorsa otomatik olarak düşük öncelikli kalır. Kullanıcı adı, profil, özel mesaj, kapalı grup veya bireysel ödeme/hesap verisi saklanmaz.[1]

## 6. SourceAdapter sözleşmesi

Her kaynak için ayrı iş mantığı yazılabilir; fakat altyapı aynı sözleşmeyi zorunlu kılar. Böylece kaynak ekleme maliyeti, hata yönetimi ve gözlemlenebilirlik standartlaşır.

```ts
export interface SourceAdapter {
  key: string;
  sourceType: 'official' | 'partner_feed' | 'community_submission' | 'manual_research';
  capabilities: {
    discovery: boolean;
    verification: boolean;
    supportsConditionalFetch: boolean;
  };
  rateLimit: { requests: number; windowMs: number };
  fetch(cursor?: SourceCursor): Promise<FetchResult>;
  parse(input: FetchResult): Promise<RawCandidate[]>;
  normalize(candidate: RawCandidate): Promise<NormalizedCandidate>;
  healthCheck(): Promise<SourceHealthCheck>;
}
```

| Metot | Sorumluluk | Kabul kriteri |
|---|---|---|
| `fetch()` | API/RSS/HTTP içeriğini istek bütçesiyle alır | URL, ETag/Last-Modified, HTTP durum ve süre kaydedilir |
| `parse()` | Kaynağa özel yapıyı ham adaya çevirir | Başarısız içerik sessizce atılmaz; parse hatası kaydedilir |
| `normalize()` | Sağlayıcı/ürün, URL, değer, süre ve sinyalleri ortak forma dönüştürür | Kanonik URL ve kimlik üretir |
| `healthCheck()` | Kaynağın erişim ve şema sağlığını test eder | `healthy`, `degraded`, `paused` sonucu üretir |
| `rateLimit` | Kaynak başına istek bütçesini tanımlar | 429/Retry-After ile uyumludur |

Adapter, LLM çağrısı yapmak zorunda değildir. Önce deterministik URL/başlık/JSON-LD/RSS alanı ayrıştırma uygulanır. LLM yalnızca karmaşık, kanıtı mevcut adaylardaki alan eşleme ve kısa koşul özeti için kullanılır; LLM çıktısı doğrudan yayın kararı vermez.

## 7. Tarama, cache ve kaynak sağlığı

### 7.1 Frekans politikası

Araştırma belgesindeki frekanslar, düşük maliyetli başlangıç için aşağıdaki kurala dönüştürülmüştür.

| Kaynak sınıfı | Hedef frekans | Cache/koşullu istek | Başarısızlık yaklaşımı |
|---|---:|---|---|
| Resmî pricing/startup sayfası | 24–48 saat | ETag/Last-Modified, içerik karması | Eski teklifi silme; `reverify_due` oluştur |
| Resmî RSS/Atom | 15–60 dakika | ETag/If-None-Match | Feed geçici hatasında son gözlem korunur |
| Product Hunt/GitHub API | 1–6 saat | Cursor, son işaret, rate-limit bütçesi | API hata kodu/yeniden deneme politikası |
| Kürasyonlu dizin | Günlük | Sayfa karması | `degraded` kaynak durumu |
| Sosyal sinyal | 15–60 dakika, yalnızca API/izinli akış | Cursor/son olay | Sadece aday kuyruğu |

### 7.2 Kaynak sağlık durumu

`source_health` alanı ve `source_health_events` kaydı eklenmelidir. Üç ardışık başarısızlıkta kaynak silinmez; `degraded` olur ve yöneticiye bildirilir. Kullanıcının araştırmasındaki kritik ilke korunur: bir sayfanın parse edilmemesi, daha önce doğrulanmış teklifi otomatik olarak geçersiz saymamalıdır.[1]

| Durum | Anlamı | Otomatik davranış |
|---|---|---|
| `healthy` | Başarılı alma ve parse | Normal zamanlama |
| `degraded` | Arka arkaya hata, rate limit veya yapı değişikliği | Frekansı düşür, yöneticiye uyarı, eski kanıtı koru |
| `paused` | Kullanım şartı/izin veya kalite incelemesi bekliyor | Yeni alma yok; kaynak geçmişi korunur |
| `retired` | Kaynak kalıcı olarak kaldırıldı | Yeni teklif yok; ilişkili geçmiş arşivlenir |

## 8. Veri modeli ekleri

Kanıt grafiği çekirdeği uygulanmıştır: `sources`, `source_observations`, `offer_evidence`, `offer_versions` ve `verification_runs`. Araştırmanın gerektirdiği aşağıdaki ekler bir sonraki migration dalgasına alınmalıdır.

| Tablo/alan | Değişiklik | Gerekçe |
|---|---|---|
| `offers.offer_type` | Yeni türleri enum’a ekle | Startup perk, temporary free, coupon gibi ayrımlar |
| `offers.value_amount`, `value_currency` | Yapılandırılmış sayısal değer | 200.000 USD kredi ile %20 indirimi ayrıştırmak |
| `offers.duration_days`, `renewal_period` | Süre/kota yenilenmesini ayrıştır | Trial ve düzenli free tier karşılaştırması |
| `offer_variants` | Bölge/segment/aşama bazlı varyant | Aynı kampanyanın farklı eligibility kolları |
| `eligibility_requirements` | `new_customer`, `student`, `startup_stage`, `company_type`, `partner_required` | Filtreleme ve doğru uyarı |
| `sources.health_status` | `healthy/degraded/paused/retired` | Adapter izleme ve hata yönetimi |
| `source_fetch_runs` | HTTP/parse/ETag/hata kodu/metrik | Kaynak bazlı gözlemlenebilirlik |
| `trial_trackers` | Kullanıcı kaydı, başlangıç, bitiş, yenileme riski, iptal URL’si | Keşif sonrası hatırlatma modülü |

Deduplikasyon anahtarı, `provider domain + normalized product + offer type + campaign identifier + region/segment variant` olmalıdır. Kod veya kupon metni tek başına benzersiz anahtar değildir; aynı kod farklı ürünlerde veya dönemlerde tekrar kullanılabilir.

## 9. Telegram, Reddit ve X için net kurallar

Araştırma belgesi Telegram Bot API ile botun yetkili olduğu kanal/gruplardan mesaj alma seçeneğini öneriyor.[1] Bu, önceki planla aşağıdaki şekilde uyumlandırılmıştır:

1. **Telegram public-channel crawler yoktur.** Kanal önizlemeleri veya kapalı/özel alanlar sistematik olarak alınmaz.
2. **Yalnızca opt-in bot/ortak akışı kabul edilir.** Kaynak ortağı veya kanal sahibi, bota resmî teklif URL’sini yapılandırılmış biçimde iletir.
3. **Telegram mesaj gövdesi LLM’e gönderilmez.** Bot yalnızca resmî URL, açık kaynak ortak kimliği ve minimum meta veri taşır; doğrulama sağlayıcının kendi alan adında yapılır.
4. **Bot ikinci aşamada bildirim kanalı olabilir.** Kullanıcılar yalnızca kendi kaydettikleri tekliflerde değişiklik/bitme uyarısı alır.
5. **Reddit/X de aynı statüdedir.** API ile alınan gönderiler adaydır; resmî URL kanıtı olmadan yayımlanmaz.

Bu sınırlama, sinyal kanallarının değerini korurken kişisel veri, platform koşulları ve kalite riskini yönetir.

## 10. Uygulama sırası

Önceki uygulama diliminde build güvenliği, kanıt şeması, migration, kanıt zorunlu moderasyon ve kullanıcı arayüzü tamamlanmıştır. Bu araştırmaya göre kalan uygulama sırası aşağıdaki gibi güncellenmiştir.

| Sprint | Teslim | Başarı ölçütü |
|---|---|---|
| 1 — Migration ve seed temizliği | Mevcut `evidence_graph` migration’ını hedef Supabase projesine uygula; 25 kaynak/teklif için kanıt backfill’i | Aktif tekliflerin %100’ünde resmî URL, alıntı ve son kontrol zamanı |
| 2 — Kaynak sağlığı | `source_health`, `source_fetch_runs`, adapter çalışma kaydı ve yönetici kaynak ekranı | Üç örnek kaynakta başarı/hata/ETag durumu görünür |
| 3 — Resmî adapterlar | AWS, Google Cloud, Microsoft, Vercel/Supabase/GitHub için ortak adapter altyapısı | Aynı kaynak yeniden alındığında çift gözlem/teklif oluşmaz |
| 4 — Varyant ve teklif sözleşmesi | Startup aşaması, ülke, kredi, para birimi, süre/yenileme alanları ve migration | Bir startup programının en az üç varyantı doğru filtrelenir |
| 5 — Yapılandırılmış keşif | Product Hunt API, GitHub değişiklik izleme ve RSS adapterları | Adaylar otomatik oluşur; resmî URL bulunmadan yayınlanmaz |
| 6 — Kürasyonlu dizinler | StartupPerks/DevDeals/InnMind için aday adapterları | Her adayın kaynak seviyesi ve resmî kanıt görevi var |
| 7 — Trial takipçisi | Kaydedilen teklifte başlangıç/bitiş, yenileme riski ve iptal bağlantısı | Kullanıcıya yalnızca açık rızayla hatırlatma gönderilir |
| 8 — Sinyal pilotu | Reddit/X; izinli Telegram bot ortaklığı veya bildirim kanalı | Yalnızca resmî alan adına giden sinyaller önceliklenir |

## 11. İlk teknik iş paketi

Bir sonraki uygulama görevi, yeni bir scraper yazmak değil aşağıdaki dört işi tamamlamaktır:

1. `SourceAdapter` ortak arayüzü, `source_fetch_runs` ve `source_health` migration’ını eklemek.
2. ETag/Last-Modified ve içerik karması destekli **tek bir resmî HTTP adapter** yazmak.
3. AWS Free Tier veya Google for Startups için yalnızca aday/kanıt gözlemi oluşturan ilk adapter’ı uygulamak.
4. Yönetici panelinde kaynak sağlığı, son fetch, son parse hatası ve aday→kanıt→yayın akışını göstermek.

Bu dikey dilim, teorik kaynak listelerini çalışma sistemine dönüştürür. İkinci adapter, ancak ilk adapter aynı içerikte tekrarsız çalışıyor; hata durumunda eski teklifleri gizlemiyor; resmî kanıt güncellenince yeni gözlem/sürüm oluşturuyorsa yazılmalıdır.

## 12. Başarı ölçütleri

| Metrik | Beta hedefi |
|---|---:|
| P0 kaynaklarla kanıtlanan aktif teklif oranı | %100 |
| İlk kaynak seti | 20–30 yüksek kaliteli kaynak |
| Kaynak health kontrolü kapsaması | %100 |
| Üç ardışık hata sonrası yanlış silinen aktif teklif | 0 |
| Adaydan resmî kanıtlı yayına dönüşüm oranı | Kaynak seviyesine göre izlenir; tek hedefe zorlanmaz |
| Kanıtsız sosyal sinyalin otomatik yayına dönüşmesi | 0 |
| Yeniden alma sonrası yinelenen aktif teklif | 0 |
| Kullanıcının doğru programı bulma süresi | 2 dakika altında (görev testi) |

## Kaynakça

[1] Kullanıcı tarafından sağlanan araştırma belgesi: *Free Tier Hunt — Kaynaklar, Benzer Projeler ve Tarama Mimarisi*, 13 Ağustos 2026. İçerdiği referanslar arasında [free-for-dev](https://github.com/ripienaar/free-for-dev), [Awesome Startup Deals](https://github.com/DobroslavRadosavljevic/awesome-startup-deals), [AWS Free Tier](https://aws.amazon.com/free/), [Google for Startups](https://cloud.google.com/startup), [Microsoft for Startups](https://learn.microsoft.com/en-us/startups/microsoft-for-startups/overview), [Reddit Data API](https://support.reddithelp.com/hc/en-us/articles/16160319875092-Reddit-Data-API-Wiki), [Telegram Bot API](https://core.telegram.org/bots/api), [Product Hunt API v2](https://api.producthunt.com/v2/docs) ve [GitHub REST API](https://docs.github.com/rest/guides/getting-started-with-the-rest-api) bulunmaktadır.
