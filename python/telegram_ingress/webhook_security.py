"""Webhook authentication, authorization and idempotency controls.

No class in this module accepts or stores a raw message body. The API layer extracts
only update id, update type and channel id before invoking the policy.
"""

from __future__ import annotations

import hmac
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from threading import RLock
from typing import Protocol

from .models import ChannelAccessGrant, IngressDecision, MinimalAuditEvent

TELEGRAM_SECRET_HEADER = "x-telegram-bot-api-secret-token"


class WebhookAuthenticationError(PermissionError):
    """Raised when Telegram's configured secret header is absent or invalid."""


@dataclass(frozen=True, slots=True)
class WebhookSecurityConfig:
    secret_token: str
    max_body_bytes: int = 64 * 1024
    idempotency_ttl: timedelta = timedelta(days=90)

    def __post_init__(self) -> None:
        if not self.secret_token or len(self.secret_token) > 256:
            raise ValueError("secret_token must be between 1 and 256 characters")
        if self.max_body_bytes <= 0:
            raise ValueError("max_body_bytes must be positive")
        if self.idempotency_ttl <= timedelta(0):
            raise ValueError("idempotency_ttl must be positive")


def verify_secret_header(received: str | None, expected: str) -> None:
    """Constant-time secret comparison with a generic failure mode."""
    if not received or not hmac.compare_digest(received.encode(), expected.encode()):
        raise WebhookAuthenticationError("invalid webhook secret")


class ActiveChannelGrantRepository(Protocol):
    def get_active_grant(
        self,
        *,
        chat_id: str,
        update_type: str,
        now: datetime | None = None,
    ) -> ChannelAccessGrant | None: ...


class UpdateIdempotencyRepository(Protocol):
    def mark_if_new(
        self,
        update_id: int,
        now: datetime,
        *,
        chat_id: str = "0",
        message_id: int = 0,
    ) -> bool: ...


class UpdateIdempotencyStore:
    """Small in-memory reference implementation.

    Replace with a database table having a UNIQUE(update_id) constraint in production
    so that idempotency is preserved across workers and restarts.
    """

    def __init__(self, ttl: timedelta) -> None:
        self._ttl = ttl
        self._seen: dict[int, datetime] = {}
        self._lock = RLock()

    def mark_if_new(
        self,
        update_id: int,
        now: datetime,
        *,
        chat_id: str = "0",
        message_id: int = 0,
    ) -> bool:
        # chat_id/message_id are accepted to match the durable repository contract;
        # this reference store deliberately persists neither.
        del chat_id, message_id
        if update_id < 0:
            raise ValueError("update_id must be non-negative")
        now = _as_utc(now)
        with self._lock:
            self._purge_expired(now)
            if update_id in self._seen:
                return False
            self._seen[update_id] = now
            return True

    def _purge_expired(self, now: datetime) -> None:
        cutoff = now - self._ttl
        for update_id, seen_at in list(self._seen.items()):
            if seen_at < cutoff:
                del self._seen[update_id]


class AuthorizedChannelWebhookPolicy:
    """Applies the P0 acceptance policy before any candidate parsing occurs."""

    def __init__(
        self,
        grants: ActiveChannelGrantRepository,
        idempotency: UpdateIdempotencyRepository,
    ) -> None:
        self._grants = grants
        self._idempotency = idempotency

    def evaluate(
        self,
        *,
        update_id: int,
        update_type: str,
        chat_id: str,
        message_id: int = 0,
        now: datetime | None = None,
    ) -> MinimalAuditEvent:
        now = now or datetime.now(UTC)
        if update_type != "channel_post":
            return MinimalAuditEvent(
                update_id=update_id,
                chat_id=chat_id,
                decision=IngressDecision.IGNORED,
                reason_code="unexpected_update_type",
                occurred_at=now,
            )

        grant = self._grants.get_active_grant(chat_id=chat_id, update_type=update_type, now=now)
        if grant is None:
            return MinimalAuditEvent(
                update_id=update_id,
                chat_id=chat_id,
                decision=IngressDecision.REJECTED,
                reason_code="channel_not_authorized",
                occurred_at=now,
            )

        if not self._idempotency.mark_if_new(
            update_id,
            now,
            chat_id=chat_id,
            message_id=message_id,
        ):
            return MinimalAuditEvent(
                update_id=update_id,
                chat_id=chat_id,
                decision=IngressDecision.DUPLICATE,
                reason_code="duplicate_update_id",
                occurred_at=now,
                source_id=grant.source_id,
                grant_id=grant.grant_id,
            )

        return MinimalAuditEvent(
            update_id=update_id,
            chat_id=chat_id,
            decision=IngressDecision.ACCEPTED,
            reason_code="authorized_channel_post",
            occurred_at=now,
            source_id=grant.source_id,
            grant_id=grant.grant_id,
        )


def _as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        raise ValueError("timezone-aware datetime required")
    return value.astimezone(UTC)
