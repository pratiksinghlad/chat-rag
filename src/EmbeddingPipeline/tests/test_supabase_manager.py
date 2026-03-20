from __future__ import annotations

import unittest
from unittest.mock import Mock, patch

from src.vectorstore.supabase_manager import SupabaseManager


class SupabaseManagerTests(unittest.TestCase):
    @patch("src.vectorstore.supabase_manager.SupabaseVectorStore")
    @patch("src.vectorstore.supabase_manager.create_client")
    def test_initializes_vector_store_with_supported_arguments(
        self,
        create_client_mock: Mock,
        vector_store_mock: Mock,
    ) -> None:
        client = Mock()
        embeddings = Mock()
        create_client_mock.return_value = client
        vector_store_instance = Mock()
        vector_store_mock.return_value = vector_store_instance

        manager = SupabaseManager(
            supabase_url="https://example.supabase.co",
            supabase_key="service-role-key",
            embeddings=embeddings,
            table_name="documents",
        )

        create_client_mock.assert_called_once_with(
            "https://example.supabase.co",
            "service-role-key",
        )
        vector_store_mock.assert_called_once_with(
            client=client,
            embedding=embeddings,
            table_name="documents",
            query_name="match_documents",
            chunk_size=500,
        )
        self.assertIs(manager.client, client)
        self.assertIs(manager.vector_store, vector_store_instance)


if __name__ == "__main__":
    unittest.main()
