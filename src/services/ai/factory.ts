import { AIConfigurationError } from '@/services/ai/errors';
import { GeminiChatService, GeminiEmbeddingService } from '@/services/ai/gemini.service';
import { OllamaChatService, OllamaEmbeddingService } from '@/services/ai/ollama.service';
import type {
  AIProvider,
  ChatRequest,
  ChatResponse,
  IChatService,
  IEmbeddingService,
} from '@/services/ai/types';
import { RagChatService } from '@/services/rag/rag-chat.service';
import { SupabaseVectorSearchRepository } from '@/services/rag/vector-search.repository';

type ProviderName = AIProvider | 'invalid';

interface ServiceBundle {
  embeddingService: IEmbeddingService;
  providerChatService: IChatService;
  ragChatService: IChatService;
}

let cachedBundle: ServiceBundle | null = null;

export function createChatService(): IChatService {
  return getBundle().ragChatService;
}

export function createEmbeddingService(): IEmbeddingService {
  return getBundle().embeddingService;
}

function getBundle(): ServiceBundle {
  if (cachedBundle) {
    return cachedBundle;
  }

  const providerName = resolveProvider();
  const repository = new SupabaseVectorSearchRepository();

  if (providerName === 'gemini') {
    const embeddingService = new GeminiEmbeddingService({
      apiKey: import.meta.env.VITE_GEMINI_API_KEY,
      chatModel: import.meta.env.VITE_GEMINI_CHAT_MODEL ?? 'gemini-3-flash-preview',
      embeddingModel:
        import.meta.env.VITE_GEMINI_EMBEDDING_MODEL ?? 'gemini-embedding-001',
    });
    const providerChatService = new GeminiChatService({
      apiKey: import.meta.env.VITE_GEMINI_API_KEY,
      chatModel: import.meta.env.VITE_GEMINI_CHAT_MODEL ?? 'gemini-3-flash-preview',
      embeddingModel:
        import.meta.env.VITE_GEMINI_EMBEDDING_MODEL ?? 'gemini-embedding-001',
    });

    cachedBundle = {
      embeddingService,
      providerChatService,
      ragChatService: new RagChatService(
        providerChatService,
        embeddingService,
        repository
      ),
    };

    return cachedBundle;
  }

  if (providerName === 'ollama') {
    const embeddingService = new OllamaEmbeddingService({
      baseUrl: import.meta.env.VITE_OLLAMA_BASE_URL,
      chatModel: import.meta.env.VITE_OLLAMA_CHAT_MODEL ?? 'llama3.2',
      embeddingModel:
        import.meta.env.VITE_OLLAMA_EMBEDDING_MODEL ?? 'nomic-embed-text',
    });
    const providerChatService = new OllamaChatService({
      baseUrl: import.meta.env.VITE_OLLAMA_BASE_URL,
      chatModel: import.meta.env.VITE_OLLAMA_CHAT_MODEL ?? 'llama3.2',
      embeddingModel:
        import.meta.env.VITE_OLLAMA_EMBEDDING_MODEL ?? 'nomic-embed-text',
    });

    cachedBundle = {
      embeddingService,
      providerChatService,
      ragChatService: new RagChatService(
        providerChatService,
        embeddingService,
        repository
      ),
    };

    return cachedBundle;
  }

  const message =
    'VITE_AI_PROVIDER must be set to "gemini" or "ollama" to use chat.';

  cachedBundle = {
    embeddingService: new UnavailableEmbeddingService(message),
    providerChatService: new UnavailableChatService(message),
    ragChatService: new UnavailableChatService(message),
  };

  return cachedBundle;
}

function resolveProvider(): ProviderName {
  const provider = import.meta.env.VITE_AI_PROVIDER?.trim();
  return provider === 'gemini' || provider === 'ollama' ? provider : 'invalid';
}

class UnavailableChatService implements IChatService {
  constructor(private readonly message: string) {}

  async getChatResponse(_input: ChatRequest): Promise<ChatResponse> {
    throw new AIConfigurationError(this.message);
  }
}

class UnavailableEmbeddingService implements IEmbeddingService {
  constructor(private readonly message: string) {}

  async createEmbedding(_input: string | string[]): Promise<number[][]> {
    throw new AIConfigurationError(this.message);
  }
}
