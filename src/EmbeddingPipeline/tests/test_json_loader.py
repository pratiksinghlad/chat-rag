from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from src.loaders.json_loader import JsonDocumentLoader


class JsonDocumentLoaderTests(unittest.TestCase):
    def setUp(self) -> None:
        self.loader = JsonDocumentLoader()

    def test_loads_structured_faq_entries_as_individual_documents(self) -> None:
        payload = {
            "entries": [
                {
                    "id": "faq-004",
                    "chunk_id": "FAQ-2026-VDB-001::chunk::004",
                    "question": "How do I submit a reimbursement request?",
                    "answer": "Upload receipts and submit for manager approval.",
                    "category": "finance",
                    "tags": ["reimbursement", "expenses", "finance"],
                    "embed_ready": True,
                }
            ]
        }

        with tempfile.TemporaryDirectory() as temp_dir:
            file_path = Path(temp_dir) / "faq.json"
            file_path.write_text(json.dumps(payload), encoding="utf-8")

            documents = self.loader.load(file_path)

        self.assertEqual(len(documents), 1)
        document = documents[0]
        self.assertIn("Question: How do I submit a reimbursement request?", document.page_content)
        self.assertIn("Answer: Upload receipts and submit for manager approval.", document.page_content)
        self.assertEqual(document.metadata["document_type"], "faq")
        self.assertEqual(document.metadata["faq_id"], "faq-004")
        self.assertEqual(
            document.metadata["answer"],
            "Upload receipts and submit for manager approval.",
        )
        self.assertEqual(document.metadata["tags"], ["reimbursement", "expenses", "finance"])
        self.assertEqual(document.metadata["source"], "\\data\\documents\\faq.json")

    def test_skips_entries_marked_not_ready_for_embedding(self) -> None:
        payload = {
            "entries": [
                {
                    "id": "faq-001",
                    "chunk_id": "FAQ-001",
                    "question": "Question?",
                    "answer": "Answer.",
                    "category": "general",
                    "tags": ["general"],
                    "embed_ready": False,
                }
            ]
        }

        with tempfile.TemporaryDirectory() as temp_dir:
            file_path = Path(temp_dir) / "faq.json"
            file_path.write_text(json.dumps(payload), encoding="utf-8")

            documents = self.loader.load(file_path)

        self.assertEqual(documents, [])

    def test_falls_back_to_plain_text_for_non_faq_json(self) -> None:
        payload = {"message": "hello world"}

        with tempfile.TemporaryDirectory() as temp_dir:
            file_path = Path(temp_dir) / "notes.json"
            file_path.write_text(json.dumps(payload), encoding="utf-8")

            documents = self.loader.load(file_path)

        self.assertEqual(len(documents), 1)
        self.assertEqual(documents[0].page_content.strip(), '{"message": "hello world"}')
        self.assertEqual(documents[0].metadata["file_type"], ".json")


if __name__ == "__main__":
    unittest.main()
