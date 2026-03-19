import type {
  AIProvider,
  ChatRequest,
  ChatResponse,
  IChatService,
  IEmbeddingService,
  RetrievedDocument,
} from '@/services/ai/types';
import { DEFAULT_CHAT_MODE } from '@/services/ai/chat-mode';
import type { IVectorSearchRepository } from '@/services/rag/vector-search.repository';

const KNOWLEDGE_BASE_ONLY_FALLBACK =
  'No data exists in the knowledge base for the question you asked.';

export class RagChatService implements IChatService {
  constructor(
    private readonly providerChatService: IChatService,
    private readonly embeddingService: IEmbeddingService,
    private readonly vectorSearchRepository: IVectorSearchRepository,
    private readonly provider: AIProvider
  ) {}

  async getChatResponse(input: ChatRequest): Promise<ChatResponse> {
    const mode = input.mode ?? DEFAULT_CHAT_MODE;

    if (mode === 'llm-chat') {
      return this.providerChatService.getChatResponse({
        ...input,
        systemInstruction: buildGeneralSystemInstruction(),
      });
    }

    const [embedding] = await this.embeddingService.createEmbedding(input.message);
    const contextDocuments = await this.vectorSearchRepository.searchSimilar(
      embedding
    );

    const isGrounded = hasUsableKnowledgeBaseContext(contextDocuments);

    if (mode === 'knowledge-base' && !isGrounded) {
      return {
        text: KNOWLEDGE_BASE_ONLY_FALLBACK,
        provider: this.provider,
        contextDocuments,
        isGrounded: false,
      };
    }

    const response = await this.providerChatService.getChatResponse({
      ...input,
      systemInstruction: buildSystemInstruction(contextDocuments, mode),
    });

    return {
      ...response,
      contextDocuments,
      isGrounded,
    };
  }
}

function buildSystemInstruction(
  contextDocuments: RetrievedDocument[],
  mode: NonNullable<ChatRequest['mode']>
): string {
  if (contextDocuments.length === 0) {
    return buildGeneralSystemInstruction();
  }

  const formattedContext = contextDocuments
    .map(
      (document, index) =>
        `[Document ${index + 1}] (similarity: ${document.similarity.toFixed(3)})\n${document.content}`
    )
    .join('\n\n');

  if (mode === 'knowledge-base') {
    return [
      'You are a highly precise AI assistant. Your primary goal is to answer the user question using ONLY the provided retrieved context below.',
      'STRICT RULES:',
      '1. Use the "RETRIEVED CONTEXT" section to answer.',
      `2. If the answer is not explicitly contained within the context, state: "${KNOWLEDGE_BASE_ONLY_FALLBACK}"`,
      '3. Do not invent facts or use your internal knowledge to supplement missing information.',
      '4. Maintain a professional and helpful tone.',
      '',
      '--- RETRIEVED CONTEXT ---',
      formattedContext,
      '--- END RETRIEVED CONTEXT ---',
    ].join('\n');
  }

  return [
    'You are a helpful AI assistant.',
    'Use the retrieved context as the primary source whenever it is relevant to the user question.',
    'If the retrieved context is incomplete, you may use general knowledge to provide a helpful answer.',
    'Do not contradict the retrieved context.',
    'If part of the answer is based on general knowledge rather than the retrieved context, make that distinction clear in the response when appropriate.',
    'Be concise and professional.',
    '',
    '--- RETRIEVED CONTEXT ---',
    formattedContext,
    '--- END RETRIEVED CONTEXT ---',
  ].join('\n');
}

function buildGeneralSystemInstruction(): string {
  return [
    'You are a helpful AI assistant.',
    'Answer the user question accurately using your general knowledge.',
    'Be concise and professional.',
  ].join('\n');
}

function hasUsableKnowledgeBaseContext(
  contextDocuments: RetrievedDocument[]
): boolean {
  return contextDocuments.some((document) => document.content.trim().length > 0);
}
