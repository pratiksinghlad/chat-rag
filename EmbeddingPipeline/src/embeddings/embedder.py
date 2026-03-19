"""
Google REST API Embedding Provider Module.

Uses direct REST calls to the Google Generative AI v1beta endpoint:
https://generativelanguage.googleapis.com/v1beta/models/{model}:embedContent

Wraps these calls into a LangChain-compatible ``Embeddings`` interface so it
plugs directly into the existing vector store and indexing pipeline.
"""

from __future__ import annotations

import logging
from typing import Any

import requests
from langchain_core.embeddings import Embeddings

logger = logging.getLogger(__name__)


class GoogleRestEmbeddings(Embeddings):
    """LangChain-compatible wrapper around Google Generative AI REST API."""

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
            api_version: Google AI API version (e.g., v1beta).
        """
        self._api_key = api_key
        self._model = model
        self._api_version = api_version
        self._base_url = (
            f"https://generativelanguage.googleapis.com/{api_version}"
            f"/models/{model}:embedContent"
        )
        logger.info("GoogleRestEmbeddings initialized — model=%s, version=%s", model, api_version)

    def _call_api(self, text: str, task_type: str = "RETRIEVAL_DOCUMENT") -> list[float]:
        """Make the direct REST call to Google Embedding API."""
        url = self._base_url
        
        headers = {
            "x-goog-api-key": self._api_key,
            "Content-Type": "application/json"
        }
        
        payload = {
            "content": {
                "parts": [{"text": text}]
            },
            "task_type": task_type
        }
        
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            if "embedding" not in data or "values" not in data["embedding"]:
                raise ValueError(f"Unexpected API response format: {data}")
                
            return list(data["embedding"]["values"])
            
        except requests.exceptions.RequestException as exc:
            logger.error("REST API call failed: %s", exc)
            if hasattr(exc, 'response') and exc.response is not None:
                logger.error("Response body: %s", exc.response.text)
            raise

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        """Generate embeddings for a list of document texts."""
        if not texts:
            return []

        embeddings: list[list[float]] = []
        for i, text in enumerate(texts):
            try:
                embeddings.append(self._call_api(text, task_type="RETRIEVAL_DOCUMENT"))
            except Exception as exc:
                logger.error("Failed to embed document chunk %d: %s", i, exc)
                raise

        logger.debug("Embedded %d document chunk(s).", len(embeddings))
        return embeddings

    def embed_query(self, text: str) -> list[float]:
        """Generate an embedding for a single query string."""
        return self._call_api(text, task_type="RETRIEVAL_QUERY")


def create_embeddings(
    *,
    model: str = "gemini-embedding-001",
    api_key: str,
    **_kwargs: Any,
) -> GoogleRestEmbeddings:
    """
    Factory that returns a configured GoogleRestEmbeddings instance.

    Args:
        model: Embedding model name (default: gemini-embedding-001).
        api_key: Google AI API key.

    Returns:
        A LangChain-compatible Embeddings instance.
    """
    logger.info("Creating embeddings via REST API — model=%s", model)
    return GoogleRestEmbeddings(api_key=api_key, model=model)
