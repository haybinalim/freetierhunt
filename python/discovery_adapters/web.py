"""Minimal official web-page adapter for approved single-page sources."""

from __future__ import annotations

from html.parser import HTMLParser

from .base import BaseAdapter, content_hash
from .models import SourceConfig, SourceDocument


class _TextExtractor(HTMLParser):
    """Conservative text extractor; ignores executable and styling content."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self._title: list[str] = []
        self._text: list[str] = []
        self._suppressed_depth = 0
        self._in_title = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag in {"script", "style", "noscript", "template"}:
            self._suppressed_depth += 1
        elif tag == "title" and self._suppressed_depth == 0:
            self._in_title = True

    def handle_endtag(self, tag: str) -> None:
        if tag in {"script", "style", "noscript", "template"} and self._suppressed_depth:
            self._suppressed_depth -= 1
        elif tag == "title":
            self._in_title = False

    def handle_data(self, data: str) -> None:
        if self._suppressed_depth:
            return
        normalized = " ".join(data.split())
        if not normalized:
            return
        self._text.append(normalized)
        if self._in_title:
            self._title.append(normalized)

    @property
    def title(self) -> str | None:
        value = " ".join(self._title).strip()
        return value or None

    @property
    def text(self) -> str | None:
        value = " ".join(self._text).strip()
        return value or None


class OfficialWebAdapter(BaseAdapter):
    """Turns an approved provider page into one normalized source observation.

    It deliberately does not follow links or crawl a site. Source-specific
    discovery profiles can inspect the returned text to create candidates.
    """

    key = "official-web-v1"

    async def parse_documents(self, source: SourceConfig, payload: str) -> tuple[SourceDocument, ...]:
        parser = _TextExtractor()
        parser.feed(payload)
        parser.close()
        text = parser.text
        if not text:
            raise ValueError("Official source page does not contain extractable text")

        material = "\n".join((source.url, parser.title or "", text))
        return (
            SourceDocument(
                external_id=source.url,
                canonical_url=source.url,
                title=parser.title,
                body=text,
                published_at=None,
                content_hash=content_hash(material),
                metadata={"format": "html"},
            ),
        )
