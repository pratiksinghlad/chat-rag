import { supabase } from '@/lib/supabase';
import { VectorSearchError } from '@/services/ai/errors';
import type {
  RagSearchOptions,
  RetrievedDocument,
} from '@/services/ai/types';
import { RAG_CONFIG } from '@/services/rag/config';

export interface IVectorSearchRepository {
  searchSimilar(
    queryEmbedding: number[],
    options?: RagSearchOptions
  ): Promise<RetrievedDocument[]>;
}

export class SupabaseVectorSearchRepository
  implements IVectorSearchRepository
{
  async searchSimilar(
    queryEmbedding: number[],
    options?: RagSearchOptions
  ): Promise<RetrievedDocument[]> {
    const { data, error } = await (supabase.rpc as CallableFunction)(
      RAG_CONFIG.matchFunction,
      {
        query_embedding: queryEmbedding,
        match_threshold: options?.matchThreshold ?? RAG_CONFIG.matchThreshold,
        match_count: options?.matchCount ?? RAG_CONFIG.matchCount,
      }
    );

    if (error) {
      throw new VectorSearchError('Supabase vector search failed.', {
        cause: error,
      });
    }

    if (!Array.isArray(data)) {
      return [];
    }

    return data
      .map((row) => ({
        id: String(row.id ?? ''),
        content: String(row.content ?? '').trim(),
        metadata:
          row.metadata && typeof row.metadata === 'object'
            ? (row.metadata as Record<string, unknown>)
            : {},
        similarity: Number(row.similarity ?? 0),
      }))
      .filter((row) => row.content.length > 0);
  }
}
