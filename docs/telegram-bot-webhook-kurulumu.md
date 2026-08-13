# FreeTierHunt — Yetkili Telegram Bot Webhook Kurulumu

**Kapsam:** Bu entegrasyon yalnızca botun açıkça yetkilendirildiği kanallardaki yapılandırılmış `/offer` komutlarını kabul eder. Genel kanal taraması, kapalı grup erişimi ve ham mesaj içeriğinin saklanması kapsam dışıdır.

## Resmî API gereksinimleri

Telegram Bot API, güncellemeleri `getUpdates` veya webhook ile almayı destekler; iki yöntem aynı anda kullanılmaz. Webhook kullanıldığında Telegram, yapılandırılan HTTPS URL’sine JSON `Update` nesnesi gönderir. `channel_post` güncellemeleri webhook `allowed_updates` listesine eklenmelidir. `secret_token` yapılandırılırsa Telegram her istekte `X-Telegram-Bot-Api-Secret-Token` başlığını gönderir; uygulama bu değeri doğrular.[1]

Telegram API koşulları gizliliğin korunmasını zorunlu tutar ve Telegram verisinin yapay zekâ/ML teknolojilerinin eğitimi, geliştirilmesi veya dağıtımı için kullanılmasını yasaklar.[2] Bu nedenle FreeTierHunt, Telegram mesaj gövdelerini LLM’e göndermez veya depolamaz; yalnızca resmi sağlayıcı URL’sini ve işleme sonucunu kaydeder.

## Ortam değişkenleri

| Değişken | Amaç |
|---|---|
| `TELEGRAM_BOT_TOKEN` | BotFather tarafından verilen bot belirteci; webhook kurulumunda kullanılır |
| `TELEGRAM_WEBHOOK_SECRET` | Telegram’ın webhook başlığında göndereceği 1–256 karakterlik gizli belirteç |
| `TELEGRAM_ALLOWED_CHAT_IDS` | Virgülle ayrılmış, botun açıkça yetkili olduğu kanal kimlikleri |

## Webhook kurulumu

Aşağıdaki isteği yalnızca üretim ortamı URL’si ve gizli değerler hazır olduğunda çalıştırın. `allowed_updates` yalnızca `channel_post` ile sınırlıdır.

```bash
curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -H 'content-type: application/json' \
  -d '{
    "url": "https://YOUR_DOMAIN/api/webhooks/telegram",
    "secret_token": "YOUR_TELEGRAM_WEBHOOK_SECRET",
    "allowed_updates": ["channel_post"],
    "drop_pending_updates": true
  }'
```

Bot, ilgili kanala yönetici olarak eklenmeli ve kanal kimliği `TELEGRAM_ALLOWED_CHAT_IDS` değişkenine eklenmelidir. İlk kurulumda webhook durumunu `getWebhookInfo` ile kontrol edin. Uygulama yapılandırma eksikse `503`, geçersiz secret başlığında `401` döndürür.

## Kanal komutu

Kabul edilen tek veri formatı aşağıdadır:

```text
/offer credit | Product name | Concise headline | https://official-provider.example/offer | Exact proof quote
```

İzin verilen teklif türleri: `free_tier`, `trial`, `credit`, `discount`. Uygulama bir mesajı kabul ettiğinde yalnızca bekleyen bir moderasyon gönderimi oluşturur; kaynak URL’si ve alıntı, normal kanıt incelemesi olmadan yayımlanmaz.

## İşletim kuralları

| Kural | Uygulama |
|---|---|
| İdempotency | `update_id` benzersizdir; yeniden teslim edilen güncelleme ikinci kez aday oluşturmaz |
| Yetkilendirme | Secret başlığı ve açık izinli kanal kimliği birlikte zorunludur |
| Veri minimizasyonu | Mesaj metni, kullanıcı adı, profil verisi ve özel sohbet bilgisi saklanmaz |
| Yayın güvenliği | Telegram girdisi yalnızca `pending` submission üretir; admin kanıt URL’siyle inceleyerek yayınlar |
| Otomatik tarama | Yoktur; bot yalnızca açıkça yetkilendirilmiş kanaldan gelen yapılandırılmış komutları işler |

## Kaynakça

[1] [Telegram Bot API — Getting updates ve setWebhook](https://core.telegram.org/bots/api)  
[2] [Telegram API Terms of Service — Privacy & Security](https://core.telegram.org/api/terms)
