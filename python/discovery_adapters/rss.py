"""RSS 2.0 and Atom discovery adapter for approved official feeds."""

from __future__ import annotations

from datetime import UTC, datetime
from email.utils import parsedate_to_datetime
from urllib.parse import urljoin

from defusedxml import ElementTree

from .base import BaseAdapter, SourceSafetyError, content_hash, validate_source_url
from .models import SourceConfig, SourceDocument

ATOM_NAMESPACE = "{http://www.w3.org/2005/Atom}"


def _text(element: ElementTree.Element | None) -> str | None:
    if element is None or element.text is None:
        return None
    value = " ".join(element.text.split())
    return value or None


def _child_text(element: ElementTree.Element, name: str) -> str | None:
    return _text(element.find(name))


def _parse_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return parsedate_to_datetime(value).astimezone(UTC)
    except (TypeError, ValueError):
        try:
            normalized = value.replace("Z", "+00:00")
            parsed = datetime.fromisoformat(normalized)
            return parsed.replace(tzinfo=UTC) if parsed.tzinfo is None else parsed.astimezone(UTC)
        except ValueError:
            return None


def _canonical_item_url(source: SourceConfig, raw_url: str | None) -> str:
    if not raw_url:
        raise SourceSafetyError("Feed item is missing a canonical URL")
    url = urljoin(source.url, raw_url.strip())
    return validate_source_url(source, url)


class RSSAdapter(BaseAdapter):
    """Normalizes RSS 2.0 and Atom feeds from an approved official domain."""

    key = "rss-atom-v1"

    async def parse_documents(self, source: SourceConfig, payload: str) -> tuple[SourceDocument, ...]:
        try:
            root = ElementTree.fromstring(payload)
        except ElementTree.ParseError as error:
            raise ValueError(f"Invalid RSS/Atom XML: {error}") from error

        if root.tag == "rss" or root.find("channel") is not None:
            return self._parse_rss(source, root)
        if root.tag == f"{ATOM_NAMESPACE}feed":
            return self._parse_atom(source, root)
        raise ValueError("Unsupported feed root; expected RSS 2.0 or Atom")

    def _parse_rss(
        self, source: SourceConfig, root: ElementTree.Element
    ) -> tuple[SourceDocument, ...]:
        channel = root.find("channel")
        if channel is None:
            raise ValueError("RSS feed is missing channel")

        documents: list[SourceDocument] = []
        for item in channel.findall("item"):
            title = _child_text(item, "title")
            link = _canonical_item_url(source, _child_text(item, "link"))
            guid = _child_text(item, "guid")
            description = _child_text(item, "description") or _child_text(item, "content")
            published_at = _parse_datetime(_child_text(item, "pubDate"))
            external_id = guid or link
            material = "\n".join((external_id, title or "", description or "", published_at.isoformat() if published_at else ""))
            documents.append(
                SourceDocument(
                    external_id=external_id,
                    canonical_url=link,
                    title=title,
                    body=description,
                    published_at=published_at,
                    content_hash=content_hash(material),
                    metadata={"format": "rss"},
                )
            )
        return tuple(documents)

    def _parse_atom(
        self, source: SourceConfig, root: ElementTree.Element
    ) -> tuple[SourceDocument, ...]:
        documents: list[SourceDocument] = []
        for entry in root.findall(f"{ATOM_NAMESPACE}entry"):
            title = _child_text(entry, f"{ATOM_NAMESPACE}title")
            link_element = next(
                (
                    link
                    for link in entry.findall(f"{ATOM_NAMESPACE}link")
                    if link.attrib.get("rel", "alternate") == "alternate" and link.attrib.get("href")
                ),
                None,
            )
            link = _canonical_item_url(source, link_element.attrib.get("href") if link_element is not None else None)
            external_id = _child_text(entry, f"{ATOM_NAMESPACE}id") or link
            body = _child_text(entry, f"{ATOM_NAMESPACE}content") or _child_text(
                entry, f"{ATOM_NAMESPACE}summary"
            )
            published_at = _parse_datetime(
                _child_text(entry, f"{ATOM_NAMESPACE}updated")
                or _child_text(entry, f"{ATOM_NAMESPACE}published")
            )
            material = "\n".join((external_id, title or "", body or "", published_at.isoformat() if published_at else ""))
            documents.append(
                SourceDocument(
                    external_id=external_id,
                    canonical_url=link,
                    title=title,
                    body=body,
                    published_at=published_at,
                    content_hash=content_hash(material),
                    metadata={"format": "atom"},
                )
            )
        return tuple(documents)
