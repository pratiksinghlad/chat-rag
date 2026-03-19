from __future__ import annotations

import tempfile
import unittest
import uuid
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import Mock, patch

from langchain_core.documents import Document

from src.indexing.pipeline import IngestionPipeline, document_uuid_encoder


class DocumentUuidEncoderTests(unittest.TestCase):
    def test_returns_valid_uuid(self) -> None:
        document = Document(page_content="hello", metadata={"source": "doc.md"})

        value = document_uuid_encoder(document)

        self.assertEqual(str(uuid.UUID(value)), value)

    def test_is_deterministic_for_same_document(self) -> None:
        document = Document(page_content="hello", metadata={"source": "doc.md", "page": 1})

        first = document_uuid_encoder(document)
        second = document_uuid_encoder(document)

        self.assertEqual(first, second)

    def test_changes_when_document_changes(self) -> None:
        first = Document(page_content="hello", metadata={"source": "doc.md"})
        second = Document(page_content="hello again", metadata={"source": "doc.md"})

        self.assertNotEqual(document_uuid_encoder(first), document_uuid_encoder(second))

    def test_changes_when_metadata_changes(self) -> None:
        first = Document(page_content="hello", metadata={"source": "doc.md"})
        second = Document(page_content="hello", metadata={"source": "other.md"})

        self.assertNotEqual(document_uuid_encoder(first), document_uuid_encoder(second))


class IngestionPipelineTests(unittest.TestCase):
    def test_run_returns_empty_result_when_directory_has_no_supported_files(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            pipeline = IngestionPipeline(
                data_dir=Path(temp_dir),
                splitter=SimpleNamespace(split=Mock()),
                vector_store=Mock(),
                record_manager=Mock(),
            )

            with self.assertLogs("src.indexing.pipeline", level="WARNING"):
                result = pipeline.run()

        self.assertEqual(
            result,
            {
                "num_added": 0,
                "num_updated": 0,
                "num_skipped": 0,
                "num_deleted": 0,
            },
        )

    @patch("src.indexing.pipeline.langchain_index")
    @patch("src.indexing.pipeline.get_loader")
    def test_run_indexes_loaded_chunks(
        self,
        get_loader_mock: Mock,
        langchain_index_mock: Mock,
    ) -> None:
        langchain_index_mock.return_value = {"num_added": 1, "num_updated": 0, "num_skipped": 0, "num_deleted": 0}

        raw_document = Document(page_content="raw", metadata={"source": "doc.md"})
        chunk = Document(page_content="chunk", metadata={"source": "doc.md"})
        loader = Mock()
        loader.load.return_value = [raw_document]
        get_loader_mock.return_value = loader
        splitter = SimpleNamespace(split=Mock(return_value=[chunk]))

        with tempfile.TemporaryDirectory() as temp_dir:
            file_path = Path(temp_dir) / "doc.md"
            file_path.write_text("hello", encoding="utf-8")

            pipeline = IngestionPipeline(
                data_dir=Path(temp_dir),
                splitter=splitter,
                vector_store=Mock(),
                record_manager=Mock(),
            )

            result = pipeline.run()

        self.assertEqual(result["num_added"], 1)
        splitter.split.assert_called_once_with([raw_document])
        get_loader_mock.assert_called_once_with(file_path)

        _, kwargs = langchain_index_mock.call_args
        self.assertEqual(kwargs["docs_source"], [chunk])
        self.assertEqual(kwargs["cleanup"], "incremental")
        self.assertEqual(kwargs["source_id_key"], "source")
        self.assertIs(kwargs["key_encoder"], document_uuid_encoder)

    @patch("src.indexing.pipeline.langchain_index", side_effect=ValueError("boom"))
    def test_index_wraps_errors(self, _: Mock) -> None:
        pipeline = IngestionPipeline(
            data_dir=Path("."),
            splitter=SimpleNamespace(split=Mock()),
            vector_store=Mock(),
            record_manager=Mock(),
        )

        with self.assertLogs("src.indexing.pipeline", level="ERROR"):
            with self.assertRaisesRegex(RuntimeError, "Incremental indexing failed: boom"):
                pipeline._index([Document(page_content="chunk", metadata={"source": "doc.md"})])


if __name__ == "__main__":
    unittest.main()
