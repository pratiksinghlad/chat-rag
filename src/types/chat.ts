/**
 * Chat-RAG type definitions.
 * Strict interfaces for the RAG pipeline — no `any` types.
 */

/** A single message in the chat conversation */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'error';
  content: string;
  timestamp: Date;
}

/** A document returned from the Supabase vector similarity search */
export interface SupabaseDocument {
  id: string;
  content: string;
  metadata: Record<string, string>;
  similarity: number;
}

/** Parameters sent to the match_documents RPC */
export interface MatchDocumentsParams {
  query_embedding: number[];
  match_threshold: number;
  match_count: number;
}

/** Context assembled from retrieved documents, injected into the LLM prompt */
export interface RagContext {
  documents: SupabaseDocument[];
  formattedContext: string;
}

/** Configuration constants for the RAG pipeline */
export const RAG_CONFIG = {
  /** Minimum cosine similarity to consider a document relevant.
   *  Range: -1.0 (total opposites) to 1.0 (identical).
   *  -1.0 = return ALL documents (use while testing with dummy seed data).
   *  For production with real embeddings, raise to 0.3–0.5. */
  MATCH_THRESHOLD: -1.0,
  /** Maximum number of documents to retrieve */
  MATCH_COUNT: 5,
  /** Embedding model identifier — gemini-embedding-001 supports Matryoshka (768 or 3072) in v1beta */
  EMBEDDING_MODEL: 'gemini-embedding-001',
  /** Chat model identifier */
  CHAT_MODEL: 'gemini-3-flash-preview',
} as const;
