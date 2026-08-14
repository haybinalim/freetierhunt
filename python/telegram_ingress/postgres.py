"""Postgres-backed repositories for P0 channel authorization and webhook safety.

All SQL uses parameters. Repository methods intentionally accept only the fields
needed for authorization and delivery audit; they never receive raw Telegram text,
profile data, media metadata, or the original request JSON.
"""

from __future__ import annotations

from contextlib import contextmanager
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Iterator

from psycopg import Connection
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

from .models import ChannelAccessGrant, GrantStatus, IngressDecision, MinimalAuditEvent


@dataclass(frozen=True, slots=True)
class PostgresSettings:
    dsn: str
    min_pool_size: int = 1
    max_pool_size: int = 8
    connect_timeout_seconds: int = 10

    def __post_init__(self) -> None:
        if not self.dsn.startswith(("postgresql://", "postgres://")):
            raise ValueError("dsn must be a PostgreSQL connection string")
        if self.min_pool_size < 1 or self.max_pool_size < self.min_pool_size:
            raise ValueError("invalid connection pool size")


class PostgresDatabase:
    """Owns a synchronous connection pool; create once during application startup."""

    def __init__(self, settings: PostgresSettings) -> None:
        self._pool = ConnectionPool(
            conninfo=settings.dsn,
            min_size=settings.min_pool_size,
            max_size=settings.max_pool_size,
            kwargs={"connect_timeout": settings.connect_timeout_seconds, "row_factory": dict_row},
            open=True,
        )

    @contextmanager
    def transaction(self) -> Iterator[Connection]:
        with self._pool.connection() as connection:
            with connection.transaction():
                yield connection

    def close(self) -> None:
        self._pool.close()


class PostgresChannelGrantRepository:
    """Durable source_access_grants repository; only active, in-window grants resolve."""

    def __init__(self, database: PostgresDatabase) -> None:
        self._database = database

    def register(self, grant: ChannelAccessGrant) -> None:
        self._validate(grant)
        with self._database.transaction() as connection:
            connection.execute(
                """
                INSERT INTO source_access_grants (
                  grant_id, source_id, telegram_chat_id, owner_contact,
                  authorization_reference, allowed_update_types, status,
                  valid_from, valid_until, revoked_at, revoked_reason, updated_at
                ) VALUES (
                  %(grant_id)s, %(source_id)s, %(chat_id)s, %(owner_contact)s,
                  %(authorization_reference)s, %(allowed_update_types)s, %(status)s,
                  %(valid_from)s, %(valid_until)s, %(revoked_at)s, %(revoked_reason)s, now()
                )
                ON CONFLICT (telegram_chat_id) DO UPDATE SET
                  grant_id = EXCLUDED.grant_id,
                  source_id = EXCLUDED.source_id,
                  owner_contact = EXCLUDED.owner_contact,
                  authorization_reference = EXCLUDED.authorization_reference,
                  allowed_update_types = EXCLUDED.allowed_update_types,
                  status = EXCLUDED.status,
                  valid_from = EXCLUDED.valid_from,
                  valid_until = EXCLUDED.valid_until,
                  revoked_at = EXCLUDED.revoked_at,
                  revoked_reason = EXCLUDED.revoked_reason,
                  updated_at = now()
                """,
                _grant_params(grant),
            )

    def get_active_grant(
        self,
        *,
        chat_id: str,
        update_type: str,
        now: datetime | None = None,
    ) -> ChannelAccessGrant | None:
        now = _as_utc(now or datetime.now(UTC))
        with self._database.transaction() as connection:
            row = connection.execute(
                """
                SELECT grant_id, source_id, telegram_chat_id, owner_contact,
                       authorization_reference, allowed_update_types, status,
                       valid_from, valid_until, revoked_at, revoked_reason
                FROM source_access_grants
                WHERE telegram_chat_id = %(chat_id)s
                  AND status = 'active'
                  AND revoked_at IS NULL
                  AND valid_from <= %(now)s
                  AND valid_until > %(now)s
                  AND allowed_update_types @> ARRAY[%(update_type)s]::text[]
                LIMIT 1
                """,
                {"chat_id": chat_id, "now": now, "update_type": update_type},
            ).fetchone()
        return _grant_from_row(row) if row else None

    def revoke(self, *, chat_id: str, reason: str, now: datetime | None = None) -> ChannelAccessGrant:
        now = _as_utc(now or datetime.now(UTC))
        with self._database.transaction() as connection:
            row = connection.execute(
                """
                UPDATE source_access_grants
                SET status = 'revoked', revoked_at = %(now)s,
                    revoked_reason = %(reason)s, updated_at = now()
                WHERE telegram_chat_id = %(chat_id)s
                RETURNING grant_id, source_id, telegram_chat_id, owner_contact,
                          authorization_reference, allowed_update_types, status,
                          valid_from, valid_until, revoked_at, revoked_reason
                """,
                {"chat_id": chat_id, "reason": reason[:500], "now": now},
            ).fetchone()
        if row is None:
            raise KeyError(f"no grant registered for chat_id={chat_id}")
        return _grant_from_row(row)

    @staticmethod
    def _validate(grant: ChannelAccessGrant) -> None:
        if grant.source_id <= 0:
            raise ValueError("source_id must be a positive database identifier")
        if not grant.telegram_chat_id.lstrip("-").isdigit():
            raise ValueError("telegram_chat_id must be numeric")
        if not grant.authorization_reference.strip():
            raise ValueError("authorization_reference is required")
        if grant.valid_until <= grant.valid_from:
            raise ValueError("valid_until must be after valid_from")
        if grant.allowed_update_types != frozenset({"channel_post"}):
            raise ValueError("only channel_post is supported by this ingress")


class PostgresUpdateIdempotencyStore:
    """Durable update receipt backed by telegram_inbound_updates.update_id UNIQUE."""

    def __init__(self, database: PostgresDatabase) -> None:
        self._database = database

    def mark_if_new(
        self,
        update_id: int,
        now: datetime,
        *,
        chat_id: str = "0",
        message_id: int = 0,
    ) -> bool:
        if update_id < 0 or message_id < 0:
            raise ValueError("update_id and message_id must be non-negative")
        with self._database.transaction() as connection:
            row = connection.execute(
                """
                INSERT INTO telegram_inbound_updates (
                  update_id, chat_id, message_id, status, received_at
                ) VALUES (%(update_id)s, %(chat_id)s, %(message_id)s, 'received', %(now)s)
                ON CONFLICT (update_id) DO NOTHING
                RETURNING id
                """,
                {
                    "update_id": update_id,
                    "chat_id": chat_id,
                    "message_id": message_id,
                    "now": _as_utc(now),
                },
            ).fetchone()
        return row is not None


class PostgresIngressAuditRepository:
    """Append-only minimal audit events plus accepted receipt finalization."""

    def __init__(self, database: PostgresDatabase) -> None:
        self._database = database

    def record(self, event: MinimalAuditEvent) -> None:
        with self._database.transaction() as connection:
            connection.execute(
                """
                INSERT INTO telegram_ingress_audit_events (
                  update_id, telegram_chat_id, decision, reason_code,
                  source_id, grant_id, occurred_at, metadata
                ) VALUES (
                  %(update_id)s, %(chat_id)s, %(decision)s, %(reason_code)s,
                  %(source_id)s, %(grant_id)s, %(occurred_at)s, %(metadata)s::jsonb
                )
                """,
                {
                    "update_id": event.update_id,
                    "chat_id": event.chat_id,
                    "decision": event.decision.value,
                    "reason_code": event.reason_code,
                    "source_id": event.source_id,
                    "grant_id": event.grant_id,
                    "occurred_at": _as_utc(event.occurred_at),
                    "metadata": _json_metadata(event.metadata),
                },
            )
            if event.decision is IngressDecision.ACCEPTED:
                connection.execute(
                    """
                    UPDATE telegram_inbound_updates
                    SET status = 'accepted', reason = %(reason_code)s, processed_at = %(occurred_at)s
                    WHERE update_id = %(update_id)s
                    """,
                    {
                        "update_id": event.update_id,
                        "reason_code": event.reason_code,
                        "occurred_at": _as_utc(event.occurred_at),
                    },
                )


def _grant_params(grant: ChannelAccessGrant) -> dict[str, object]:
    return {
        "grant_id": grant.grant_id,
        "source_id": grant.source_id,
        "chat_id": grant.telegram_chat_id,
        "owner_contact": grant.owner_contact,
        "authorization_reference": grant.authorization_reference,
        "allowed_update_types": list(grant.allowed_update_types),
        "status": grant.status.value,
        "valid_from": _as_utc(grant.valid_from),
        "valid_until": _as_utc(grant.valid_until),
        "revoked_at": _as_utc(grant.revoked_at) if grant.revoked_at else None,
        "revoked_reason": grant.revoked_reason,
    }


def _grant_from_row(row: dict[str, object]) -> ChannelAccessGrant:
    return ChannelAccessGrant(
        grant_id=str(row["grant_id"]),
        source_id=int(row["source_id"]),
        telegram_chat_id=str(row["telegram_chat_id"]),
        owner_contact=str(row["owner_contact"]),
        authorization_reference=str(row["authorization_reference"]),
        allowed_update_types=frozenset(str(value) for value in row["allowed_update_types"]),
        status=GrantStatus(str(row["status"])),
        valid_from=_as_utc(_require_datetime(row["valid_from"])),
        valid_until=_as_utc(_require_datetime(row["valid_until"])),
        revoked_at=_as_utc(_require_datetime(row["revoked_at"])) if row["revoked_at"] else None,
        revoked_reason=str(row["revoked_reason"]) if row["revoked_reason"] else None,
    )


def _json_metadata(metadata: dict[str, str]) -> str:
    # A deliberately tiny serializer avoids accidentally accepting arbitrary objects.
    import json

    return json.dumps({str(key)[:64]: str(value)[:256] for key, value in metadata.items()})


def _require_datetime(value: object) -> datetime:
    if not isinstance(value, datetime):
        raise TypeError("database timestamp was not a datetime")
    return value


def _as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        raise ValueError("timezone-aware datetime required")
    return value.astimezone(UTC)
