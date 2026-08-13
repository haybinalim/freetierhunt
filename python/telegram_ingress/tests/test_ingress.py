from __future__ import annotations

from dataclasses import asdict
from datetime import UTC, datetime, timedelta

import pytest
from fastapi.testclient import TestClient

from telegram_ingress.api import InMemoryAuditSink, create_app
from telegram_ingress.grants import ChannelGrantRegistry
from telegram_ingress.models import ChannelAccessGrant, IngressDecision
from telegram_ingress.webhook_security import (
    AuthorizedChannelWebhookPolicy,
    UpdateIdempotencyStore,
    WebhookSecurityConfig,
    verify_secret_header,
)

NOW = datetime(2026, 8, 14, tzinfo=UTC)
SECRET = "authorized_channel_secret_123"
CHAT_ID = "-1001234567890"


def grant(chat_id: str = CHAT_ID) -> ChannelAccessGrant:
    return ChannelAccessGrant(
        grant_id="grant_001",
        source_id="source_partner_001",
        telegram_chat_id=chat_id,
        owner_contact="partner@example.com",
        authorization_reference="partner-agreement://2026-08/001",
        valid_from=NOW - timedelta(days=1),
        valid_until=NOW + timedelta(days=30),
    )


def webhook_payload(*, update_id: int = 101, chat_id: str = CHAT_ID) -> dict[str, object]:
    return {
        "update_id": update_id,
        "channel_post": {
            "message_id": 7,
            "chat": {"id": chat_id, "type": "channel", "title": "Authorized partner"},
            # Deliberately present only as transient input; it must never appear in audit storage.
            "text": "/offer credit | Example | Title | https://provider.example/offer | raw command",
        },
    }


def test_secret_comparison_accepts_only_exact_secret() -> None:
    verify_secret_header(SECRET, SECRET)
    with pytest.raises(PermissionError):
        verify_secret_header("wrong", SECRET)


def test_active_grant_accepts_once_and_detects_duplicate() -> None:
    registry = ChannelGrantRegistry()
    registry.register(grant())
    policy = AuthorizedChannelWebhookPolicy(registry, UpdateIdempotencyStore(timedelta(days=90)))

    accepted = policy.evaluate(update_id=1, update_type="channel_post", chat_id=CHAT_ID, now=NOW)
    duplicate = policy.evaluate(update_id=1, update_type="channel_post", chat_id=CHAT_ID, now=NOW)

    assert accepted.decision is IngressDecision.ACCEPTED
    assert accepted.source_id == "source_partner_001"
    assert duplicate.decision is IngressDecision.DUPLICATE


def test_revoked_or_unlisted_channel_is_rejected() -> None:
    registry = ChannelGrantRegistry()
    registry.register(grant())
    registry.revoke(chat_id=CHAT_ID, reason="partner requested removal", now=NOW)
    policy = AuthorizedChannelWebhookPolicy(registry, UpdateIdempotencyStore(timedelta(days=90)))

    revoked = policy.evaluate(update_id=2, update_type="channel_post", chat_id=CHAT_ID, now=NOW)
    unlisted = policy.evaluate(update_id=3, update_type="channel_post", chat_id="-100999", now=NOW)

    assert revoked.decision is IngressDecision.REJECTED
    assert unlisted.decision is IngressDecision.REJECTED


def test_api_records_minimal_audit_event_without_raw_message_content() -> None:
    registry = ChannelGrantRegistry()
    registry.register(grant())
    sink = InMemoryAuditSink()
    app = create_app(
        security=WebhookSecurityConfig(secret_token=SECRET),
        grant_registry=registry,
        audit_sink=sink,
    )
    client = TestClient(app)

    response = client.post(
        "/webhooks/telegram",
        headers={"X-Telegram-Bot-Api-Secret-Token": SECRET},
        json=webhook_payload(),
    )

    assert response.status_code == 202
    assert response.json()["status"] == "accepted"
    assert len(sink.events) == 1
    stored = asdict(sink.events[0])
    assert stored["chat_id"] == CHAT_ID
    assert "text" not in stored
    assert "raw command" not in repr(stored)


def test_api_rejects_invalid_secret_before_processing_payload() -> None:
    registry = ChannelGrantRegistry()
    registry.register(grant())
    sink = InMemoryAuditSink()
    client = TestClient(
        create_app(
            security=WebhookSecurityConfig(secret_token=SECRET),
            grant_registry=registry,
            audit_sink=sink,
        )
    )

    response = client.post("/webhooks/telegram", headers={"X-Telegram-Bot-Api-Secret-Token": "wrong"}, json=webhook_payload())

    assert response.status_code == 401
    assert sink.events == []
