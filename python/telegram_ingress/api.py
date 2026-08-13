"""FastAPI reference endpoint for authorized Telegram channel ingress.

The endpoint deliberately stops after the P0 authorization decision. A downstream
candidate parser may receive an accepted request in-memory, but this module never
persists the raw JSON body, message text, sender data, or Telegram profile metadata.
"""

from __future__ import annotations

import json
from dataclasses import asdict
from datetime import UTC, datetime, timedelta
from typing import Any, Protocol

from fastapi import FastAPI, Header, HTTPException, Request, Response, status

from .grants import ChannelGrantRegistry
from .models import IngressDecision, MinimalAuditEvent
from .webhook_security import (
    TELEGRAM_SECRET_HEADER,
    AuthorizedChannelWebhookPolicy,
    UpdateIdempotencyStore,
    WebhookAuthenticationError,
    WebhookSecurityConfig,
    verify_secret_header,
)


class AuditSink(Protocol):
    def record(self, event: MinimalAuditEvent) -> None: ...


class InMemoryAuditSink:
    """Test-only sink. Replace with an append-only database audit repository."""

    def __init__(self) -> None:
        self.events: list[MinimalAuditEvent] = []

    def record(self, event: MinimalAuditEvent) -> None:
        self.events.append(event)


def create_app(
    *,
    security: WebhookSecurityConfig,
    grant_registry: ChannelGrantRegistry,
    audit_sink: AuditSink,
) -> FastAPI:
    app = FastAPI(title="FreeTierHunt Authorized Telegram Ingress", version="0.1.0")
    policy = AuthorizedChannelWebhookPolicy(
        grant_registry,
        UpdateIdempotencyStore(security.idempotency_ttl),
    )

    @app.post("/webhooks/telegram", status_code=status.HTTP_202_ACCEPTED)
    async def telegram_webhook(
        request: Request,
        telegram_secret: str | None = Header(default=None, alias=TELEGRAM_SECRET_HEADER),
    ) -> dict[str, Any]:
        try:
            verify_secret_header(telegram_secret, security.secret_token)
        except WebhookAuthenticationError as exc:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid webhook") from exc

        content_length = request.headers.get("content-length")
        if content_length and content_length.isdigit() and int(content_length) > security.max_body_bytes:
            raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="payload too large")

        raw_body = await request.body()
        if len(raw_body) > security.max_body_bytes:
            raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="payload too large")
        try:
            payload = json.loads(raw_body)
        except json.JSONDecodeError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="invalid JSON") from exc
        finally:
            # The raw message is transient request input and is never placed in a
            # database, queue, log, exception payload, or audit event.
            del raw_body

        metadata = _extract_channel_post_metadata(payload)
        if metadata is None:
            return {"status": IngressDecision.IGNORED, "reason": "unsupported_update"}

        event = policy.evaluate(
            update_id=metadata["update_id"],
            update_type="channel_post",
            chat_id=metadata["chat_id"],
            now=datetime.now(UTC),
        )
        audit_sink.record(event)

        # A production version may invoke a structured command parser here only
        # when event.decision == ACCEPTED. Keep that parser side-effect-free and
        # ensure it forwards no Telegram text to downstream AI systems.
        response_status = status.HTTP_200_OK if event.decision in {
            IngressDecision.DUPLICATE,
            IngressDecision.IGNORED,
        } else status.HTTP_202_ACCEPTED
        return Response(
            content=json.dumps({"status": event.decision, "reason": event.reason_code}),
            status_code=response_status,
            media_type="application/json",
        )

    @app.get("/healthz")
    async def healthz() -> dict[str, str]:
        return {"status": "ok"}

    return app


def _extract_channel_post_metadata(payload: object) -> dict[str, int | str] | None:
    """Extract only the mandatory identifiers for an authorized channel decision."""
    if not isinstance(payload, dict):
        return None
    update_id = payload.get("update_id")
    post = payload.get("channel_post")
    if isinstance(update_id, bool) or not isinstance(update_id, int) or not isinstance(post, dict):
        return None
    chat = post.get("chat")
    if not isinstance(chat, dict) or chat.get("type") != "channel":
        return None
    chat_id = chat.get("id")
    if isinstance(chat_id, bool) or not isinstance(chat_id, (int, str)):
        return None
    chat_id_str = str(chat_id)
    if not chat_id_str.lstrip("-").isdigit():
        return None
    return {"update_id": update_id, "chat_id": chat_id_str}


def create_demo_app(secret_token: str, grant_registry: ChannelGrantRegistry) -> FastAPI:
    """Convenience factory for local development; never hardcode production secrets."""
    return create_app(
        security=WebhookSecurityConfig(secret_token=secret_token, idempotency_ttl=timedelta(days=90)),
        grant_registry=grant_registry,
        audit_sink=InMemoryAuditSink(),
    )
