import { GeminiChatService, GeminiEmbeddingService } from '@/services/ai/gemini.service';
import type {
  IChatService,
  IEmbeddingService,
} from '@/services/ai/types';

interface ServiceBundle {
  embeddingService: IEmbeddingService;
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

  const providerChatService = new GeminiChatService({
    chatModel: import.meta.env.VITE_GEMINI_CHAT_MODEL ?? 'gemini-3-flash-preview',
    embeddingModel: import.meta.env.VITE_GEMINI_EMBEDDING_MODEL ?? 'gemini-embedding-001',
  });

  cachedBundle = {
    embeddingService: new GeminiEmbeddingService({
      chatModel: import.meta.env.VITE_GEMINI_CHAT_MODEL ?? 'gemini-3-flash-preview',
      embeddingModel: import.meta.env.VITE_GEMINI_EMBEDDING_MODEL ?? 'gemini-embedding-001',
    }),
    ragChatService: providerChatService, // AI Proxy Edge Function handles underlying complete RAG logic
  };

  return cachedBundle;
}
