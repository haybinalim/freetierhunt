# FreeTierHunt — Yetkili Telegram Kanal Girişi (Python İskeleti)

Bu dizin, **P0 kanal yetki kaydı** ve **webhook güvenliği** için FastAPI tabanlı bir referans iskeletidir. Mevcut Next.js uygulamasının yerine geçmez; aynı politika sınırlarını Python servisinde göstermek için tasarlanmıştır.

## Güvenlik sınırı

Bu iskelet, yalnızca açıkça yetki verilmiş tekil Telegram kanallarından `channel_post` güncellemelerini kabul eder. Ham mesaj metni, kullanıcı adı, profil verisi veya medya veri tabanına ve audit olayına yazılmaz. Telegram verisi AI sistemlerine aktarılmaz; kabul edilen istekteki resmî URL, bağımsız resmî sayfa doğrulama hattına yönlendirilmelidir.

| Kontrol | İskeletteki uygulama |
|---|---|
| Kanal yetkisi | Süreli `ChannelAccessGrant`, yetki belgesi referansı, kanal ID’si ve `channel_post` kapsamı |
| Geri alma | `ChannelGrantRegistry.revoke()` ile anında `REVOKED` durumu |
| Webhook doğrulama | `X-Telegram-Bot-Api-Secret-Token` için sabit-zamanlı karşılaştırma |
| Güncelleme türü | Sadece `channel_post` |
| Idempotency | `update_id` tabanlı tekrar teslim engeli |
| Veri minimizasyonu | `MinimalAuditEvent` ham JSON, mesaj metni veya kullanıcı profil alanı içermez |
| Gövde sınırı | Varsayılan 64 KiB üst sınır |

## Kurulum

```bash
cd python
python3 -m pip install -e '.[test]'
python3 -m pytest -q
```

## Modül haritası

| Dosya | Sorumluluk |
|---|---|
| `telegram_ingress/models.py` | Yetki kaydı, durumlar ve minimal denetim olayı |
| `telegram_ingress/grants.py` | Yetki doğrulama, süre kontrolü ve geri alma |
| `telegram_ingress/webhook_security.py` | Secret doğrulama, idempotency ve kabul politikası |
| `telegram_ingress/api.py` | FastAPI webhook örneği |
| `telegram_ingress/tests/test_ingress.py` | Secret, allowlist, revoke, idempotency ve data-minimization testleri |

## Üretime geçişte zorunlu değişiklikler

Bellek içi grant ve update-id depoları üretim için yeterli değildir. Aşağıdaki değişiklikler yapılmalıdır:

1. `ChannelGrantRegistry`, PostgreSQL üzerindeki `source_access_grants` tablosuna bağlanmalıdır. Tabloya `telegram_chat_id` için benzersiz kısıt, geçerlilik penceresi, yetki belgesi referansı, durum ve geri alma alanları eklenmelidir.
2. `UpdateIdempotencyStore`, işlem atomikliği için `telegram_inbound_updates.update_id` benzersiz kısıtını kullanan bir repository ile değiştirilmelidir. Birden fazla worker veya yeniden başlatma sırasında bellek içi store yeterli değildir.
3. `InMemoryAuditSink`, ekleme odaklı bir audit tablosuna bağlanmalıdır. Bu tablo yalnızca update kimliği, kanal kimliği, karar, neden kodu, zaman ve grant/source referansı saklamalıdır.
4. Secret, ortam değişkeni veya secret manager’dan yüklenmeli; düzenli rotasyon, son rotasyon zamanı ve acil webhook kapatma prosedürü işletilmelidir.
5. HTTP katmanına IP/rate-limit politikası, merkezi log redaksiyonu, `Content-Length` ve gövde sınırı telemetrisi eklenmelidir. Log kaydında `request.body`, `payload`, `text`, kullanıcı adı veya profil nesnesi kullanılmamalıdır.
6. Telegram webhook’u `allowed_updates=["channel_post"]` ve ayrı bir `secret_token` ile yapılandırılmalıdır. Kanal/bot yetkisi geri alındığında allowlist kaydı ve webhook kabulü aynı anda durdurulmalıdır.

## Telegram webhook yapılandırma örneği

Aşağıdaki komut yalnızca sahip olduğunuz veya açıkça yetki aldığınız bir kanal için kullanılmalıdır:

```bash
curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -H 'content-type: application/json' \
  -d '{
    "url": "https://YOUR_DOMAIN/webhooks/telegram",
    "secret_token": "YOUR_TELEGRAM_WEBHOOK_SECRET",
    "allowed_updates": ["channel_post"],
    "drop_pending_updates": true
  }'
```

Telegram Bot API, webhook’ta `secret_token` ile `X-Telegram-Bot-Api-Secret-Token` başlığını iletebilir; `getUpdates` ve webhook aynı anda kullanılamaz.[1]

## Kaynakça

[1] [Telegram Bot API — Getting updates and setWebhook](https://core.telegram.org/bots/api)
