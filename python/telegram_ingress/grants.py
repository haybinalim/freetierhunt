"""Channel authorization registry.

The in-memory implementation is intentionally small so it can be replaced by a
repository backed by Postgres without changing webhook policy logic.
"""

from __future__ import annotations

from datetime import UTC, datetime
from threading import RLock

from .models import ChannelAccessGrant, GrantStatus


class ChannelGrantRegistry:
    def __init__(self) -> None:
        self._grants_by_chat_id: dict[str, ChannelAccessGrant] = {}
        self._lock = RLock()

    def register(self, grant: ChannelAccessGrant) -> None:
        self._validate_grant(grant)
        with self._lock:
            self._grants_by_chat_id[grant.telegram_chat_id] = grant

    def get_active_grant(
        self,
        *,
        chat_id: str,
        update_type: str,
        now: datetime | None = None,
    ) -> ChannelAccessGrant | None:
        now = now or datetime.now(UTC)
        with self._lock:
            grant = self._grants_by_chat_id.get(chat_id)
        return grant if grant and grant.is_active_for(update_type, now) else None

    def revoke(self, *, chat_id: str, reason: str, now: datetime | None = None) -> ChannelAccessGrant:
        """Immediately stops future ingress from the channel."""
        now = now or datetime.now(UTC)
        with self._lock:
            current = self._grants_by_chat_id.get(chat_id)
            if current is None:
                raise KeyError(f"no grant registered for chat_id={chat_id}")
            revoked = ChannelAccessGrant(
                grant_id=current.grant_id,
                source_id=current.source_id,
                telegram_chat_id=current.telegram_chat_id,
                owner_contact=current.owner_contact,
                authorization_reference=current.authorization_reference,
                valid_from=current.valid_from,
                valid_until=current.valid_until,
                allowed_update_types=current.allowed_update_types,
                status=GrantStatus.REVOKED,
                revoked_at=now,
                revoked_reason=reason[:500],
            )
            self._grants_by_chat_id[chat_id] = revoked
            return revoked

    @staticmethod
    def _validate_grant(grant: ChannelAccessGrant) -> None:
        if not grant.telegram_chat_id or not grant.telegram_chat_id.lstrip("-").isdigit():
            raise ValueError("telegram_chat_id must be numeric")
        if not grant.authorization_reference.strip():
            raise ValueError("authorization_reference is required")
        if grant.valid_from.tzinfo is None or grant.valid_until.tzinfo is None:
            raise ValueError("grant validity timestamps must be timezone-aware")
        if grant.valid_until <= grant.valid_from:
            raise ValueError("valid_until must be after valid_from")
        if grant.allowed_update_types != frozenset({"channel_post"}):
            raise ValueError("only channel_post is supported by this ingress")
