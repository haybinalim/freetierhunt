from __future__ import annotations

import asyncio

import httpx

from discovery_adapters import OfficialWebAdapter, RSSAdapter, SourceConfig, SourceCursor

RSS_PAYLOAD = """<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Example announcements</title>
    <item>
      <guid>offer-001</guid>
      <title>New startup credits</title>
      <link>https://provider.example/offers/startup-credits</link>
      <description>Up to $1,000 in verified credits.</description>
      <pubDate>Mon, 17 Aug 2026 12:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>"""

ATOM_PAYLOAD = """<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Example announcements</title>
  <entry>
    <id>urn:example:offer-002</id>
    <title>Free tier update</title>
    <link rel="alternate" href="https://provider.example/offers/free-tier" />
    <updated>2026-08-17T12:00:00Z</updated>
    <summary>New monthly quota.</summary>
  </entry>
</feed>"""


def source(url: str = "https://provider.example/feed.xml", kind: str = "rss_atom") -> SourceConfig:
    return SourceConfig(
        source_id=1,
        name="Provider official feed",
        adapter_kind=kind,  # type: ignore[arg-type]
        url=url,
        allowed_domains=frozenset({"provider.example"}),
    )


def test_rss_adapter_normalizes_item_and_sends_conditional_headers() -> None:
    received_headers: dict[str, str] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        received_headers.update(request.headers)
        return httpx.Response(
            200,
            text=RSS_PAYLOAD,
            headers={"etag": '"rss-v1"', "last-modified": "Mon, 17 Aug 2026 12:00:00 GMT"},
        )

    async def run() -> None:
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            result = await RSSAdapter(client).fetch(source(), SourceCursor(etag='"old"'))
        assert result.status == "succeeded"
        assert result.cursor.etag == '"rss-v1"'
        assert len(result.documents) == 1
        assert result.documents[0].external_id == "offer-001"
        assert result.documents[0].canonical_url == "https://provider.example/offers/startup-credits"
        assert result.documents[0].published_at is not None

    asyncio.run(run())
    assert received_headers["if-none-match"] == '"old"'


def test_rss_adapter_supports_atom_and_not_modified_responses() -> None:
    def atom_handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, text=ATOM_PAYLOAD)

    async def run_atom() -> None:
        async with httpx.AsyncClient(transport=httpx.MockTransport(atom_handler)) as client:
            result = await RSSAdapter(client).fetch(source())
        assert result.status == "succeeded"
        assert result.documents[0].external_id == "urn:example:offer-002"
        assert result.documents[0].canonical_url == "https://provider.example/offers/free-tier"

    asyncio.run(run_atom())

    def not_modified_handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(304, headers={"etag": '"rss-v2"'})

    async def run_not_modified() -> None:
        async with httpx.AsyncClient(transport=httpx.MockTransport(not_modified_handler)) as client:
            result = await RSSAdapter(client).fetch(source())
        assert result.status == "not_modified"
        assert result.documents == ()

    asyncio.run(run_not_modified())


def test_adapter_rejects_non_https_or_outside_domain_urls() -> None:
    async def run() -> None:
        non_https = await RSSAdapter().fetch(source("http://provider.example/feed.xml"))
        wrong_domain = await RSSAdapter().fetch(source("https://untrusted.example/feed.xml"))
        assert non_https.status == "failed"
        assert non_https.error_code == "INVALID_SOURCE_URL"
        assert wrong_domain.status == "failed"
        assert wrong_domain.error_code == "INVALID_SOURCE_URL"

    asyncio.run(run())


def test_official_web_adapter_strips_scripts_and_normalizes_text() -> None:
    html = """<html><head><title>Example Credits</title><script>do_not_keep()</script></head>
    <body><h1>Startup credits</h1><p>Up to $1,000 in credits.</p></body></html>"""

    async def run() -> None:
        result = await OfficialWebAdapter().parse_documents(
            source("https://provider.example/startups", "official_web"), html
        )
        assert result[0].title == "Example Credits"
        assert result[0].body is not None
        assert "Startup credits" in result[0].body
        assert "do_not_keep" not in result[0].body

    asyncio.run(run())
