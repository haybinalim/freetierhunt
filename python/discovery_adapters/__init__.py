"""Python reference adapters for trusted FreeTierHunt discovery sources."""

from .base import BaseAdapter, SourceSafetyError, validate_source_url
from .models import FetchBatch, FetchRunRecord, SourceConfig, SourceCursor, SourceDocument
from .rss import RSSAdapter
from .web import OfficialWebAdapter

__all__ = [
    "BaseAdapter",
    "FetchBatch",
    "FetchRunRecord",
    "OfficialWebAdapter",
    "RSSAdapter",
    "SourceConfig",
    "SourceCursor",
    "SourceDocument",
    "SourceSafetyError",
    "validate_source_url",
]
