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

## Postgres repository katmanı

İskelet artık aşağıdaki kalıcı implementasyonları içerir:

| Bileşen | PostgreSQL karşılığı | Güvenlik niteliği |
|---|---|---|
| `PostgresChannelGrantRepository` | `source_access_grants` | Aktiflik, süre penceresi, yalnız `channel_post`, geri alma |
| `PostgresUpdateIdempotencyStore` | `telegram_inbound_updates.update_id UNIQUE` | Çoklu worker ve yeniden başlatma üzerinde atomik tekrar teslim engeli |
| `PostgresIngressAuditRepository` | `telegram_ingress_audit_events` | Ham içerik olmadan append-only karar denetimi |
| `PostgresDatabase` | `psycopg_pool.ConnectionPool` | Sınırlandırılmış bağlantı havuzu ve transaction kapsamı |

Önce Supabase üzerinde sırasıyla `20260813_0003_telegram_inbound.sql` ve `20260814_0005_source_access_grants.sql` migration’larını uygulayın. İkinci migration, `sources.id` ile bağlı `source_access_grants` ve minimal `telegram_ingress_audit_events` tablolarını ekler.

Uygulamayı yalnızca sunucu tarafı değişkenleriyle başlatın:

```bash
cd python
DATABASE_URL='postgresql://…' \
TELEGRAM_WEBHOOK_SECRET='…' \
uvicorn telegram_ingress.main:create_app_from_environment --factory --host 0.0.0.0 --port 8080
```

`DATABASE_URL` uygulama için havuzlu PostgreSQL bağlantısını, `TELEGRAM_WEBHOOK_SECRET` ise Telegram webhook header değerini taşır. Değerleri kaynak koda, test fixture’ına veya günlük kaydına yazmayın.

## Üretime geçişte kalan zorunlu kontroller

1. `source_access_grants` için kanal sahibi yetki belgesi referansı, süreli erişim ve geri alma işlemi yönetim panelinden işletilmelidir.
2. Secret, ortam değişkeni veya secret manager’dan yüklenmeli; düzenli rotasyon, son rotasyon zamanı ve acil webhook kapatma prosedürü işletilmelidir.
3. HTTP katmanına IP/rate-limit politikası, merkezi log redaksiyonu, `Content-Length` ve gövde sınırı telemetrisi eklenmelidir. Log kaydında `request.body`, `payload`, `text`, kullanıcı adı veya profil nesnesi kullanılmamalıdır.
4. Telegram webhook’u `allowed_updates=["channel_post"]` ve ayrı bir `secret_token` ile yapılandırılmalıdır. Kanal/bot yetkisi geri alındığında grant kaydı ve webhook kabulü aynı anda durdurulmalıdır.

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
