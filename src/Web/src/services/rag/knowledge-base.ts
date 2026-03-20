import type { RetrievedDocument } from '@/services/ai/types';

interface KnowledgeBaseAnalysis {
  isStrongMatch: boolean;
  lexicalCoverage: number;
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

const TOKEN_PATTERN = /[a-z0-9]+/g;
const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'can',
  'company',
  'do',
  'for',
  'how',
  'i',
  'in',
  'is',
  'it',
  'me',
  'my',
  'of',
  'on',
  'or',
  'our',
  'please',
  'tell',
  'the',
  'to',
  'us',
  'we',
  'what',
  'with',
  'you',
  'your',
]);
const SEARCHABLE_METADATA_FIELDS = [
  'question',
  'answer',
  'category',
  'tags',
  'title',
  'heading',
  'section',
  'summary',
  'keywords',
] as const;
const DOCUMENT_MATCH_POLICY = {
  minimumSimilarity: 0.6,
  minimumLexicalCoverage: 0.5,
  lexicalWeight: 0.05,
} as const;

export function rerankKnowledgeBaseDocuments(
  query: string,
  documents: RetrievedDocument[]
): RetrievedDocument[] {
  return rankDocuments(query, documents).map(({ document }) => document);
}

export function resolveKnowledgeBaseAnswer(
  query: string,
  documents: RetrievedDocument[]
): KnowledgeBaseResolution {
  const rankedDocuments = rankDocuments(query, documents);
  const strongMatch = rankedDocuments.find(({ analysis }) => analysis.isStrongMatch);

  return {
    documents: rankedDocuments.map(({ document }) => document),
    hasStrongMatch: strongMatch !== undefined,
    responseText: strongMatch ? getDeterministicResponseText(strongMatch.document) : null,
  };
}

function rankDocuments(query: string, documents: RetrievedDocument[]): RankedDocument[] {
  const queryTerms = tokenize(query);

  return documents
    .map((document) => ({
      analysis: analyzeDocumentMatch(queryTerms, document),
      document,
    }))
    .sort((left, right) => {
      if (right.analysis.rerankScore !== left.analysis.rerankScore) {
        return right.analysis.rerankScore - left.analysis.rerankScore;
      }

      return right.document.similarity - left.document.similarity;
    });
}

function analyzeDocumentMatch(
  queryTerms: ReadonlySet<string>,
  document: RetrievedDocument
): KnowledgeBaseAnalysis {
  const lexicalCoverage = getQueryCoverage(
    queryTerms,
    buildSearchTerms(document)
  );
  const isStrongMatch =
    document.similarity >= DOCUMENT_MATCH_POLICY.minimumSimilarity &&
    lexicalCoverage >= DOCUMENT_MATCH_POLICY.minimumLexicalCoverage;

  return {
    isStrongMatch,
    lexicalCoverage,
    rerankScore:
      document.similarity +
      lexicalCoverage * DOCUMENT_MATCH_POLICY.lexicalWeight,
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

function buildSearchTerms(document: RetrievedDocument): ReadonlySet<string> {
  return tokenize([
    document.content,
    ...getSearchableMetadataValues(document.metadata),
  ].join(' '));
}

function getSearchableMetadataValues(
  metadata: RetrievedDocument['metadata']
): string[] {
  return SEARCHABLE_METADATA_FIELDS.flatMap((field) =>
    getMetadataFieldValues(metadata[field])
  );
}

function getMetadataFieldValues(value: unknown): string[] {
  if (typeof value === 'string') {
    return value.trim() ? [value.trim()] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry) => getMetadataFieldValues(entry));
  }

  return [];
}

function getQueryCoverage(
  queryTerms: ReadonlySet<string>,
  candidateTerms: ReadonlySet<string>
): number {
  if (queryTerms.size === 0 || candidateTerms.size === 0) {
    return 0;
  }

  let matchedTerms = 0;
  for (const term of queryTerms) {
    if (candidateTerms.has(term)) {
      matchedTerms += 1;
    }
  }

  return matchedTerms / queryTerms.size;
}

function tokenize(value: string): Set<string> {
  const matches = value.toLowerCase().match(TOKEN_PATTERN) ?? [];

  return new Set(
    matches
      .map(normalizeToken)
      .filter((term) => term.length > 1 && !STOP_WORDS.has(term))
  );
}

function normalizeToken(token: string): string {
  if (token.length <= 3) {
    return token;
  }

  if (token.endsWith('ies') && token.length > 4) {
    return `${token.slice(0, -3)}y`;
  }

  if (token.endsWith('ing') && token.length > 5) {
    return token.slice(0, -3);
  }

  if (token.endsWith('ed') && token.length > 4) {
    return token.slice(0, -2);
  }

  if (token.endsWith('es') && token.length > 4) {
    return token.slice(0, -2);
  }

  if (token.endsWith('s') && token.length > 3) {
    return token.slice(0, -1);
  }

  return token;
}
