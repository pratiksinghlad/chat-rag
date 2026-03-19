"""
PDF Document Loader.

Wraps LangChain's PyPDFLoader with graceful error handling for
corrupted or encrypted PDF files.
"""

from __future__ import annotations

import logging
from pathlib import Path

from langchain_community.document_loaders import PyPDFLoader
from langchain_core.documents import Document

from src.loaders.base import BaseDocumentLoader

logger = logging.getLogger(__name__)


class PDFDocumentLoader(BaseDocumentLoader):
    """Loads PDF files using PyPDFLoader."""

    def load(self, file_path: Path) -> list[Document]:
        """
        Load a PDF file and return one Document per page.

        Args:
            file_path: Path to the PDF file.

        Returns:
            List of Documents (one per page).

        Raises:
            FileNotFoundError: If file does not exist.
            ValueError: If the PDF is corrupted or unreadable.
        """
        self._validate_file(file_path)
        logger.info("Loading PDF: %s", file_path.name)

        try:
            loader = PyPDFLoader(str(file_path))
            documents = loader.load()
        except Exception as exc:
            logger.error("Failed to load PDF '%s': %s", file_path.name, exc)
            raise ValueError(
                f"Could not parse PDF '{file_path.name}': {exc}"
            ) from exc

        documents = self._enrich_metadata(documents, file_path)
        logger.info(
            "Loaded %d page(s) from PDF: %s", len(documents), file_path.name
        )
        return documents
