"""Supabase vector store setup."""

from __future__ import annotations

import logging

from langchain_community.vectorstores import SupabaseVectorStore
from langchain_core.embeddings import Embeddings
from supabase import Client, create_client

logger = logging.getLogger(__name__)


class SupabaseManager:
    """Manage the Supabase client and LangChain vector store."""

    def __init__(
        self,
        *,
        supabase_url: str,
        supabase_key: str,
        embeddings: Embeddings,
        table_name: str = "documents",
    ) -> None:
        logger.info("Connecting to Supabase: %s", supabase_url)

        self._client: Client = create_client(supabase_url, supabase_key)
        self._vector_store = SupabaseVectorStore(
            client=self._client,
            embedding=embeddings,
            table_name=table_name,
            query_name="match_documents",
            chunk_size=500,
        )

        logger.info("SupabaseVectorStore initialized - table=%s", table_name)

    @property
    def client(self) -> Client:
        """Return the raw Supabase client."""
        return self._client

    @property
    def vector_store(self) -> SupabaseVectorStore:
        """Return the LangChain SupabaseVectorStore instance."""
        return self._vector_store
