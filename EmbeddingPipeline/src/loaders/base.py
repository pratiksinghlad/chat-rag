"""
Abstract Base Document Loader.

Defines the contract that all document loaders must implement.
Uses the Strategy pattern — new file formats are supported by adding
a new subclass without modifying existing loader code (Open-Closed Principle).
"""

from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from pathlib import Path

from langchain_core.documents import Document

logger = logging.getLogger(__name__)


class BaseDocumentLoader(ABC):
    """
    Abstract base for all document loaders.

    Each subclass handles a specific file format and must implement
    the ``load`` method.
    """

    @abstractmethod
    def load(self, file_path: Path) -> list[Document]:
        """
        Load a document from disk and return LangChain Document(s).

        Args:
            file_path: Absolute path to the source file.

        Returns:
            A list of LangChain Documents with content and metadata.

        Raises:
            FileNotFoundError: If the file does not exist.
            ValueError: If the file cannot be parsed.
        """

    @staticmethod
    def _validate_file(file_path: Path) -> None:
        """Ensure the file exists and is readable."""
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        if not file_path.is_file():
            raise ValueError(f"Path is not a file: {file_path}")

    @staticmethod
    def _enrich_metadata(documents: list[Document], file_path: Path) -> list[Document]:
        """Add source file metadata to every document chunk."""
        for doc in documents:
            doc.metadata.update(
                {
                    "source": f"\data\documents\{file_path.name}",
                    "file_name": file_path.name,
                    "file_type": file_path.suffix.lower(),
                }
            )
        return documents
