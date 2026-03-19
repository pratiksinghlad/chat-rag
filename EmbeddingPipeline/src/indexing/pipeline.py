"""Document ingestion pipeline."""

from __future__ import annotations

import hashlib
import json
import logging
import uuid
from pathlib import Path
from typing import Any

from langchain_classic.indexes import SQLRecordManager
from langchain_core.documents import Document
from langchain_core.indexing.api import index as langchain_index
from langchain_core.vectorstores import VectorStore

from src.loaders.registry import SUPPORTED_EXTENSIONS, get_loader
from src.transformers.splitter import DocumentSplitter

logger = logging.getLogger(__name__)

_EMPTY_RESULT = {
    "num_added": 0,
    "num_updated": 0,
    "num_skipped": 0,
    "num_deleted": 0,
}
_DOCUMENT_ID_NAMESPACE = uuid.UUID("9c9f3f5f-1bbd-4b3d-8ab0-86c438550f2b")


def document_uuid_encoder(document: Document) -> str:
    """Return a deterministic UUID for a document chunk."""
    serialized_metadata = json.dumps(document.metadata or {}, sort_keys=True, default=str)
    digest = hashlib.sha256(
        f"{document.page_content}\n{serialized_metadata}".encode("utf-8")
    ).hexdigest()
    return str(uuid.uuid5(_DOCUMENT_ID_NAMESPACE, digest))


class IngestionPipeline:
    """Load, split, and incrementally index documents."""

    def __init__(
        self,
        *,
        data_dir: Path,
        splitter: DocumentSplitter,
        vector_store: VectorStore,
        record_manager: SQLRecordManager,
    ) -> None:
        self._data_dir = data_dir
        self._splitter = splitter
        self._vector_store = vector_store
        self._record_manager = record_manager

    def run(self) -> dict[str, Any]:
        """Execute the full ingestion pipeline."""
        logger.info("=" * 60)
        logger.info("INGESTION PIPELINE - START")
        logger.info("=" * 60)

        files = self._discover_files()
        if not files:
            logger.warning("No supported documents found in %s", self._data_dir)
            return dict(_EMPTY_RESULT)

        logger.info("Discovered %d file(s) to process.", len(files))

        documents = self._load_all(files)
        if not documents:
            logger.warning("No documents could be loaded. Check logs for errors.")
            return dict(_EMPTY_RESULT)

        logger.info("Loaded %d raw document(s) total.", len(documents))

        chunks = self._splitter.split(documents)
        logger.info("Produced %d chunk(s) after splitting.", len(chunks))

        result = self._index(chunks)

        logger.info("=" * 60)
        logger.info("INGESTION PIPELINE - COMPLETE")
        logger.info(
            "Results: added=%d, updated=%d, skipped=%d, deleted=%d",
            result.get("num_added", 0),
            result.get("num_updated", 0),
            result.get("num_skipped", 0),
            result.get("num_deleted", 0),
        )
        logger.info("=" * 60)
        return result

    def _discover_files(self) -> list[Path]:
        """Recursively find all supported files in the data directory."""
        if not self._data_dir.exists():
            logger.error("Data directory does not exist: %s", self._data_dir)
            return []

        files: list[Path] = []
        for extension in SUPPORTED_EXTENSIONS:
            files.extend(self._data_dir.rglob(f"*{extension}"))

        files.sort()
        return files

    def _load_all(self, files: list[Path]) -> list[Document]:
        """Load all files, skipping failures gracefully."""
        documents: list[Document] = []

        for file_path in files:
            try:
                loader = get_loader(file_path)
                documents.extend(loader.load(file_path))
            except (ValueError, FileNotFoundError) as exc:
                logger.error("Skipping file '%s' due to error: %s", file_path.name, exc)
            except Exception as exc:
                logger.error(
                    "Unexpected error loading '%s': %s",
                    file_path.name,
                    exc,
                    exc_info=True,
                )

        return documents

    def _index(self, chunks: list[Document]) -> dict[str, Any]:
        """Index chunks with incremental cleanup."""
        logger.info("Starting incremental indexing of %d chunk(s)...", len(chunks))

        try:
            return langchain_index(
                docs_source=chunks,
                record_manager=self._record_manager,
                vector_store=self._vector_store,
                cleanup="incremental",
                source_id_key="source",
                key_encoder=document_uuid_encoder,
            )
        except Exception as exc:
            logger.error("Indexing failed: %s", exc, exc_info=True)
            raise RuntimeError(f"Incremental indexing failed: {exc}") from exc
