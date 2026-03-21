"""Application settings."""

from __future__ import annotations

from pathlib import Path
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict

_PIPELINE_ROOT = Path(__file__).resolve().parents[2]
_WORKSPACE_ROOT = _PIPELINE_ROOT.parent.parent


class Settings(BaseSettings):
    """Pipeline configuration loaded from environment variables and .env."""

    model_config = SettingsConfigDict(
        env_file=str(_PIPELINE_ROOT / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    supabase_url: str
    supabase_service_role_key: str
    GEMINI_API_KEY: str

    embedding_model: str = "gemini-embedding-001"
    embedding_dimensions: int = 3072

    chunk_size: int = 1000
    chunk_overlap: int = 200

    data_dir: str = "src/Web/public/documents"
    documents_table: str = "documents"

    record_manager_db_url: str = f"sqlite:///{_PIPELINE_ROOT / 'data' / 'record_manager.db'}"
    record_manager_namespace: str = "supabase/documents_v2"

    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = "INFO"

    @property
    def project_root(self) -> Path:
        """Return the pipeline root directory."""
        return _PIPELINE_ROOT

    @property
    def workspace_root(self) -> Path:
        """Return the workspace root directory."""
        return _WORKSPACE_ROOT

    @property
    def data_path(self) -> Path:
        """Return the resolved data directory path."""
        path = Path(self.data_dir)
        if not path.is_absolute():
            path = _WORKSPACE_ROOT / path
        return path.resolve()

    @property
    def logs_path(self) -> Path:
        """Return the resolved logs directory path."""
        return _PIPELINE_ROOT / "logs"
