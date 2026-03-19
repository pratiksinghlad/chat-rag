"""
Text Splitter Module.

Configurable wrapper around LangChain's RecursiveCharacterTextSplitter.
Chunk size and overlap are driven by application settings.
"""

from __future__ import annotations

import logging

from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

logger = logging.getLogger(__name__)


class DocumentSplitter:
    """Splits documents into smaller chunks for embedding."""

    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200) -> None:
        """
        Initialize the splitter.

        Args:
            chunk_size: Maximum number of characters per chunk.
            chunk_overlap: Number of overlapping characters between chunks.
        """
        self._splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            length_function=len,
            is_separator_regex=False,
        )
        logger.info(
            "DocumentSplitter initialized — chunk_size=%d, overlap=%d",
            chunk_size,
            chunk_overlap,
        )

    def split(self, documents: list[Document]) -> list[Document]:
        """
        Split a list of documents into smaller chunks.

        Args:
            documents: LangChain Documents to split.

        Returns:
            List of chunked Documents with preserved metadata.
        """
        chunks = self._splitter.split_documents(documents)
        logger.info(
            "Split %d document(s) into %d chunk(s)", len(documents), len(chunks)
        )
        return chunks
