# Sentetik Telegram Adayı → Resmî Sayfa AI Doğrulama Testi

**Tarih:** 13 Ağustos 2026  
**Durum:** Başarılı  
**Amaç:** Telegram aday alma sınırı ile resmî sağlayıcı sayfası üzerinden yürüyen AI doğrulama modülünü, canlı Telegram verisi veya canlı LLM çağrısı kullanmadan doğrulamak.

## Test sınırı

Bu test, gerçek Telegram kanal mesajlarını kullanmaz. `syntheticTelegramOfferCommand` yalnızca webhook komut biçimini temsil eden sentetik bir dizedir. Bu komuttaki ürün/başlık/URL verisi, aday ayrıştırıcısının çalışmasını denetlemek için kullanılır; **komutun ham metni model girdisine aktarılmaz**.

Modeli temsil eden yapılandırılmış çıktı, ayrı bir sentetik resmî sağlayıcı sayfası fixture’ına bağlanır. Resmî sayfa metni, doğrudan teklif değeri, süre, uygunluk, kart gereksinimi ve yenileme koşulunu içerir.

| Fixture | İçerik | AI katmanına aktarılır mı? |
|---|---|---|
| `syntheticTelegramOfferCommand` | Yapılandırılmış `/offer` komutu | Hayır |
| `syntheticOfficialPage.title` | Sağlayıcı sayfa başlığı | Evet |
| `syntheticOfficialPage.text` | Resmî teklif kanıtı | Evet |
| `supportedOfficialAnalysis` | Beklenen yapılandırılmış model çıktısı | Şema ve karar testi için |
| `unsupportedOfficialAnalysis` | Düşük güven/uyumsuz çıktı | İnsan incelemesi testi için |

## Çalıştırılan senaryolar

| Senaryo | Beklenen sonuç | Sonuç |
|---|---|---|
| Yapılandırılmış aday komutunun ayrıştırılması | Tür, ürün, başlık ve resmî URL çıkarılır | Başarılı |
| Model girdisi veri sınırı | Resmî sayfa metni görünür; `/offer` komutu ve sentetik kanal metni görünmez | Başarılı |
| Desteklenen teklif | Birebir resmî alıntı + `supported` + ≥%80 güven → `succeeded` | Başarılı |
| Desteklenmeyen teklif | `unsupported` kararı → `needs_review` | Başarılı |
| Halüsinasyon alıntısı | Resmî metinde bulunmayan alıntı → `needs_review` | Başarılı |

## Çalıştırma sonucu

```text
Test Files  7 passed (7)
Tests       25 passed (25)
```

Test komutu:

```bash
pnpm typecheck && pnpm test
```

## Kapsam dışı olanlar

Bu test, gerçek bir Telegram kanalını, canlı webhook teslimini, gerçek sağlayıcı sayfasına ağ isteğini veya ücretli/ücretsiz LLM sağlayıcı çağrısını çalıştırmaz. Bu bileşenler için üretim öncesinde ayrı bir staging ortamı, uygulanmış migration’lar, test botu, test kanalı ve yapılandırılmış LLM sağlayıcı anahtarı gerekir.

> Başarı koşulu, Telegram verisini modele göndermek değildir. Başarı; Telegram’ın yalnızca yönlendirme sınırında kalması, resmî sayfanın tek AI kanıt kaynağı olması ve kanıtsız ya da uyumsuz çıktının insan incelemesine yönlendirilmesidir.
