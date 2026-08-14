from __future__ import annotations

from contextlib import contextmanager
from datetime import UTC, datetime, timedelta
from typing import Iterator

from telegram_ingress.models import ChannelAccessGrant, GrantStatus, IngressDecision, MinimalAuditEvent
from telegram_ingress.postgres import (
    PostgresChannelGrantRepository,
    PostgresIngressAuditRepository,
    PostgresUpdateIdempotencyStore,
)

NOW = datetime(2026, 8, 14, tzinfo=UTC)


class FakeCursor:
    def __init__(self, row: dict[str, object] | None) -> None:
        self._row = row

    def fetchone(self) -> dict[str, object] | None:
        return self._row


class FakeConnection:
    def __init__(self, rows: list[dict[str, object] | None]) -> None:
        self.rows = rows
        self.calls: list[tuple[str, dict[str, object]]] = []

    def execute(self, query: str, params: dict[str, object]) -> FakeCursor:
        self.calls.append((query, params))
        row = self.rows.pop(0) if self.rows else None
        return FakeCursor(row)


class FakeDatabase:
    def __init__(self, connection: FakeConnection) -> None:
        self.connection = connection

    @contextmanager
    def transaction(self) -> Iterator[FakeConnection]:
        yield self.connection


def active_grant() -> ChannelAccessGrant:
    return ChannelAccessGrant(
        grant_id="grant_001",
        source_id=42,
        telegram_chat_id="-1001234567890",
        owner_contact="partner@example.com",
        authorization_reference="agreement://partner/42",
        valid_from=NOW - timedelta(days=1),
        valid_until=NOW + timedelta(days=30),
    )


def test_grant_repository_uses_parameterized_active_lookup() -> None:
    row = {
        "grant_id": "grant_001",
        "source_id": 42,
        "telegram_chat_id": "-1001234567890",
        "owner_contact": "partner@example.com",
        "authorization_reference": "agreement://partner/42",
        "allowed_update_types": ["channel_post"],
        "status": "active",
        "valid_from": NOW - timedelta(days=1),
        "valid_until": NOW + timedelta(days=30),
        "revoked_at": None,
        "revoked_reason": None,
    }
    connection = FakeConnection([row])
    repository = PostgresChannelGrantRepository(FakeDatabase(connection))  # type: ignore[arg-type]

    result = repository.get_active_grant(chat_id="-1001234567890", update_type="channel_post", now=NOW)

    assert result == active_grant()
    query, params = connection.calls[0]
    assert "status = 'active'" in query
    assert "allowed_update_types" in query
    assert params["chat_id"] == "-1001234567890"
    assert "-1001234567890" not in query


def test_durable_idempotency_uses_unique_insert_result() -> None:
    connection = FakeConnection([{"id": 10}, None])
    store = PostgresUpdateIdempotencyStore(FakeDatabase(connection))  # type: ignore[arg-type]

    assert store.mark_if_new(10, NOW, chat_id="-1001", message_id=7) is True
    assert store.mark_if_new(10, NOW, chat_id="-1001", message_id=7) is False
    query, params = connection.calls[0]
    assert "ON CONFLICT (update_id) DO NOTHING" in query
    assert params == {"update_id": 10, "chat_id": "-1001", "message_id": 7, "now": NOW}


def test_audit_repository_persists_only_minimal_event_fields() -> None:
    connection = FakeConnection([])
    repository = PostgresIngressAuditRepository(FakeDatabase(connection))  # type: ignore[arg-type]
    event = MinimalAuditEvent(
        update_id=99,
        chat_id="-1001",
        decision=IngressDecision.ACCEPTED,
        reason_code="authorized_channel_post",
        occurred_at=NOW,
        source_id=42,
        grant_id="grant_001",
        metadata={"route": "telegram_webhook_v1"},
    )

    repository.record(event)

    insert_query, insert_params = connection.calls[0]
    update_query, update_params = connection.calls[1]
    assert "telegram_ingress_audit_events" in insert_query
    assert "raw" not in insert_query.lower()
    assert "text" not in insert_params
    assert insert_params["metadata"] == '{"route": "telegram_webhook_v1"}'
    assert "UPDATE telegram_inbound_updates" in update_query
    assert update_params["update_id"] == 99
