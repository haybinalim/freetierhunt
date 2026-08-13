# FreeTierHunt v2 — Güvenilir Fırsat Grafiği ve Üst Seviye Yol Haritası

**Hazırlayan:** Manus AI  
**Tarih:** 13 Ağustos 2026  
**Karar düzeyi:** Ürün stratejisi, veri işletimi, mimari ve teslim planı

## 1. Bu plan neden yeniden yazıldı?

İlk geliştirme planı doğru bir yön belirlemişti: geniş bir promosyon listesi yerine kanıtlı ücretsiz katmanları, denemeleri ve resmî fırsatları sunmak. Buna karşılık planın ana eksikliği, bir **fırsat dizini** oluşturmak ile sürdürülebilir bir **fırsat istihbarat ürünü** kurmak arasındaki farkı yeterince netleştirmemesiydi. Birincisi teklif sayısına odaklanır; ikincisi teklifin geçerliliğini, kime uyduğunu, ne zaman tekrar kontrol edilmesi gerektiğini ve kullanıcının doğru anda nasıl haberdar olacağını yönetir.

> **Sorduğumuz soru:** FreeTierHunt daha iyi nasıl olur?  
> **Cevap:** Daha fazla kanal, kod veya sayfa toplamaya çalışarak değil; her fırsatı kanıt, uygunluk, tazelik ve kullanıcı sonucu ile bağlayan küçük ama güvenilir bir “fırsat grafiği” kurarak daha iyi olur.

Bu ikinci sürüm, ilk plandaki eksikleri giderir: ürün odağını keskinleştirir, Telegram yaklaşımını kullanım koşullarıyla uyumlu hâle getirir, veri yaşam döngüsünü tanımlar, LLM kullanımını ölçülebilir hâle getirir, operasyon yükünü sınırlar ve ölçülebilir bir beta öğrenme döngüsü ekler.

| İlk planın güçlü tarafı | Eksik veya riskli tarafı | v2 düzeltmesi |
|---|---|---|
| Kanıt ve son doğrulama vurgusu | Kanıtın veri modeli, sürümü ve yaşam döngüsü net değildi | Kanıt, kaynak, gözlem ve doğrulama koşusunu ayrı bir kayıt zinciri olarak tanımlar |
| Altı haftalık dikey teslim yaklaşımı | Başarı ölçütleri çoğunlukla “özellik tamamlandı” düzeyindeydi | Her aşama kullanıcı değeri, veri kalitesi ve operasyon kapasitesi eşiğiyle kapanır |
| LLM’in doğrudan yayımlamaması | Altın veri seti, kalibrasyon, karar geri alma ve prompt sürümü yoktu | Değerlendirme seti, prompt/model sürümü, kalibre güven ve denetim izi eklenir |
| Telegram’ı aday sinyali sayması | Telegram API verisinin AI geliştirme/dağıtımı için kullanılmasına ilişkin kısıtla çatışma riski vardı | Otomatik Telegram alma kaldırılır; yalnızca izinli, yapılandırılmış ve Telegram dışı kanıt akışları kullanılır |
| Kimlik/bildirim planı | Kullanıcı değer döngüsü ve e-posta izin modeli geç başlıyordu | “Kaydet → eşleştir → uyar → geri bildir” döngüsü, yalnızca değer kanıtlandıktan sonra açılır |
| Kaynak ve teklif sayısı hedefleri | Hedefler kalite, fiyat yenileme ve bölgesel uygunlukla bağlanmıyordu | Kuzey yıldızı ve kalite kapıları eklenir |

## 2. Stratejik yeniden çerçeveleme

### 2.1 Ürün tanımı

FreeTierHunt, “AI kupon sitesi” değildir. **Indie maker, öğrenci, nonprofit ve erken aşama startup için doğrulanmış AI araç fırsatları karar yardımcısıdır.** Kullanıcıya yalnızca “indirim var” bilgisini değil, dört karar sorusunun cevabını verir:

1. **Bu fırsat gerçekten var mı ve hangi resmî kaynak bunu kanıtlıyor?**
2. **Benim ülkem, rolüm ve uygunluk durumum için geçerli mi?**
3. **İlk faturadan sonra yenileme fiyatı, süre ve kullanım sınırı nedir?**
4. **Bu teklif değiştiğinde veya sona yaklaşırken nasıl haberdar olurum?**

Bu konumlandırma önemlidir. Güncel rakip örnekleri “doğrulanmış”, “son kontrol tarihi”, “biten fırsatlar” ve resmî sağlayıcı bağlantılarını görünür kılar.[1] [2] FreeTierHunt’ın savunulabilir farkı, yalnızca öğrenci fırsatlarında derinleşmek değil; **fırsatların kanıt zincirini, uygunluk mantığını, geçmişini ve gerçek kullanım geri bildirimini tek modelde birleştirmektir.**

### 2.2 İlk kullanıcı dilimi: tek bir beachhead

İlk plan aynı anda “vibe coder”, öğrenci, içerik üreticisi, startup ve nonprofit kullanıcılara sesleniyordu. Bu, doğru veriyi toplama ve doğru deneyimi tasarlama maliyetini yükseltir. V2’de ilk 90 gün için tek beachhead önerilir:

> **Birincil kullanıcı:** Her ay birden fazla AI geliştirme aracı deneyen, bireysel çalışan veya öğrenci olan erken aşama maker.

İlk katalog yalnızca dört kategoriyle başlar: **AI coding, model/API, geliştirme/hosting ve tasarım-medya üretimi.** Öğrenci, startup ve nonprofit uygunluk alanları veri modelinde baştan yer alır; ancak özel akış ve pazarlama ancak çekirdek doğruluk eşiği geçildikten sonra açılır.

| Segment | V1/V2 rolü | İlk 90 gün kararı |
|---|---|---|
| Bireysel maker / öğrenci geliştirici | Ana kullanıcı | Öncelikli deneyim, beta görüşmesi ve teklif kategorisi |
| Doğrulanmış öğrenciler | Uygunluk etiketi | Özel landing page yok; sayfa başına “öğrenci için” filtresi yeterli |
| Startup / nonprofit | Veri niteliği | Resmî programlar eklendikçe kapsama alınır |
| Genel AI tüketicisi | Sonraki segment | İlk dönemde hedeflenmez |
| Fırsat paylaşan topluluklar | Kaynak ortaklığı | Sadece yapılandırılmış/izinli aday akışı; ürünün merkezinde değildir |

### 2.3 Kuzey yıldızı ve değer hipotezi

Kuzey yıldızı metrik, sayfa görüntülemesi veya katalog büyüklüğü değil **doğrulanmış fırsat aktivasyonu** olmalıdır:

> **VFA (Verified Offer Activation):** Kullanıcının bir teklifi kaydetmesi, resmî kaynak bağlantısına gitmesi ve 14 gün içinde “uygundu/çalıştı” veya “uygun değildi/çalışmadı” geri bildirimi bırakması.

Bu metrik, keşfi, kişisel uygunluğu, tıklamayı ve kalite geri bildirimini aynı olaya bağlar. Lansman öncesi başarı hedefi: haftalık 20 benzersiz VFA; aktif tekliflerde en az %80 resmî kanıt kapsaması; “çalışmadı” geri bildirimlerinin 24 saat içinde kuyruklanması.

## 3. İlk planın derin eksik analizi

### 3.1 Ürün ve kullanıcı döngüsü eksikleri

İlk plan, sayfaları ve özellikleri listeliyordu; fakat kullanıcının tekrar gelmesini sağlayan kapalı döngüyü tarif etmiyordu. “Teklif bulma” tek seferlik bir iş olabilir. Ürünün alışkanlık yaratması için kullanıcı önce uygun fırsatı görmeli, ardından kaydetmeli, sonrasında değişiklikten haberdar olmalı ve sonucu geri bildirmelidir.

| Eksik | Neden kritik? | v2 çözümü |
|---|---|---|
| Kullanıcı için “en uygun” teklif tanımı | Aynı teklif ülke, öğrenci durumu veya mevcut plan nedeniyle anlamsız olabilir | Profil yerine önce isteğe bağlı “uygunluk kartı”: ülke/bölge, öğrenci/indie/nonprofit/startup, kategori; açık rıza ile saklanır |
| Yenileme fiyatı ve koşullar | Kullanıcı yalnızca ilk indirim değil sonraki maliyeti de bilmek ister | `renewal_price`, `billing_cycle`, `requires_card`, `auto_renews`, `cancellation_terms` alanları |
| Teklif geçmişi | “Bugün doğru” bilgisi yarın yanlış olabilir | Fırsat durum zaman çizelgesi ve önceki kanıt anlık görüntüleri |
| Geri bildirimden aksiyona geçiş | Oy sayısı tek başına güvenilir değildir | Geri bildirim ağırlığı + anomali eşiği + yeniden doğrulama işi |
| Biten tekliflerin yönetimi | Silmek kullanıcı güvenini azaltır | `expired`, `withdrawn`, `superseded`, `unknown` durumları; eski kayıtlar arşivde kalır |
| İptal/bitiş uyarısı | E-posta yalnızca genel digest olursa kişisel değer zayıf kalır | Kullanıcının kaydettiği tekliflerde değişiklik, süresi yaklaşma ve yeniden doğrulama uyarısı |

### 3.2 Veri modeli ve doğruluk eksikleri

İlk plan veri tablosu önermiş olsa da “teklifin gerçeği” ile “bir kaynağın o teklife dair iddiası” arasındaki ayrımı tam kurmuyordu. Bu ayrım olmadan hatalı veri düzeltmek, kaynaklar çeliştiğinde karar vermek ve denetim yapmak zorlaşır.

V2, aşağıdaki üç katmanı zorunlu kılar:

| Katman | Sorumluluk | Örnek |
|---|---|---|
| **Kaynak gözlemi** | Bir URL veya izinli yapılandırılmış kaynaktan ne görüldü? | Bir sağlayıcının fiyat sayfasında “14 gün deneme” metni |
| **Teklif iddiası** | Bu gözlem hangi teklif alanını destekliyor? | `trial_days = 14`, `requires_card = true` |
| **Yayınlanmış teklif sürümü** | Kullanıcıya hangi alanlar, hangi kanıt setiyle gösterildi? | 13 Ağustos sürümü, “resmî kaynakla doğrulandı” |

Bu tasarım, bir kanıt sayfası değiştiğinde mevcut teklifi sessizce ezmek yerine yeni gözlem oluşturur, alan bazlı farkı kaydeder ve yeniden inceleme başlatır. Aynı zamanda yanlış bir teklifin geriye dönük olarak nasıl yayımlandığını açıklayabilmeyi sağlar.

### 3.3 LLM ve otomasyon eksikleri

LLM’den yapılandırılmış çıkarım almak faydalıdır; ancak LLM güven skoru kalite ölçümü değildir. İlk plan, otomatik karar eşiği öneriyor fakat bu eşiklerin hangi gerçek veri üzerinde kalibre edildiğini tanımlamıyordu.

**V2 otomasyon kuralı:** LLM yalnızca adayların alanlarını çıkarmak veya kanıtı sınıflandırmak için kullanılır. Yayımlama, en az bir resmî kanıt URL’si ve deterministik doğrulama kuralları olmadan otomatik gerçekleşmez. Her model/prompt değişikliği, insan etiketli sabit “altın veri seti” üzerinde ölçülür.

| Kontrol | Uygulama | Yayın eşiği |
|---|---|---|
| Altın veri seti | En az 120 örnek: aktif, bitmiş, yanıltıcı, bölgesel ve koşullu fırsatlar | İlk otomasyondan önce hazırlanır |
| Alan bazlı doğruluk | Kod, değer, süre, uygunluk ve bitiş tarihi ayrı ayrı ölçülür | Kritik alanlarda hassasiyet %98+; diğerlerinde %90+ |
| Güven kalibrasyonu | 0,90 tahminleri gerçekten yaklaşık %90 doğru mu? | Beklenen kalibrasyon hatası izlenir |
| Prompt/model sürümü | Her çıkarım kaydına sürüm, giriş karması ve maliyet yazılır | Geriye dönük tekrar üretim mümkün olur |
| İnsan inceleme kuyruğu | Belirsiz, çelişkili, yüksek değerli veya hızlı yayılan teklifler | 48 saat içi ilk karar |
| Kill switch | Kaynak, model veya doğrulama kuralı hatalı davranırsa otomasyon durdurulur | Yönetici panelinden anında etkinleştirilir |

### 3.4 İşletim, maliyet ve dayanıklılık eksikleri

İlk plan BullMQ, Redis, Oracle VM, Meilisearch, Firecrawl ve çoklu LLM yönlendiricisini aynı anda öneriyor. Bu set ileri aşamada anlamlı olabilir; ancak tek kişilik MVP’de operasyon yüzeyi ürün hızını düşürür. Üstelik beklenen değer henüz kanıtlanmadan pahalı bir çalışma zinciri oluşturur.

V2, “**önce yalın ve ölçülebilir; sonra ölçeklenebilir**” ilkesini uygular. İlk canlı sürüm için Postgres + Next.js + tek zamanlayıcı + basit Postgres araması + objekt storage yeterlidir. Ayrı Redis/BullMQ işçileri yalnızca günlük iş sayısı, zaman aşımı veya tekrarlanabilirlik ihtiyacı bunu gerektirdiğinde devreye alınır. Meilisearch yalnızca Postgres aramasıyla ölçülen gecikme veya sıralama ihtiyacı belirginleştiğinde eklenir.

| Karar alanı | İlk plan | v2 kararı | Geçiş tetikleyicisi |
|---|---|---|---|
| İş kuyruğu | BullMQ + Redis en başta | Önce Postgres tabanlı `jobs` tablosu ve tek worker | Günlük 500+ iş, karmaşık yeniden deneme veya paralel işlem ihtiyacı |
| Arama | Meilisearch hedefi | Önce Postgres full-text + trigram + filtreler | p95 arama > 400 ms veya sonuç kalitesi ölçülebilir biçimde yetersiz |
| LLM yönlendirme | 4 sağlayıcı | Birincil + tek yedek; deterministik fallback | Sağlayıcı hatası/limitleri aylık SLO’yu bozarsa |
| Sayfa alma | Firecrawl öncelikli | Resmî sayfada HTTP/structured data önce; render yalnızca ihtiyaçta | Statik alma başarı oranı < %80 |
| Gözlemlenebilirlik | Birçok araç | Tek hata izleme + yapılandırılmış log + iş ekranı | Beta sonrası ürün analitiği ayrıştırılır |

### 3.5 Telegram yaklaşımındaki kritik düzeltme

İlk plan, kamuya açık Telegram kanallarını izin listeli aday kaynaklar olarak önermişti. Bu yaklaşım, Telegram API Koşulları’nın Telegram verisinin yapay zekâ/ML teknolojilerini eğitmek, geliştirmek veya dağıtmak için kullanılmasına ilişkin yasağıyla risk taşıyabilir.[3] Telegram kanal içeriğini LLM çıkarım hattına göndermek veya sistematik olarak toplamak, bu bağlamda doğru bir mimari seçimi değildir.

**V2 kararı:** Telegram üzerinden otomatik keşif, alma, depolama veya LLM ile işleme yapılmayacaktır. Bunun yerine “Doğrulanmış Kaynak Ortaklığı” uygulanır:

1. Bir kanal sahibi veya üretici, FreeTierHunt’a **yapılandırılmış teklif URL’si** veya sağladığı API/RSS/e-posta/webhook akışıyla başvurur.
2. Sistem yalnızca Telegram dışındaki resmî ürün sayfası ve bu yapılandırılmış akış üzerinde çalışır.
3. Telegram bağlantısı, yalnızca kullanıcının gidebileceği dış bağlantı/meta veri olarak tutulur; mesaj içeriği kopyalanmaz, indekslenmez, LLM’e gönderilmez.
4. Her kaynak ortağı için yazılı izin, kaldırma mekanizması ve veri işleme kaydı tutulur.

Bu karar “kanal listesi” ürününü zayıflatmaz; aksine FreeTierHunt’ı **doğrulanabilir fırsata yönlendiren kaynak dizini** hâline getirir. Kullanıcı kanala değil, güvenilir teklife gelir.

## 4. Hedef ürün: Fırsat grafiği

### 4.1 Teklif yaşam döngüsü

Bir teklif her zaman “aktif” veya “süresi dolmuş” değildir. V2, teklifi aşağıdaki durum makinesiyle yönetir.

```text
candidate → evidence_required → under_review → published
                         ↘ rejected
published → reverify_due → verified → published
          ↘ stale → hidden
          ↘ expired / withdrawn / superseded → archived
```

| Durum | Kullanıcıya görünür mü? | Giriş koşulu | Çıkış koşulu |
|---|---:|---|---|
| `candidate` | Hayır | Kaynak veya kullanıcıdan ilk aday | Kanıt keşfi ya da ret |
| `evidence_required` | Hayır | Aday var, resmî kanıt yok | Kanıt bulundu / süre aşıldı |
| `under_review` | Hayır | Çelişki, yüksek değer veya düşük güven | İnsan kararı |
| `published` | Evet | Kanıt, uygunluk ve zorunlu alanlar tamam | Yeniden doğrulama zamanı/rapor |
| `reverify_due` | Evet, uyarıyla | Tazelik SLA’sı doldu | Başarılı kontrol / gizleme |
| `stale` | Varsayılan aramada hayır | Kanıt güncellenemedi | Tekrar doğrulama / arşiv |
| `expired` | Arşivde | Süre sonu veya resmî bitiş kanıtı | Yerine geçen teklif varsa `superseded` |
| `withdrawn` | Arşivde | Sağlayıcı kaldırma talebi | Manuel değerlendirme |

### 4.2 Teklif sözleşmesi (offer contract)

Her yayımlanmış teklif aşağıdaki alanları taşımadan listelenemez. Bu sözleşme, hem ürün tasarımını hem de alınan verinin şemasını tanımlar.

| Alan grubu | Zorunlu alanlar | Kullanıcı değeri |
|---|---|---|
| Kimlik | ürün, kanonik alan adı, teklif türü, teklif başlığı | Aynı markadaki farklı fırsatları ayırır |
| Değer | tutar/yüzde/kredi/süre, para birimi, kullanım limiti | Nominal tasarrufu doğru yorumlar |
| Uygunluk | bölge, kullanıcı tipi, doğrulama yöntemi, yeni/mevcut müşteri | “Bana uyar mı?” sorusunu çözer |
| Faturalama | kart gerekir mi, otomatik yenileme, yenileme fiyatı, iptal koşulu | Kupon tuzağını engeller |
| Kanıt | resmî URL, alıntı, gözlem zamanı, kanıt sürümü | Güveni görünür yapar |
| Geçerlilik | başlama/bitiş, durum, yeniden kontrol zamanı | Tazelik ve güvenilirlik |
| Eylem | kanonik claim URL’si, link güvenlik durumu | Kullanıcıyı doğru sayfaya götürür |

### 4.3 Güven skoru yerine açıklanabilir güven sinyalleri

Tek bir 0–100 güven puanı kullanıcının neye güveneceğini anlatmaz. İçeride karar destekleyici skor olabilir; arayüzde ise ayrıştırılmış sinyaller gösterilmelidir: **resmî kaynak**, **son X gün içinde kontrol edildi**, **uygunluk açık**, **toplulukta N doğrulama**, **yenileme bilgisi açık**. Böylece skor manipülasyonu yerine açıklanabilirlik sağlanır.

## 5. Kullanıcı deneyimi ve büyüme motoru

### 5.1 Ana kullanıcı akışı

```text
Kategori/arama → 30 sn uygunluk seçimi → kanıtlı teklif karşılaştırması
→ resmî sayfaya git → kaydet / takip et → sonuç geri bildirimi
→ teklif değiştiğinde kişisel uyarı → yeni uygun teklif önerisi
```

Ana sayfa “bugünün en iyi teklifleri” listesinden “**senin durumuna uygun doğrulanmış fırsatlar**” başlangıcına geçmelidir. Kullanıcı ilk anda hesap oluşturmak zorunda kalmamalı; kişisel filtre yalnızca tarayıcıda çalışmalı, kaydetme/uyarı için açık rızayla hesap istenmelidir.

### 5.2 Sayfa türleri ve bilgi mimarisi

| Sayfa | Birincil amaç | Başarı olayı |
|---|---|---|
| `/` | Değer vaadi ve en güvenilir fırsatları hızlı göstermek | Kategori/arama veya uygunluk seçimi |
| `/deals` | Kısıtlarla arama, karşılaştırma ve filtre | Teklif detayına geçiş |
| `/deals/[slug]` | Kanıt, koşul, geçmiş ve claim eylemi | Resmî site tıklaması / kaydetme |
| `/programs/student` | Öğrenci programlarını anlaşılır biçimde toplamak | Uygun teklif aktivasyonu |
| `/programs/startup` | Başlangıç kredileri ve resmi programlar | Uygun teklif aktivasyonu |
| `/submit` | Kanıtlı aday toplamak | Eksiksiz kaynaklı aday |
| `/sources` | Şeffaflık ve kaynak ortaklığı | Kaynak başvurusu / takedown |
| `/saved` | Takip edilen fırsatlar ve değişiklik geçmişi | Geri bildirim / uyarı tercihi |

### 5.3 SEO ve dağıtım stratejisi

İlk planın blog listesi genişti ancak veri ürünüyle sıkı bağ kurmuyordu. V2’de SEO, programatik ama düşük kaliteli sayfa üretimi yerine **kanıtlı, değişiklik tarihli ve görev odaklı** sayfalardan gelir.

| İçerik kümesi | Örnek | Amaç |
|---|---|---|
| Sağlayıcı + uygunluk | “GitHub Copilot öğrenci erişimi: şartlar, yenileme, son kontrol” | Yüksek niyetli uzun kuyruk arama |
| Kategori + kullanım senaryosu | “Bireysel maker için ücretsiz AI coding stack’i” | Karşılaştırmalı karar desteği |
| Program rehberi | “Startup AI kredileri: başvuru şartları ve son tarihler” | Yapısal, tekrar ziyaret edilen kaynak |
| Değişiklik raporu | “Bu hafta değişen AI ücretsiz katmanları” | E-posta/X/community geri dönüşü |

Her içerik sayfası ilgili teklif kayıtlarından üretilen, kaynaklı ve son kontrol zamanlı bloklar içermelidir. Böylece içerik kataloğu besler; katalog da içeriği güncel tutar.

## 6. Uygulanabilir mimari ve veri işletimi

### 6.1 İlk sürüm teknoloji kararı

| Katman | V2 ilk tercih | Neden |
|---|---|---|
| Web | Mevcut Next.js + TypeScript + Tailwind | Mevcut yatırımı korur |
| Veri | Supabase Postgres + Drizzle migrations | Kanıt grafiği için ilişkisel tutarlılık ve RLS |
| Kimlik | Supabase Auth UUID + `profiles` tablosu | Çakışmayan kimlik modeli |
| İşler | Postgres `jobs` + tek Node worker | Daha az operasyon yüzeyi; idempotent iş modeli |
| Alma | Resmî API/RSS/izinli webhook, sonra hafif HTTP | Kaynak önceliği ve maliyet kontrolü |
| Dosya kanıtı | Supabase Storage veya S3-uyumlu nesne depolama | Kanıt sürümü ve değişiklik incelemesi |
| Arama | Postgres FTS/trigram | İlk katalogda yeterli; filtreler tek kaynakta |
| Gözlemlenebilirlik | Sentry + Pino + `job_runs` ekranı | Hata, maliyet ve iş gecikmesi görünür |

### 6.2 Minimum veri şeması kararları

Mevcut şemadaki `users.id serial` modeli, Supabase Auth UUID kimliğiyle uyumlu değildir; bu, kimlik/saklama planından önce çözülmelidir.[4] V2’de `profiles.id uuid primary key references auth.users(id)` kullanılmalı; kullanıcı bağlantılı tüm kayıtlar UUID yabancı anahtarlarla bağlanmalıdır. Ürün, teklif ve kaynak ilişkilerine gerçek yabancı anahtarlar; seçili alanlara benzersiz kısıtlar ve açık silme davranışı eklenmelidir.

Yeni/yenilenecek temel tablolar: `profiles`, `sources`, `source_observations`, `offers`, `offer_versions`, `offer_evidence`, `verification_runs`, `feedback`, `saved_offers`, `jobs`, `job_runs`, `audit_log`, `source_partnerships`.

### 6.3 İş sözleşmesi

Her asenkron iş için şu alanlar zorunludur: `type`, `dedupe_key`, `payload_version`, `scheduled_at`, `attempt`, `max_attempts`, `lock_token`, `status`, `last_error`, `created_at`, `finished_at`. İşçi, satırı atomik şekilde kilitler, süre aşımı sonrası güvenli biçimde geri alır ve aynı `dedupe_key` ile yinelenen işi oluşturmaz.

İlk iş tipleri sınırlı tutulur: `sync_source`, `normalize_observation`, `verify_offer`, `reverify_offer`, `recalculate_offer_state`, `send_digest`. Her iş tipi için hedef süre, tekrar politikası, maliyet tavanı ve başarısızlık yönlendirmesi `job_policy` konfigürasyonunda tanımlanır.

### 6.4 Güvenlik ve kullanıcı korunması

Fırsat sitesi dış bağlantı, aldatıcı kampanya ve kötü niyetli yönlendirme riski taşır. Bu nedenle teklif yayımlanmadan önce alan adı kanonikleştirme, HTTPS, zararlı alan adı taraması/allowlist, takip parametrelerinin temizlenmesi ve resmî alan adı eşleşmesi yapılmalıdır. “Kart gerekiyor” ve “otomatik yenileme” bilgileri açıkça işaretlenmelidir; kullanıcıdan ödeme bilgisi, hesap parolası veya kimlik belgesi asla istenmez.

Kullanıcı gönderimleri için kaynak URL’si, sunucu tarafı şema doğrulaması, IP ve kullanıcı düzeyinde hız limiti, tekrar tespiti, CSRF koruması, Turnstile ve moderasyon durumu gerekir. Yönetici işlemleri `ADMIN_TOKEN` yerine Supabase kullanıcı rolü, RLS ve denetim kaydıyla korunmalıdır.[5]

## 7. On haftalık teslim planı

Bu plan, mevcut depodan canlı beta kararına kadar olan işi on haftada bitirir. Süreler tek geliştirici için yaklaşık kapasite varsayımıdır; her sprint sonunda bir “devam/pivot/durdur” kapısı vardır.

| Sprint | Hedef | Teslimler | Kalite kapısı | Karar |
|---|---|---|---|---|
| 0 — 2 gün | Temeli stabil hâle getirmek | Ortam sözleşmesi, build-safe DB erişimi, lint CLI, migration altyapısı, UUID geçiş tasarımı | `typecheck`, lint, test ve prod build temiz ortamda geçer | Geçmeden özellik eklenmez |
| 1 — 1 hafta | Kanıt grafiğinin ilk dilimi | Kaynak/kanıt/teklif sürüm migrationları, yönetici kaynak ekleme, teklif detayında kanıt ve tazelik | 25 teklifin %100’ünde resmî kanıt + güncel durum | Veri sözleşmesi kabul edilir |
| 2 — 1 hafta | Elle kürasyonun hızlanması | CSV/Markdown içe aktarma, alan bazlı doğrulama, değişiklik farkı, arşiv durumu | 100 teklif 2 saatten az editör süresiyle hazırlanır | Katalog genişler |
| 3 — 1 hafta | Tek resmî kaynakla otomasyon | Bir API/RSS/izinli webhook konektörü, Postgres işi, gözlem normalizasyonu, tekrar önleme | Aynı kaynak üç kez çalıştırıldığında çifte kayıt oluşmaz | İkinci kaynak için ölçüm |
| 4 — 1 hafta | Doğrulama güveni | Altın veri seti, deterministik kurallar, LLM çıkarımı, inceleme kuyruğu, kill switch | Kritik alan hassasiyeti %98+, hiçbir kanıtsız otomatik yayın yok | Otomasyon kapsamı artırılır |
| 5 — 1 hafta | Kullanıcı değer döngüsü | Arama/filtre, yerel uygunluk seçimi, kaydetme, teklif geçmişi, “çalıştı/çalışmadı” | 5 kullanıcıyla görev testinde teklif bulma < 2 dakika | Hesap ihtiyacı doğrulanır |
| 6 — 1 hafta | Kimlik ve kişisel uyarılar | Supabase Auth UUID, RLS, sunucu taraflı kaydetme, e-posta açık rızası, takip edilen teklif değişikliği | 10 beta kullanıcısında kaydetme/uyarı akışı hatasız | Digest yalnızca değer varsa |
| 7 — 1 hafta | Kaynak ortaklığı ve gönderim | Yapılandırılmış kaynak başvurusu, kanıtlı submit, rate limit, Turnstile, admin karar ekranı | Gönderimler kaynak/kanıt olmadan yayımlanamıyor | Kaynak ortaklığı pilotu |
| 8 — 1 hafta | Kalite işletimi | Yeniden doğrulama politikası, stale/expired akışı, geri bildirim triage’ı, iş runbook’u | Geçersiz raporların %90’ı 24 saat içinde işleniyor | Soft launch uygunluğu |
| 9 — 1 hafta | Beta/dağıtım | 20 kullanıcı beta, görüşme formu, ürün analitiği, SEO temel sayfaları, destek/takedown akışı | Haftalık 20 VFA veya net nitel geri bildirim | Büyüme/pivot kararı |

## 8. Sprint 0: uygulanacak teknik iş sırası

İlk sprintte görünür ürün özelliği değil, geri kalan tüm işin üzerine oturacağı güvenilir temel teslim edilir.

1. `DATABASE_URL` eksikken build’in kırılmasına neden olan import zamanlı bağlantı kaldırılır; DB kullanan sayfa/route’lar dinamik sınırda çalışır.
2. `next lint` betiği ESLint CLI’ye geçirilir; seed/reset işlemlerindeki log kullanımı açık kural veya logger ile standartlaştırılır.
3. `drizzle-kit generate` çıktısı depoya alınır; `db:push` sadece yerel geliştirme komutu olarak ayrılır.
4. `profiles` UUID şeması ve mevcut `users`/`saved_offers` geçiş planı hazırlanır; üretim verisi yoksa temiz migration, varsa çift yazım/backfill/geri dönüş yöntemi uygulanır.
5. Vitest ile normalizasyon, tazelik hesabı ve durum makinesi birim testleri; Playwright ile en az bir teklif ayrıntı akışı eklenir.
6. CI sırası: format kontrolü → typecheck → unit test → build → migration drift kontrolü → preview smoke test. Hiçbir adım gerçek üretim gizli anahtarı gerektirmez.

## 9. Ölçüm planı ve karar kapıları

### 9.1 Olay sözlüğü

Analitik, yalnızca ürün kararı için gerekli olayları toplamalı; ham IP veya hassas profil verisi içermemelidir.

| Olay | Özellikler | Ürün sorusu |
|---|---|---|
| `deal_list_viewed` | kategori, filtre kümesi | Kullanıcı ne arıyor? |
| `eligibility_set` | sadece kapsam etiketi | Uygunluk filtresi değer yaratıyor mu? |
| `deal_viewed` | teklif sürümü, kaynak rozeti | Hangi teklifler ilgi çekiyor? |
| `claim_clicked` | teklif, güven sinyalleri | Kanıt tıklamayı artırıyor mu? |
| `deal_saved` | teklif, anonim/oturumlu | Takip değeri var mı? |
| `feedback_submitted` | sonuç, teklif yaşı | Hangi teklifler çürüyor? |
| `alert_opened` | uyarı tipi | Uyarı kişisel değer yaratıyor mu? |
| `source_submitted` | kaynak türü, doğrulama sonucu | Kaynak ortaklığı kaliteli mi? |

### 9.2 Hafta sonu kararları

| Kapı | Ölçüm | Eylem |
|---|---|---|
| Veri güveni | Aktif tekliflerin %95+’inde kanıt ve tazelik alanı | Sağlanmazsa yeni kaynak eklemek durur; kürasyon/doğrulama düzeltilir |
| Otomasyon güveni | Altın sette kritik alan hassasiyeti %98+ | Sağlanmazsa LLM otomasyonu yalnızca taslakta kalır |
| Kullanıcı değeri | 5 görüşmeden 3’ü aynı görevi ürünle daha hızlı tamamlıyor | Sağlanmazsa bilgi mimarisi/filtreler revize edilir |
| Operasyon kapasitesi | Haftalık manuel moderasyon 3 saat altında | Aşılıyorsa kaynak sayısı değil doğrulama araçları geliştirilir |
| Retansiyon sinyali | Beta kullanıcılarının %30+’u 14 gün içinde geri dönüyor | Sağlanmazsa alert/saved loop test edilir |
| Büyüme | Haftalık 20 VFA veya güçlü nitel talep | Sağlanmazsa kanala yatırım yerine müşteri görüşmesi yapılır |

## 10. Risk kaydı ve azaltım

| Risk | Erken sinyal | Sahibi | Önleyici kontrol | Geri dönüş |
|---|---|---|---|---|
| Süresi geçmiş teklifler | “Çalışmadı” oranı yükselir | Veri işletimi | Kategori bazlı tazelik SLA’sı, yeniden doğrulama kuyruğu | Hızlı gizleme + arşiv notu |
| Kaynaksız/yanıltıcı iddia | Kanıt URL’si yok veya alan adı uyuşmuyor | Moderasyon | Offer contract zorunluluğu | Ret, kaynak askıya alma |
| LLM hatası | Altın set hatası veya kalibrasyon bozulması | Otomasyon | Taslak-only, prompt sürümü, kill switch | Son sürümü geri alma |
| Operasyon aşırı karmaşıklığı | Worker/Redis/search bakımına zaman harcanması | Teknik sahip | Geçiş tetikleyicileri olmadan araç eklememe | Sade Postgres mimarisine dönme |
| E-posta güveni | Düşük açılma, şikâyet veya unsubscribe | Ürün | Çift onay, değer temelli uyarılar, sıklık sınırı | Genel digest’i durdurma |
| Dış bağlantı riski | Alan adı değişimi, yönlendirme, rapor | Güvenlik | Kanonik alan adı, link taraması, görünür uyarılar | Bağlantıyı gizleme, inceleme |
| Telegram koşul uyumu | Kaynak işleme/LLM ihtiyacı doğması | Ürün/teknik | Otomatik Telegram alma yasağı | Yalnızca yapılandırılmış, Telegram dışı ortak akış |

## 11. Nelerin yapılmayacağı

V2’nin başarısı doğru retlerden gelir. İlk 90 günde mobil uygulama, Chrome eklentisi, otomatik kupon uygulama, çok dilli tam yerelleştirme, Meilisearch, çok sağlayıcılı agresif LLM yönlendirme, üretici dashboard’u, ücretli abonelik, kapalı grup tarama veya Telegram kanal içerik alma yapılmaz. Bunlar ancak aşağıdaki üç şey kanıtlandıktan sonra ele alınır: veri güveni, kullanıcı aktivasyonu ve yönetilebilir operasyon yükü.

## 12. İlk üç gün için net iş paketi

**Gün 1:** Build kırılmasını çöz, CI’yı gerçek testlerle yeşile çevir, `profiles` UUID kararı ve migration taslağını oluştur.  
**Gün 2:** `sources`, `source_observations`, `offer_evidence`, `offer_versions` şemasını uygula; var olan seed tekliflerinden 10 tanesini yeni offer contract’a geçir.  
**Gün 3:** Yönetici için kaynak ekleme/teklif inceleme ekranında kanıt URL’si, alıntı, son gözlem ve durum zaman çizelgesini göster; mevcut teklif kartına “resmî kaynak” ve “son kontrol” sinyallerini ekle.

Bu üç gün tamamlandığında proje, görünüşü çalışan ama veri güveni belirsiz bir katalog olmaktan çıkar; tekliflerin kaynağını ve değişimini yönetebilen, ölçülebilir bir ürün çekirdeğine dönüşür.

## Kaynakça

[1] [AI Student Discounts 2026 — aktif/biten teklifler, doğrulama ve son kontrol yaklaşımı](https://aistudentdiscount.com/deals/)  
[2] [AI Deals & Discounts — resmî kaynak, yenileme/uygunluk ve kupon tuzağı yaklaşımı](https://www.layer3labs.io/ai-discounts)  
[3] [Telegram API Terms of Service — gizlilik, yapay zekâ veri kullanımı ve kanal erişimi](https://core.telegram.org/api/terms)  
[4] [FreeTierHunt veri şeması — mevcut seri kimlik ve ilişki modeli](https://github.com/haybinalim/freetierhunt/blob/a7de091/src/lib/db/schema.ts)  
[5] [FreeTierHunt yönetici koruması — geçici paylaşılan anahtar yaklaşımı](https://github.com/haybinalim/freetierhunt/blob/a7de091/src/lib/admin/guard.ts)
