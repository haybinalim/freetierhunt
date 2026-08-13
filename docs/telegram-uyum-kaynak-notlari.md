# Telegram Uyum Kaynak Notları

**Erişim tarihi:** 14 Ağustos 2026

| Konu | Resmî bulgu | Mimari etkisi |
|---|---|---|
| Bot güncellemeleri | Bot API, webhook ile HTTPS POST güncellemeleri gönderir; `allowed_updates` ile güncelleme türü daraltılabilir. `secret_token` yapılandırılırsa istek başlığında iletilir. | Yalnızca `channel_post`, açık izin listesi, secret-header doğrulaması ve idempotent `update_id` işleme kullanılır. |
| Webhook / polling | `getUpdates` ve webhook birbirini dışlar. | Üretimde yalnızca webhook seçilir; polling geri dönüş/failover değildir. |
| API gizliliği | Telegram API koşulları gizliliğin korunmasını ister. | Ham mesaj, kullanıcı adı ve profil verisi tutulmaz; sadece operasyon için gerekli minimal alanlar saklanır. |
| AI / ML kısıtı | Telegram’dan elde edilen verinin AI/ML modellerini eğitmek, ince ayar yapmak, doğrulamak, geliştirmek, benchmark etmek veya dağıtmak için kazınması, indekslenmesi, toplanması ya da kullanılması yasaktır. Sınırlı istisna; ilgili kullanıcıların belirli içerik ve chat için açık, bilgilendirilmiş, olumlu ve sürekli izni olabilir. | Varsayılan tasarımda Telegram içeriği model girdisine girmez. Telegram yalnızca izinli kaynaktan resmî URL yönlendirmesi sağlar; AI yalnızca Telegram dışındaki resmî sağlayıcı web sayfasını değerlendirir. |
| Üçüncü taraf erişimi | İçeriğe, sıradan/meşru/amaçlanan kullanımın dışındaki erişim yasaktır; botlar için erişim yalnızca hizmeti işletmek için gereken ölçüde sınırlıdır. | Genel kanal tarama, geçmiş mesaj toplama, üçüncü taraf kanal arşivleme ve toplu indeksleme yapılmaz. |

## Kaynaklar

[1] [Telegram Bot API](https://core.telegram.org/bots/api)
[2] [Telegram API Terms of Service](https://core.telegram.org/api/terms)
[3] [Telegram Terms of Service for Content Licensing](https://telegram.org/tos/content-licensing)
