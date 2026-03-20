"""Structure-aware document chunking for embedding pipelines."""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass
from pathlib import Path

from langchain_core.documents import Document
from langchain_text_splitters import (
    MarkdownHeaderTextSplitter,
    RecursiveCharacterTextSplitter,
)

logger = logging.getLogger(__name__)

_MARKDOWN_HEADERS = [
    ("#", "title"),
    ("##", "section"),
    ("###", "heading"),
    ("####", "subheading"),
]
_TEXT_SECTION_HEADING_PATTERN = re.compile(
    r"^(?P<heading>(?:SECTION|POLICY|CHAPTER|ARTICLE)\s+\d+[A-Z]?\b.*)$",
    re.IGNORECASE,
)
_TEXT_CHUNK_ID_PATTERN = re.compile(r"^Chunk ID:\s*(?P<chunk_id>\S.*)$", re.IGNORECASE)
_SEPARATOR_LINE_PATTERN = re.compile(r"^[-=]{3,}$")
_MARKDOWN_COMMENT_PATTERN = re.compile(r"<!--.*?-->\s*", re.DOTALL)
_WHITESPACE_PATTERN = re.compile(r"\n{3,}")


@dataclass(frozen=True)
class StructuredSection:
    """A logical document section ready to be embedded or further split."""

    content: str
    metadata: dict[str, object]


class DocumentSplitter:
    """Split documents using semantic structure before falling back to recursion."""

    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200) -> None:
        self._chunk_size = chunk_size
        self._chunk_overlap = chunk_overlap
        self._semantic_chunk_size = max(chunk_size, int(chunk_size * 1.5))
        self._recursive_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            length_function=len,
            is_separator_regex=False,
        )
        self._semantic_splitter = RecursiveCharacterTextSplitter(
            chunk_size=self._semantic_chunk_size,
            chunk_overlap=min(chunk_overlap, max(self._semantic_chunk_size // 5, 0)),
            length_function=len,
            is_separator_regex=False,
        )
        self._markdown_splitter = MarkdownHeaderTextSplitter(
            headers_to_split_on=_MARKDOWN_HEADERS,
            strip_headers=True,
        )
        logger.info(
            "DocumentSplitter initialized: chunk_size=%d, overlap=%d, semantic_limit=%d",
            chunk_size,
            chunk_overlap,
            self._semantic_chunk_size,
        )

    def split(self, documents: list[Document]) -> list[Document]:
        """
        Split a list of documents into logical embedding chunks.

        Args:
            documents: LangChain documents to split.

        Returns:
            Structure-aware chunks with preserved metadata.
        """
        chunks: list[Document] = []
        for document in documents:
            chunks.extend(self._split_document(document))

        logger.info("Split %d document(s) into %d chunk(s)", len(documents), len(chunks))
        return chunks

    def _split_document(self, document: Document) -> list[Document]:
        file_type = str(document.metadata.get("file_type", "")).lower()

        if document.metadata.get("document_type") == "faq":
            return self._create_chunks_from_section(
                StructuredSection(
                    content=self._normalize_text(document.page_content),
                    metadata=dict(document.metadata),
                ),
                chunk_size=self._semantic_chunk_size,
            )

        if file_type == ".md":
            return self._split_markdown_document(document)

        if file_type in {".txt", ".log", ".rst"}:
            text_chunks = self._split_structured_text_document(document)
            if text_chunks:
                return text_chunks

        return self._fallback_split(document)

    def _split_markdown_document(self, document: Document) -> list[Document]:
        markdown_text = self._clean_markdown(document.page_content)
        sections = self._markdown_splitter.split_text(markdown_text)

        if not sections:
            return self._fallback_split(document)

        logical_sections: list[StructuredSection] = []
        for section in sections:
            content = self._normalize_text(section.page_content)
            if not content:
                continue

            metadata = dict(document.metadata)
            metadata.update(self._normalize_markdown_metadata(section.metadata))
            logical_sections.append(
                StructuredSection(
                    content=self._build_structured_content(content, metadata),
                    metadata=metadata,
                )
            )

        if not logical_sections:
            return self._fallback_split(document)

        return self._create_chunks_from_sections(logical_sections)

    def _split_structured_text_document(self, document: Document) -> list[Document]:
        lines = document.page_content.replace("\r\n", "\n").split("\n")
        section_indexes = [
            index
            for index, line in enumerate(lines)
            if self._is_text_section_heading(line.strip())
        ]

        if not section_indexes:
            return []

        sections: list[StructuredSection] = []
        for position, start_index in enumerate(section_indexes):
            end_index = (
                section_indexes[position + 1]
                if position + 1 < len(section_indexes)
                else len(lines)
            )
            section_lines = self._trim_section_lines(lines[start_index:end_index])
            if not section_lines:
                continue

            heading = section_lines[0].strip()
            body_lines = section_lines[1:]
            chunk_id = self._extract_chunk_id(body_lines)
            body_lines = self._strip_chunk_id_line(body_lines)
            body_lines = self._trim_section_lines(body_lines)
            body = self._normalize_text("\n".join(body_lines))
            if not body:
                continue

            metadata = dict(document.metadata)
            metadata.update(
                {
                    "title": self._derive_title_from_file_name(metadata),
                    "section": heading,
                    "heading": heading,
                    "chunk_strategy": "text-structured-section",
                    "section_index": position + 1,
                }
            )
            if chunk_id:
                metadata["chunk_id"] = chunk_id

            sections.append(
                StructuredSection(
                    content=self._build_structured_content(body, metadata),
                    metadata=metadata,
                )
            )

        return self._create_chunks_from_sections(sections)

    def _create_chunks_from_sections(
        self,
        sections: list[StructuredSection],
    ) -> list[Document]:
        chunks: list[Document] = []
        for section in sections:
            chunks.extend(
                self._create_chunks_from_section(
                    section,
                    chunk_size=self._semantic_chunk_size,
                )
            )

        return self._annotate_source_chunk_indexes(chunks)

    def _create_chunks_from_section(
        self,
        section: StructuredSection,
        *,
        chunk_size: int,
    ) -> list[Document]:
        content = self._normalize_text(section.content)
        if not content:
            return []

        if len(content) <= chunk_size:
            metadata = dict(section.metadata)
            metadata["section_chunk_index"] = 1
            metadata["section_chunk_total"] = 1
            return [Document(page_content=content, metadata=metadata)]

        chunk_texts = [
            self._normalize_text(chunk)
            for chunk in self._semantic_splitter.split_text(content)
        ]
        chunk_texts = [chunk for chunk in chunk_texts if chunk]

        documents: list[Document] = []
        total_chunks = len(chunk_texts)
        for index, chunk_text in enumerate(chunk_texts, start=1):
            metadata = dict(section.metadata)
            metadata["section_chunk_index"] = index
            metadata["section_chunk_total"] = total_chunks
            documents.append(Document(page_content=chunk_text, metadata=metadata))

        return documents

    def _fallback_split(self, document: Document) -> list[Document]:
        chunks = self._recursive_splitter.split_documents([document])
        if len(chunks) <= 1:
            return self._annotate_source_chunk_indexes(
                [
                    Document(
                        page_content=self._normalize_text(chunks[0].page_content),
                        metadata=chunks[0].metadata,
                    )
                ]
            ) if chunks else []

        normalized_chunks = [
            Document(
                page_content=self._normalize_text(chunk.page_content),
                metadata=chunk.metadata,
            )
            for chunk in chunks
            if self._normalize_text(chunk.page_content)
        ]
        return self._annotate_source_chunk_indexes(normalized_chunks)

    @staticmethod
    def _clean_markdown(text: str) -> str:
        cleaned = _MARKDOWN_COMMENT_PATTERN.sub("", text.replace("\r\n", "\n"))
        return cleaned.strip()

    @staticmethod
    def _normalize_markdown_metadata(metadata: dict[str, object]) -> dict[str, object]:
        normalized = {
            key: str(value).strip()
            for key, value in metadata.items()
            if isinstance(value, str) and value.strip()
        }

        if "section" not in normalized and "heading" in normalized:
            normalized["section"] = normalized["heading"]

        if "heading" not in normalized and "subheading" in normalized:
            normalized["heading"] = normalized["subheading"]

        return normalized

    @staticmethod
    def _build_structured_content(content: str, metadata: dict[str, object]) -> str:
        headings = [
            str(metadata[field]).strip()
            for field in ("title", "section", "heading", "subheading")
            if isinstance(metadata.get(field), str) and str(metadata[field]).strip()
        ]

        unique_headings: list[str] = []
        seen: set[str] = set()
        for heading in headings:
            lowered = heading.casefold()
            if lowered in seen:
                continue
            seen.add(lowered)
            unique_headings.append(heading)

        prefix = "\n\n".join(unique_headings)
        return DocumentSplitter._normalize_text(
            f"{prefix}\n\n{content}" if prefix else content
        )

    @staticmethod
    def _normalize_text(text: str) -> str:
        normalized = text.replace("\r\n", "\n").strip()
        normalized = _WHITESPACE_PATTERN.sub("\n\n", normalized)
        return normalized.strip()

    @staticmethod
    def _is_text_section_heading(line: str) -> bool:
        return bool(line and _TEXT_SECTION_HEADING_PATTERN.match(line))

    @staticmethod
    def _trim_section_lines(lines: list[str]) -> list[str]:
        trimmed = [line.rstrip() for line in lines]

        while trimmed and (not trimmed[0].strip() or _SEPARATOR_LINE_PATTERN.match(trimmed[0].strip())):
            trimmed.pop(0)

        while trimmed and (not trimmed[-1].strip() or _SEPARATOR_LINE_PATTERN.match(trimmed[-1].strip())):
            trimmed.pop()

        return trimmed

    @staticmethod
    def _extract_chunk_id(lines: list[str]) -> str | None:
        if not lines:
            return None

        match = _TEXT_CHUNK_ID_PATTERN.match(lines[0].strip())
        if match:
            return match.group("chunk_id").strip()

        return None

    @staticmethod
    def _strip_chunk_id_line(lines: list[str]) -> list[str]:
        if not lines:
            return []

        if _TEXT_CHUNK_ID_PATTERN.match(lines[0].strip()):
            return lines[1:]

        return lines

    @staticmethod
    def _derive_title_from_file_name(metadata: dict[str, object]) -> str:
        file_name = str(metadata.get("file_name", "")).strip()
        if not file_name:
            return ""

        stem = Path(file_name).stem.replace("-", " ").replace("_", " ").strip()
        return stem.title()

    @staticmethod
    def _annotate_source_chunk_indexes(chunks: list[Document]) -> list[Document]:
        if not chunks:
            return []

        total = len(chunks)
        annotated: list[Document] = []
        for index, chunk in enumerate(chunks, start=1):
            metadata = dict(chunk.metadata)
            metadata["source_chunk_index"] = index
            metadata["source_chunk_total"] = total
            annotated.append(
                Document(
                    page_content=chunk.page_content,
                    metadata=metadata,
                )
            )

        return annotated
