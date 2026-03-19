"""Structured JSON document loader with FAQ-aware parsing."""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

from langchain_core.documents import Document

from src.loaders.base import BaseDocumentLoader
from src.loaders.text_loader import TextDocumentLoader

logger = logging.getLogger(__name__)


class JsonDocumentLoader(BaseDocumentLoader):
    """Load JSON files, treating known FAQ data as individual KB records."""

    def __init__(self) -> None:
        self._fallback_loader = TextDocumentLoader()

    def load(self, file_path: Path) -> list[Document]:
        self._validate_file(file_path)
        logger.info("Loading JSON file: %s", file_path.name)

        payload = self._read_json(file_path)
        if not self._is_faq_payload(payload):
            logger.info(
                "JSON file '%s' is not structured FAQ content. Falling back to text loader.",
                file_path.name,
            )
            return self._fallback_loader.load(file_path)

        documents = self._build_faq_documents(payload["entries"])
        documents = self._enrich_metadata(documents, file_path)
        logger.info(
            "Loaded %d FAQ entrie(s) from structured JSON file: %s",
            len(documents),
            file_path.name,
        )
        return documents

    def _read_json(self, file_path: Path) -> Any:
        try:
            return json.loads(file_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            logger.warning(
                "JSON parsing failed for '%s'. Falling back to text loader: %s",
                file_path.name,
                exc,
            )
            return None

    @staticmethod
    def _is_faq_payload(payload: Any) -> bool:
        if not isinstance(payload, dict):
            return False

        entries = payload.get("entries")
        if not isinstance(entries, list) or not entries:
            return False

        required_keys = {"id", "question", "answer", "category", "tags", "chunk_id"}
        for entry in entries:
            if not isinstance(entry, dict):
                return False
            if not required_keys.issubset(entry):
                return False
            if not isinstance(entry.get("tags"), list):
                return False

        return True

    @staticmethod
    def _build_faq_documents(entries: list[dict[str, Any]]) -> list[Document]:
        documents: list[Document] = []

        for entry in entries:
            if entry.get("embed_ready") is False:
                logger.info("Skipping FAQ entry '%s' because embed_ready=false", entry.get("id"))
                continue

            question = str(entry["question"]).strip()
            answer = str(entry["answer"]).strip()
            category = str(entry["category"]).strip()
            tags = [str(tag).strip() for tag in entry.get("tags", []) if str(tag).strip()]

            page_content = "\n".join(
                [
                    f"Question: {question}",
                    f"Answer: {answer}",
                    f"Category: {category}",
                    f"Tags: {', '.join(tags)}",
                ]
            )

            documents.append(
                Document(
                    page_content=page_content,
                    metadata={
                        "document_type": "faq",
                        "faq_id": str(entry["id"]),
                        "chunk_id": str(entry["chunk_id"]),
                        "question": question,
                        "answer": answer,
                        "category": category,
                        "tags": tags,
                    },
                )
            )

        return documents
