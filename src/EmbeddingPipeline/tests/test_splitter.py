from __future__ import annotations

import unittest

from langchain_core.documents import Document

from src.transformers.splitter import DocumentSplitter


class DocumentSplitterTests(unittest.TestCase):
    def test_preserves_markdown_headings_in_chunk_metadata_and_content(self) -> None:
        splitter = DocumentSplitter(chunk_size=400, chunk_overlap=50)
        document = Document(
            page_content=(
                "<!-- internal metadata -->\n"
                "# Company Handbook\n\n"
                "## SECTION 7 - IT & DATA SECURITY\n\n"
                "### 7.3 Data Handling\n\n"
                "Employees handling Confidential data must use encrypted channels.\n\n"
                "### 7.4 Incident Response Obligation\n\n"
                "Every employee must report suspicious activity within 1 hour.\n"
            ),
            metadata={
                "source": "\\data\\documents\\company-handbook.md",
                "file_name": "company-handbook.md",
                "file_type": ".md",
            },
        )

        chunks = splitter.split([document])

        self.assertEqual(len(chunks), 2)
        self.assertEqual(chunks[0].metadata["title"], "Company Handbook")
        self.assertEqual(
            chunks[0].metadata["section"],
            "SECTION 7 - IT & DATA SECURITY",
        )
        self.assertEqual(chunks[0].metadata["heading"], "7.3 Data Handling")
        self.assertNotIn("internal metadata", chunks[0].page_content)
        self.assertIn("Company Handbook", chunks[0].page_content)
        self.assertIn("7.3 Data Handling", chunks[0].page_content)
        self.assertNotIn("7.4 Incident Response Obligation", chunks[0].page_content)

    def test_splits_plain_text_by_policy_section_without_content_bleed(self) -> None:
        splitter = DocumentSplitter(chunk_size=1000, chunk_overlap=200)
        document = Document(
            page_content=(
                "COMPANY POLICY DOCUMENT\n\n"
                "--------------------------------------------------------------------------------\n"
                "POLICY 02 - ACCEPTABLE USE POLICY (AUP)\n"
                "Chunk ID: POLICY-2026-VDB-003::chunk::P02\n"
                "--------------------------------------------------------------------------------\n"
                "Permitted Uses:\n"
                "- Business communications.\n\n"
                "Prohibited Uses:\n"
                "- Using AI tools not approved by the IT Security team.\n\n"
                "--------------------------------------------------------------------------------\n"
                "POLICY 03 - DATA PRIVACY POLICY\n"
                "Chunk ID: POLICY-2026-VDB-003::chunk::P03\n"
                "--------------------------------------------------------------------------------\n"
                "Purpose:\n"
                "To ensure compliance with applicable data protection laws and safeguard personal data.\n\n"
                "Data Subject Rights:\n"
                "- Access personal data.\n"
                "- Request correction.\n"
                "- Request deletion where permitted.\n\n"
                "Obligations for Employees Handling Personal Data:\n"
                "- Collect only data necessary for the stated business purpose.\n"
                "- Store personal data only in approved systems.\n"
                "- Report any suspected breach within 1 hour.\n"
            ),
            metadata={
                "source": "\\data\\documents\\company-policy.txt",
                "file_name": "company-policy.txt",
                "file_type": ".txt",
            },
        )

        chunks = splitter.split([document])

        self.assertEqual(len(chunks), 2)
        policy_three_chunk = chunks[1]
        self.assertEqual(
            policy_three_chunk.metadata["chunk_id"],
            "POLICY-2026-VDB-003::chunk::P03",
        )
        self.assertEqual(policy_three_chunk.metadata["section_chunk_total"], 1)
        self.assertIn("POLICY 03 - DATA PRIVACY POLICY", policy_three_chunk.page_content)
        self.assertIn("Data Subject Rights:", policy_three_chunk.page_content)
        self.assertIn(
            "Obligations for Employees Handling Personal Data:",
            policy_three_chunk.page_content,
        )
        self.assertNotIn("Prohibited Uses:", policy_three_chunk.page_content)

    def test_keeps_semantic_section_whole_until_it_exceeds_soft_limit(self) -> None:
        splitter = DocumentSplitter(chunk_size=1000, chunk_overlap=200)
        repeated_sentence = "Collect only the minimum personal data required for the stated purpose. "
        long_body = repeated_sentence * 18
        document = Document(
            page_content=(
                "POLICY 03 - DATA PRIVACY POLICY\n"
                "Chunk ID: POLICY-2026-VDB-003::chunk::P03\n"
                f"Purpose:\n{long_body}\n"
            ),
            metadata={
                "source": "\\data\\documents\\company-policy.txt",
                "file_name": "company-policy.txt",
                "file_type": ".txt",
            },
        )

        chunks = splitter.split([document])

        self.assertEqual(len(chunks), 1)
        self.assertEqual(chunks[0].metadata["section_chunk_total"], 1)
        self.assertIn("POLICY 03 - DATA PRIVACY POLICY", chunks[0].page_content)


if __name__ == "__main__":
    unittest.main()
