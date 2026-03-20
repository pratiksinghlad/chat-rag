"""
Google REST API embedding provider.

This module wraps the Google Generative AI embedding endpoint in a
LangChain-compatible ``Embeddings`` implementation so it can plug into the
existing vector store and indexing pipeline without additional adapters.
"""

from __future__ import annotations

import logging
import re
from typing import Any

import requests
from langchain_core.embeddings import Embeddings

logger = logging.getLogger(__name__)
_WHITESPACE_PATTERN = re.compile(r"\n{3,}")


class GoogleRestEmbeddings(Embeddings):
    """LangChain-compatible wrapper around the Google embedding REST API."""

    def __init__(
        self,
        *,
        api_key: str,
        model: str = "gemini-embedding-001",
        api_version: str = "v1beta",
    ) -> None:
        """
        Initialize the Google REST client.

        Args:
            api_key: Google AI API key.
            model: Embedding model name.
            api_version: Google AI API version.
        """
        self._api_key = api_key
        self._model = model
        self._api_version = api_version
        self._base_url = (
            f"https://generativelanguage.googleapis.com/{api_version}"
            f"/models/{model}:embedContent"
        )
        logger.info(
            "GoogleRestEmbeddings initialized: model=%s, version=%s",
            model,
            api_version,
        )

    def _call_api(self, text: str, task_type: str = "RETRIEVAL_DOCUMENT") -> list[float]:
        """Call the Google embedding API for a single text payload."""
        normalized_text = self._normalize_text(text)
        headers = {
            "x-goog-api-key": self._api_key,
            "Content-Type": "application/json",
        }
        payload = {
            "content": {
                "parts": [{"text": normalized_text}],
            },
            "task_type": task_type,
        }

        try:
            response = requests.post(
                self._base_url,
                json=payload,
                headers=headers,
                timeout=30,
            )
            response.raise_for_status()
            data = response.json()

            if "embedding" not in data or "values" not in data["embedding"]:
                raise ValueError(f"Unexpected API response format: {data}")

            return list(data["embedding"]["values"])
        except requests.exceptions.RequestException as exc:
            logger.error("REST API call failed: %s", exc)
            if hasattr(exc, "response") and exc.response is not None:
                logger.error("Response body: %s", exc.response.text)
            raise

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        """Generate embeddings for a list of document texts."""
        if not texts:
            return []

        embeddings: list[list[float]] = []
        for index, text in enumerate(texts):
            try:
                embeddings.append(self._call_api(text, task_type="RETRIEVAL_DOCUMENT"))
            except Exception as exc:
                logger.error("Failed to embed document chunk %d: %s", index, exc)
                raise

        logger.debug("Embedded %d document chunk(s).", len(embeddings))
        return embeddings

    def embed_query(self, text: str) -> list[float]:
        """Generate an embedding for a single query string."""
        return self._call_api(text, task_type="RETRIEVAL_QUERY")

    @staticmethod
    def _normalize_text(text: str) -> str:
        normalized = text.replace("\r\n", "\n").strip()
        normalized = _WHITESPACE_PATTERN.sub("\n\n", normalized)
        return normalized.strip()


def create_embeddings(
    *,
    model: str = "gemini-embedding-001",
    api_key: str,
    **_kwargs: Any,
) -> GoogleRestEmbeddings:
    """
    Return a configured Google REST embedding provider.

    Args:
        model: Embedding model name.
        api_key: Google AI API key.

    Returns:
        A LangChain-compatible embeddings instance.
    """
    logger.info("Creating embeddings via REST API: model=%s", model)
    return GoogleRestEmbeddings(api_key=api_key, model=model)
