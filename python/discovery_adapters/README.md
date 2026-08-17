# Python Discovery Adapters

Bu paket, FreeTierHunt’ın onaylı resmî RSS/Atom ve web kaynaklarından normalleştirilmiş gözlem üretmesi için **referans Python iskeletidir**. Üretim teklifleri doğrudan yayımlamaz; adapter sonucu önce gözlem, aday, resmî kanıt doğrulaması ve insan moderasyonu zincirine girer.

## Bileşenler

| Modül | Sorumluluk |
|---|---|
| `models.py` | Kaynak ayarı, HTTP cursor’ı, normalleştirilmiş belge ve fetch çalışması sözleşmeleri |
| `base.py` | HTTPS/allowlist denetimi, private endpoint engeli, ETag/Last-Modified, yanıt boyutu sınırı ve hata sınıflama |
| `rss.py` | RSS 2.0 ve Atom item’larını `SourceDocument` kayıtlarına normalleştirir |
| `web.py` | Onaylı tek resmî sayfayı başlık + temiz metin gözlemine dönüştürür; link taraması yapmaz |

## Kurulum

```bash
cd python
python3 -m pip install -e '.[test]'
python3 -m pytest -q
```

## RSS adapter örneği

```python
import asyncio
from discovery_adapters import RSSAdapter, SourceConfig, SourceCursor

source = SourceConfig(
    source_id=101,
    name='Provider announcements',
    adapter_kind='rss_atom',
    url='https://provider.example/announcements.xml',
    allowed_domains=frozenset({'provider.example'}),
)

async def main() -> None:
    result = await RSSAdapter().fetch(source, SourceCursor())
    if result.status == 'succeeded':
        for document in result.documents:
            print(document.external_id, document.canonical_url)

asyncio.run(main())
```

## Kalıcı depolama akışı

Çağıran worker, her `FetchBatch` sonucu için `source_fetch_runs` benzeri bir çalışma kaydı yazmalıdır. Başarılı her `SourceDocument`, `source_observations` benzeri bir tabloya `external_id`, canonical URL ve content hash ile kaydedilir. Aynı `external_id`/hash tekrar geldiğinde aday üretimi atlanır. Değişmiş veya yeni belge, kaynak profili tarafından `discovery_candidates` kuyruğuna dönüştürülür.

## Güvenlik sınırları

Adapter yalnız HTTPS URL kabul eder, private/local endpointleri reddeder ve her kaynağın `allowed_domains` alanına uyar. HTTP redirect’leri taban sınıf varsayılanında engellenir; redirect gerekiyorsa hedef URL yeniden allowlist/SSRF denetiminden geçirilerek kaynak özelinde eklenmelidir. XML `defusedxml` ile ayrıştırılır. Ham payload bu iskelet tarafından kalıcı tutulmaz.

> Bir RSS açıklaması veya web gözlemi yalnız bir aday sinyalidir. Kullanıcıya gösterilecek teklif iddiası için sağlayıcının resmî claim URL’si tekrar çekilmeli, kanıt alıntısı doğrulanmalı ve insan moderasyonu uygulanmalıdır.
