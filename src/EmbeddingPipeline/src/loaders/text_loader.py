"""
Text / Markdown / CSV Document Loader.

Handles plain-text based file formats using LangChain's TextLoader.
"""

from __future__ import annotations

import logging
from pathlib import Path

from langchain_community.document_loaders import TextLoader
from langchain_core.documents import Document

from src.loaders.base import BaseDocumentLoader

logger = logging.getLogger(__name__)


class TextDocumentLoader(BaseDocumentLoader):
    """Loads text-based files (.txt, .md, .csv, .json, .log, etc.)."""

    def load(self, file_path: Path) -> list[Document]:
        """
        Load a text-based file and return a single Document.

        Args:
            file_path: Path to the text file.

        Returns:
            List containing a single Document.

        Raises:
            FileNotFoundError: If file does not exist.
            ValueError: If the file cannot be read.
        """
        self._validate_file(file_path)
        logger.info("Loading text file: %s", file_path.name)

        try:
            loader = TextLoader(str(file_path), encoding="utf-8")
            documents = loader.load()
        except Exception as exc:
            logger.error("Failed to load text file '%s': %s", file_path.name, exc)
            raise ValueError(
                f"Could not read text file '{file_path.name}': {exc}"
            ) from exc

        documents = self._enrich_metadata(documents, file_path)
        logger.info("Loaded text file: %s", file_path.name)
        return documents
