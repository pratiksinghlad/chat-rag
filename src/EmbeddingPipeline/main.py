"""CLI entry point for the embedding pipeline."""

from __future__ import annotations

import logging
import sys

from src.config.logging_config import setup_logging
from src.config.settings import Settings
from src.embeddings.embedder import create_embeddings
from src.indexing.pipeline import IngestionPipeline
from src.indexing.record_manager import create_record_manager
from src.transformers.splitter import DocumentSplitter
from src.vectorstore.supabase_manager import SupabaseManager

logger = logging.getLogger(__name__)


def main() -> int:
    """Execute the document ingestion pipeline."""
    try:
        settings = Settings()  # type: ignore[call-arg]
    except Exception as exc:
        print(f"[FATAL] Failed to load configuration: {exc}", file=sys.stderr)
        print("       Make sure a .env file exists (copy from .env.example).", file=sys.stderr)
        return 1

    setup_logging(log_level=settings.log_level, logs_dir=settings.logs_path)

    logger.info("Configuration loaded successfully.")
    logger.info("Data directory: %s", settings.data_path)
    logger.info("Embedding model: %s (dim=%d)", settings.embedding_model, settings.embedding_dimensions)
    logger.info("Chunk size: %d, overlap: %d", settings.chunk_size, settings.chunk_overlap)

    try:
        embeddings = create_embeddings(
            model=settings.embedding_model,
            api_key=settings.GEMINI_API_KEY,
        )
        supabase_mgr = SupabaseManager(
            supabase_url=settings.supabase_url,
            supabase_key=settings.supabase_service_role_key,
            embeddings=embeddings,
            table_name=settings.documents_table,
        )
        record_manager = create_record_manager(
            db_url=settings.record_manager_db_url,
            namespace=settings.record_manager_namespace,
        )
        splitter = DocumentSplitter(
            chunk_size=settings.chunk_size,
            chunk_overlap=settings.chunk_overlap,
        )
    except Exception as exc:
        logger.critical("Failed to initialize components: %s", exc, exc_info=True)
        return 1

    try:
        pipeline = IngestionPipeline(
            data_dir=settings.data_path,
            splitter=splitter,
            vector_store=supabase_mgr.vector_store,
            record_manager=record_manager,
        )
        result = pipeline.run()
        logger.info("Pipeline result: %s", result)
    except Exception as exc:
        logger.critical("Pipeline failed: %s", exc, exc_info=True)
        return 1

    logger.info("Pipeline completed successfully. Exiting.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
