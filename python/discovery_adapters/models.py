"""Shared models for trusted discovery adapters.

Raw network payloads are intentionally not persisted by this layer. Callers can
store normalized documents and a content hash in their own observation store.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Literal

AdapterKind = Literal["official_web", "rss_atom", "official_api", "partner_feed"]
FetchStatus = Literal["succeeded", "not_modified", "failed"]


@dataclass(frozen=True, slots=True)
class SourceConfig:
    """A pre-approved source configuration loaded from the application database."""

    source_id: int
    name: str
    adapter_kind: AdapterKind
    url: str
    allowed_domains: frozenset[str]
    request_timeout_seconds: float = 15.0
    max_response_bytes: int = 1_500_000


@dataclass(frozen=True, slots=True)
class SourceCursor:
    """HTTP validators retained from a prior successful fetch."""

    etag: str | None = None
    last_modified: str | None = None


@dataclass(frozen=True, slots=True)
class SourceDocument:
    """A normalized source item suitable for an observation table."""

    external_id: str
    canonical_url: str
    title: str | None
    body: str | None
    published_at: datetime | None
    content_hash: str
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True, slots=True)
class FetchBatch:
    """The result of one source fetch without retaining the raw response body."""

    status: FetchStatus
    request_url: str
    http_status: int | None
    duration_ms: int
    cursor: SourceCursor
    documents: tuple[SourceDocument, ...] = ()
    error_code: str | None = None
    error_message: str | None = None


@dataclass(frozen=True, slots=True)
class FetchRunRecord:
    """Minimal observability record ready for persistence in source_fetch_runs."""

    source_id: int
    adapter_key: str
    status: FetchStatus
    request_url: str
    http_status: int | None
    duration_ms: int
    cursor: SourceCursor
    document_count: int
    error_code: str | None = None
    error_message: str | None = None
