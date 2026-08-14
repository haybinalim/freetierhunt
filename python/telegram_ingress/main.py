"""Uvicorn factory for the Postgres-backed webhook service.

Run with:
    DATABASE_URL=... TELEGRAM_WEBHOOK_SECRET=... \
      uvicorn telegram_ingress.main:create_app_from_environment --factory
"""

from __future__ import annotations

import os

from .api import create_postgres_app
from .postgres import PostgresSettings
from .webhook_security import WebhookSecurityConfig


def create_app_from_environment():
    """Build the service from server-only environment configuration."""
    dsn = os.environ.get("DATABASE_URL", "")
    secret_token = os.environ.get("TELEGRAM_WEBHOOK_SECRET", "")
    if not dsn:
        raise RuntimeError("DATABASE_URL is required")
    if not secret_token:
        raise RuntimeError("TELEGRAM_WEBHOOK_SECRET is required")

    return create_postgres_app(
        security=WebhookSecurityConfig(secret_token=secret_token),
        database_settings=PostgresSettings(
            dsn=dsn,
            min_pool_size=int(os.environ.get("POSTGRES_POOL_MIN_SIZE", "1")),
            max_pool_size=int(os.environ.get("POSTGRES_POOL_MAX_SIZE", "8")),
            connect_timeout_seconds=int(os.environ.get("POSTGRES_CONNECT_TIMEOUT_SECONDS", "10")),
        ),
    )
