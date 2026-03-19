"""Application settings."""

from __future__ import annotations

from pathlib import Path
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict

_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    """Pipeline configuration loaded from environment variables and .env."""

    model_config = SettingsConfigDict(
        env_file=str(_PROJECT_ROOT / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    supabase_url: str
    supabase_service_role_key: str
    google_api_key: str

    embedding_model: str = "gemini-embedding-001"
    embedding_dimensions: int = 3072

    chunk_size: int = 1000
    chunk_overlap: int = 200

    data_dir: str = "data/documents"
    documents_table: str = "documents"

    record_manager_db_url: str = f"sqlite:///{_PROJECT_ROOT / 'data' / 'record_manager.db'}"
    record_manager_namespace: str = "supabase/documents_v2"

    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = "INFO"

    @property
    def project_root(self) -> Path:
        """Return the resolved project root directory."""
        return _PROJECT_ROOT

    @property
    def data_path(self) -> Path:
        """Return the resolved data directory path."""
        path = Path(self.data_dir)
        if not path.is_absolute():
            path = _PROJECT_ROOT / path
        return path.resolve()

    @property
    def logs_path(self) -> Path:
        """Return the resolved logs directory path."""
        return _PROJECT_ROOT / "logs"
