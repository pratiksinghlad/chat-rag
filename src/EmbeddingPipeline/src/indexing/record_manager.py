"""
Record Manager Module.

Initializes LangChain's SQLRecordManager backed by a local SQLite database.
This is the backbone of incremental indexing — it tracks document hashes so
that only new, changed, or deleted documents trigger re-embedding.
"""

from __future__ import annotations

import logging

from langchain_classic.indexes import SQLRecordManager

logger = logging.getLogger(__name__)


def create_record_manager(
    *,
    db_url: str,
    namespace: str,
) -> SQLRecordManager:
    """
    Create and initialize a SQLRecordManager.

    On first run this creates the backing SQLite database and schema.
    On subsequent runs it reuses the existing database.

    Args:
        db_url: SQLAlchemy-style DB URL (e.g. ``sqlite:///data/record_manager.db``).
        namespace: Logical namespace for the records (e.g. ``supabase/documents``).

    Returns:
        An initialized SQLRecordManager ready for use with ``langchain.indexes.index()``.
    """
    logger.info(
        "Initializing SQLRecordManager — namespace=%s, db=%s", namespace, db_url
    )

    record_manager = SQLRecordManager(
        namespace=namespace,
        db_url=db_url,
    )

    # Create the schema (tables) if they don't exist yet.
    record_manager.create_schema()

    logger.info("SQLRecordManager ready.")
    return record_manager
