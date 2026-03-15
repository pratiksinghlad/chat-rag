import type {
  ChatRequest,
  ChatResponse,
  IChatService,
  IEmbeddingService,
  RetrievedDocument,
} from '@/services/ai/types';
import type { IVectorSearchRepository } from '@/services/rag/vector-search.repository';

export class RagChatService implements IChatService {
  constructor(
    private readonly providerChatService: IChatService,
    private readonly embeddingService: IEmbeddingService,
    private readonly vectorSearchRepository: IVectorSearchRepository
  ) {}

  async getChatResponse(input: ChatRequest): Promise<ChatResponse> {
    const [embedding] = await this.embeddingService.createEmbedding(input.message);
    const contextDocuments = await this.vectorSearchRepository.searchSimilar(
      embedding
    );

    const response = await this.providerChatService.getChatResponse({
      ...input,
      systemInstruction: buildSystemInstruction(contextDocuments),
    });

    return {
      ...response,
      contextDocuments,
    };
  }
}

function buildSystemInstruction(contextDocuments: RetrievedDocument[]): string {
  if (contextDocuments.length === 0) {
    return [
      'You are a helpful AI assistant.',
      'No relevant knowledge base context was retrieved.',
      'Answer carefully and be honest when you are uncertain.',
    ].join('\n');
  }

  const formattedContext = contextDocuments
    .map(
      (document, index) =>
        `[Document ${index + 1}] (similarity: ${document.similarity.toFixed(3)})\n${document.content}`
    )
    .join('\n\n');

  return [
    'You are a helpful AI assistant with access to retrieved knowledge base context.',
    'Use the context below when it is relevant to the user question.',
    'If the context is not sufficient, say so clearly instead of inventing facts.',
    '',
    '--- RETRIEVED CONTEXT ---',
    formattedContext,
    '--- END RETRIEVED CONTEXT ---',
  ].join('\n');
}
