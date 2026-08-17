"""Base class for safe, observable discovery adapters."""

from __future__ import annotations

import asyncio
import hashlib
import ipaddress
import time
from abc import ABC, abstractmethod
from urllib.parse import urlparse

import httpx

from .models import FetchBatch, SourceConfig, SourceCursor, SourceDocument

USER_AGENT = "FreeTierHuntDiscovery/0.1 (+https://freetierhunt.example/bot)"


class SourceSafetyError(ValueError):
    """Raised when a configured source violates the approved source boundary."""


def _is_public_hostname(hostname: str) -> bool:
    normalized = hostname.strip("[]").lower()
    if normalized in {"localhost", "::1", "0.0.0.0"}:
        return False
    if normalized.endswith(".localhost") or normalized.endswith(".local"):
        return False

    try:
        return not ipaddress.ip_address(normalized).is_private
    except ValueError:
        # DNS names are checked against the source allowlist. Production callers
        # should additionally use a DNS-aware egress policy to mitigate rebinding.
        return True


def validate_source_url(source: SourceConfig, raw_url: str) -> str:
    parsed = urlparse(raw_url)
    hostname = (parsed.hostname or "").lower()
    if parsed.scheme != "https":
        raise SourceSafetyError("Only HTTPS source URLs are permitted")
    if parsed.username or parsed.password or not hostname:
        raise SourceSafetyError("Source URL must not contain credentials")
    if not _is_public_hostname(hostname):
        raise SourceSafetyError("Source URL must resolve to a public endpoint")
    if source.allowed_domains and not any(
        hostname == domain or hostname.endswith(f".{domain}") for domain in source.allowed_domains
    ):
        raise SourceSafetyError("Source URL hostname is outside the approved domain allowlist")
    return raw_url


def content_hash(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


class BaseAdapter(ABC):
    """Safe HTTP adapter contract for one approved discovery source.

    Adapters return normalized documents only. The caller owns durable storage of
    fetch run records, documents, candidates, and any source health calculations.
    """

    key = "base"

    def __init__(self, client: httpx.AsyncClient | None = None) -> None:
        self._client = client

    @abstractmethod
    async def parse_documents(self, source: SourceConfig, payload: str) -> tuple[SourceDocument, ...]:
        """Normalize a successful response payload into source documents."""

    async def fetch(self, source: SourceConfig, cursor: SourceCursor = SourceCursor()) -> FetchBatch:
        request_url = source.url
        started_at = time.perf_counter()
        try:
            validate_source_url(source, request_url)
        except SourceSafetyError as error:
            return self._failure(request_url, started_at, "INVALID_SOURCE_URL", str(error), cursor)

        headers = {
            "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml, text/html;q=0.9",
            "User-Agent": USER_AGENT,
        }
        if cursor.etag:
            headers["If-None-Match"] = cursor.etag
        if cursor.last_modified:
            headers["If-Modified-Since"] = cursor.last_modified

        owns_client = self._client is None
        client = self._client or httpx.AsyncClient(
            follow_redirects=False,
            timeout=httpx.Timeout(source.request_timeout_seconds),
        )
        try:
            response = await client.get(request_url, headers=headers)
            duration_ms = round((time.perf_counter() - started_at) * 1000)
            response_cursor = SourceCursor(
                etag=response.headers.get("etag"),
                last_modified=response.headers.get("last-modified"),
            )

            if response.status_code == 304:
                return FetchBatch(
                    status="not_modified",
                    request_url=request_url,
                    http_status=304,
                    duration_ms=duration_ms,
                    cursor=response_cursor,
                )
            if response.is_redirect:
                return FetchBatch(
                    status="failed",
                    request_url=request_url,
                    http_status=response.status_code,
                    duration_ms=duration_ms,
                    cursor=response_cursor,
                    error_code="REDIRECT_BLOCKED",
                    error_message="Redirect responses must be validated by a source-specific adapter",
                )
            if response.status_code == 429:
                return FetchBatch(
                    status="failed",
                    request_url=request_url,
                    http_status=429,
                    duration_ms=duration_ms,
                    cursor=response_cursor,
                    error_code="RATE_LIMITED",
                    error_message="Source returned HTTP 429; honor Retry-After before retrying",
                )
            if response.is_error:
                return FetchBatch(
                    status="failed",
                    request_url=request_url,
                    http_status=response.status_code,
                    duration_ms=duration_ms,
                    cursor=response_cursor,
                    error_code=f"HTTP_{response.status_code}",
                    error_message=f"Source returned HTTP {response.status_code}",
                )
            if len(response.content) > source.max_response_bytes:
                return FetchBatch(
                    status="failed",
                    request_url=request_url,
                    http_status=response.status_code,
                    duration_ms=duration_ms,
                    cursor=response_cursor,
                    error_code="RESPONSE_TOO_LARGE",
                    error_message=f"Response exceeds {source.max_response_bytes} byte limit",
                )

            try:
                documents = await self.parse_documents(source, response.text)
            except (SourceSafetyError, ValueError) as error:
                return FetchBatch(
                    status="failed",
                    request_url=request_url,
                    http_status=response.status_code,
                    duration_ms=duration_ms,
                    cursor=response_cursor,
                    error_code="PARSE_ERROR",
                    error_message=str(error),
                )
            return FetchBatch(
                status="succeeded",
                request_url=request_url,
                http_status=response.status_code,
                duration_ms=duration_ms,
                cursor=response_cursor,
                documents=documents,
            )
        except (httpx.HTTPError, asyncio.TimeoutError) as error:
            return self._failure(request_url, started_at, "NETWORK_ERROR", str(error), cursor)
        finally:
            if owns_client:
                await client.aclose()

    @staticmethod
    def _failure(
        request_url: str,
        started_at: float,
        error_code: str,
        error_message: str,
        cursor: SourceCursor,
    ) -> FetchBatch:
        return FetchBatch(
            status="failed",
            request_url=request_url,
            http_status=None,
            duration_ms=round((time.perf_counter() - started_at) * 1000),
            cursor=cursor,
            error_code=error_code,
            error_message=error_message,
        )
