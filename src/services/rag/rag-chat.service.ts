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

    const isGrounded = contextDocuments.length > 0;

    const response = await this.providerChatService.getChatResponse({
      ...input,
      systemInstruction: buildSystemInstruction(contextDocuments),
    });

    return {
      ...response,
      contextDocuments,
      isGrounded,
    };
  }
}

function buildSystemInstruction(contextDocuments: RetrievedDocument[]): string {
  if (contextDocuments.length === 0) {
    return [
      'You are a helpful AI assistant.',
      'Answer the user question accurately using your general knowledge.',
      'Be concise and professional.',
    ].join('\n');
  }

  const formattedContext = contextDocuments
    .map(
      (document, index) =>
        `[Document ${index + 1}] (similarity: ${document.similarity.toFixed(3)})\n${document.content}`
    )
    .join('\n\n');

  return [
    'You are a highly precise AI assistant. Your primary goal is to answer the user question using ONLY the provided retrieved context below.',
    'STRICT RULES:',
    '1. Use the "RETRIEVED CONTEXT" section to answer.',
    '2. If the answer is not explicitly contained within the context, state: "I am sorry, but I do not have enough specific information in my knowledge base to answer that question accurately."',
    '3. Do not invent facts or use your internal knowledge to supplement missing information if it contradicts the goal of being grounded in the data.',
    '4. Maintain a professional and helpful tone.',
    '',
    '--- RETRIEVED CONTEXT ---',
    formattedContext,
    '--- END RETRIEVED CONTEXT ---',
  ].join('\n');
}
