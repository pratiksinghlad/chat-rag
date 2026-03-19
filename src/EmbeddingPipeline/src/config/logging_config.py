"""
Logging Configuration Module.

Sets up datewise rotating file logging and console output.
Log files are written to logs/pipeline_YYYY-MM-DD.log.
"""

from __future__ import annotations

import logging
import sys
from datetime import datetime, timezone
from pathlib import Path


def setup_logging(log_level: str = "INFO", logs_dir: Path | None = None) -> None:
    """
    Configure the application-wide logging system.

    Creates a datewise log file and a console handler.

    Args:
        log_level: Minimum log level (DEBUG, INFO, WARNING, ERROR, CRITICAL).
        logs_dir: Directory for log files. Defaults to project_root/logs.
    """
    if logs_dir is None:
        logs_dir = Path(__file__).resolve().parent.parent.parent / "logs"

    logs_dir.mkdir(parents=True, exist_ok=True)

    # Datewise log filename
    today = datetime.now(tz=timezone.utc).strftime("%Y-%m-%d")
    log_file = logs_dir / f"pipeline_{today}.log"

    # Resolve numeric level
    numeric_level = getattr(logging, log_level.upper(), logging.INFO)

    # Formatter
    formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-8s | %(name)-30s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # File handler (append mode — multiple runs in one day go to the same file)
    file_handler = logging.FileHandler(log_file, encoding="utf-8")
    file_handler.setLevel(numeric_level)
    file_handler.setFormatter(formatter)

    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(numeric_level)
    console_handler.setFormatter(formatter)

    # Root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(numeric_level)

    # Avoid duplicate handlers on multiple calls
    root_logger.handlers.clear()
    root_logger.addHandler(file_handler)
    root_logger.addHandler(console_handler)

    logging.getLogger(__name__).info(
        "Logging initialized — level=%s, file=%s", log_level, log_file
    )
