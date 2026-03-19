"""
Loader Registry.

Maps file extensions to their corresponding loader classes.
Provides a single entry point to retrieve the correct loader for any
supported file type. New loaders are registered here — nothing else changes.
"""

from __future__ import annotations

import logging
from pathlib import Path

from src.loaders.base import BaseDocumentLoader
from src.loaders.json_loader import JsonDocumentLoader
from src.loaders.pdf_loader import PDFDocumentLoader
from src.loaders.text_loader import TextDocumentLoader

logger = logging.getLogger(__name__)

# Singleton loader instances (stateless, safe to reuse)
_JSON_LOADER = JsonDocumentLoader()
_PDF_LOADER = PDFDocumentLoader()
_TEXT_LOADER = TextDocumentLoader()

# Extension → Loader mapping
_LOADER_REGISTRY: dict[str, BaseDocumentLoader] = {
    ".pdf": _PDF_LOADER,
    ".txt": _TEXT_LOADER,
    ".md": _TEXT_LOADER,
    ".csv": _TEXT_LOADER,
    ".json": _JSON_LOADER,
    ".log": _TEXT_LOADER,
    ".rst": _TEXT_LOADER,
}

# All extensions we can process
SUPPORTED_EXTENSIONS: frozenset[str] = frozenset(_LOADER_REGISTRY.keys())


def get_loader(file_path: Path) -> BaseDocumentLoader:
    """
    Return the appropriate loader for the given file's extension.

    Args:
        file_path: Path to the document file.

    Returns:
        A BaseDocumentLoader instance.

    Raises:
        ValueError: If the file extension is not supported.
    """
    extension = file_path.suffix.lower()
    loader = _LOADER_REGISTRY.get(extension)

    if loader is None:
        supported = ", ".join(sorted(SUPPORTED_EXTENSIONS))
        raise ValueError(
            f"Unsupported file extension '{extension}' for file '{file_path.name}'. "
            f"Supported: {supported}"
        )

    logger.debug("Resolved loader %s for extension '%s'", type(loader).__name__, extension)
    return loader
