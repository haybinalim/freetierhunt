"""Domain models for an explicitly authorized Telegram channel ingress.

This module intentionally has no field for raw Telegram message content. A channel
is allowed to submit a structured candidate, but the raw post body is transient
request input and must not be persisted by this component.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import StrEnum
from typing import FrozenSet


class GrantStatus(StrEnum):
    ACTIVE = "active"
    PAUSED = "paused"
    REVOKED = "revoked"
    EXPIRED = "expired"


@dataclass(frozen=True, slots=True)
class ChannelAccessGrant:
    """Evidence-backed permission for exactly one Telegram channel.

    Production storage should keep ``authorization_reference`` as a durable pointer
    to a signed partner agreement, verified consent record, or equivalent evidence.
    """

    grant_id: str
    source_id: int
    telegram_chat_id: str
    owner_contact: str
    authorization_reference: str
    valid_from: datetime
    valid_until: datetime
    allowed_update_types: FrozenSet[str] = frozenset({"channel_post"})
    status: GrantStatus = GrantStatus.ACTIVE
    revoked_at: datetime | None = None
    revoked_reason: str | None = None

    def is_active_for(self, update_type: str, now: datetime) -> bool:
        """Return true only while the permission is live and scoped to the update."""
        now = _as_utc(now)
        if self.status is not GrantStatus.ACTIVE or self.revoked_at is not None:
            return False
        return self.valid_from <= now < self.valid_until and update_type in self.allowed_update_types


class IngressDecision(StrEnum):
    ACCEPTED = "accepted"
    IGNORED = "ignored"
    REJECTED = "rejected"
    DUPLICATE = "duplicate"


@dataclass(frozen=True, slots=True)
class MinimalAuditEvent:
    """Persistable audit event with no raw Telegram payload or user/profile data."""

    update_id: int
    chat_id: str
    decision: IngressDecision
    reason_code: str
    occurred_at: datetime
    source_id: int | None = None
    grant_id: str | None = None
    metadata: dict[str, str] = field(default_factory=dict)


def _as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        raise ValueError("timezone-aware datetime required")
    return value.astimezone(UTC)
