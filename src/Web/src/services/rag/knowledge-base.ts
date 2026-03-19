import type { RetrievedDocument } from '@/services/ai/types';

interface KnowledgeBaseAnalysis {
  isFaq: boolean;
  isStrongMatch: boolean;
  rerankScore: number;
}

export interface KnowledgeBaseResolution {
  documents: RetrievedDocument[];
  hasStrongMatch: boolean;
  responseText: string | null;
}

interface RankedDocument {
  analysis: KnowledgeBaseAnalysis;
  document: RetrievedDocument;
}

const FAQ_SIMILARITY_THRESHOLD = 0.6;
const GENERAL_KB_SIMILARITY_THRESHOLD = 0.75;

export function rerankKnowledgeBaseDocuments(
  _query: string,
  documents: RetrievedDocument[]
): RetrievedDocument[] {
  return rankDocuments(documents).map(({ document }) => document);
}

export function resolveKnowledgeBaseAnswer(
  _query: string,
  documents: RetrievedDocument[]
): KnowledgeBaseResolution {
  const rankedDocuments = rankDocuments(documents);
  const strongMatch = rankedDocuments.find(({ analysis }) => analysis.isStrongMatch);

  return {
    documents: rankedDocuments.map(({ document }) => document),
    hasStrongMatch: strongMatch !== undefined,
    responseText: strongMatch ? getDeterministicResponseText(strongMatch.document) : null,
  };
}

function rankDocuments(documents: RetrievedDocument[]): RankedDocument[] {
  return documents
    .map((document) => ({
      analysis: analyzeDocumentMatch(document),
      document,
    }))
    .sort((left, right) => {
      if (right.analysis.rerankScore !== left.analysis.rerankScore) {
        return right.analysis.rerankScore - left.analysis.rerankScore;
      }

      return right.document.similarity - left.document.similarity;
    });
}

function analyzeDocumentMatch(document: RetrievedDocument): KnowledgeBaseAnalysis {
  const isFaq = document.metadata.document_type === 'faq';
  const similarityThreshold = isFaq
    ? FAQ_SIMILARITY_THRESHOLD
    : GENERAL_KB_SIMILARITY_THRESHOLD;

  return {
    isFaq,
    isStrongMatch: document.similarity >= similarityThreshold,
    rerankScore: document.similarity,
  };
}

function getDeterministicResponseText(document: RetrievedDocument): string {
  if (document.metadata.document_type === 'faq') {
    const answer = getStringMetadata(document.metadata.answer);
    if (answer) {
      return answer;
    }
  }

  return document.content.trim();
}

function getStringMetadata(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}
