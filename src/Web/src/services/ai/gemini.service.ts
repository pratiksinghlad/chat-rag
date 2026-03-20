import { GoogleGenerativeAI, TaskType } from '@google/generative-ai';
import {
  AIConfigurationError,
  AIProviderError,
} from '@/services/ai/errors';
import type {
  ChatRequest,
  ChatResponse,
  IChatService,
  IEmbeddingService,
} from '@/services/ai/types';

interface GeminiConfig {
  apiKey?: string;
  chatModel: string;
  embeddingModel: string;
}

abstract class GeminiServiceBase {
  private client: GoogleGenerativeAI | null = null;

  constructor(private readonly config: GeminiConfig) {}

  protected getClient(): GoogleGenerativeAI {
    const apiKey = normalizeApiKey(this.config.apiKey);
    if (!apiKey) {
      throw new AIConfigurationError(
        'VITE_GEMINI_API_KEY is required when VITE_AI_PROVIDER=gemini.'
      );
    }

    if (!this.client) {
      this.client = new GoogleGenerativeAI(apiKey);
    }

    return this.client;
  }

  protected get chatModel(): string {
    return this.config.chatModel;
  }

  protected get embeddingModel(): string {
    return this.config.embeddingModel;
  }
}

export class GeminiChatService
  extends GeminiServiceBase
  implements IChatService
{
  async getChatResponse(input: ChatRequest): Promise<ChatResponse> {
    try {
      const model = this.getClient().getGenerativeModel(
        {
          model: this.chatModel,
          systemInstruction: input.systemInstruction,
        },
        { apiVersion: 'v1beta' }
      );

      const result = await model.generateContent(
        buildTranscriptPrompt(input.message, input.history)
      );
      const text = result.response.text();

      if (!text) {
        throw new AIProviderError('Gemini returned an empty response.');
      }

      return {
        text,
        provider: 'gemini',
        isGrounded: false,
      };
    } catch (error) {
      if (
        error instanceof AIConfigurationError ||
        error instanceof AIProviderError
      ) {
        throw error;
      }

      throw new AIProviderError('Gemini chat request failed.', {
        cause: error,
      });
    }
  }
}

export class GeminiEmbeddingService
  extends GeminiServiceBase
  implements IEmbeddingService
{
  async createEmbedding(input: string | string[]): Promise<number[][]> {
    const values = Array.isArray(input) ? input : [input];

    try {
      const model = this.getClient().getGenerativeModel(
        { model: this.embeddingModel },
        { apiVersion: 'v1beta' }
      );

      return Promise.all(
        values.map(async (value) => {
          const result = await model.embedContent({
            content: {
              role: 'user',
              parts: [{ text: value }],
            },
            taskType: TaskType.RETRIEVAL_QUERY,
          });
          return result.embedding.values;
        })
      );
    } catch (error) {
      if (error instanceof AIConfigurationError) {
        throw error;
      }

      throw new AIProviderError('Gemini embedding request failed.', {
        cause: error,
      });
    }
  }
}

function buildTranscriptPrompt(
  message: string,
  history: ChatRequest['history']
): string {
  if (!history || history.length === 0) {
    return message;
  }

  const transcript = history
    .map((item) => `${item.role.toUpperCase()}: ${item.content}`)
    .join('\n');

  return `${transcript}\nUSER: ${message}`;
}

function normalizeApiKey(rawValue?: string): string {
  if (!rawValue) {
    return '';
  }

  const trimmed = rawValue.trim();
  if (!trimmed) {
    return '';
  }

  if (trimmed.startsWith('AIza')) {
    return trimmed;
  }

  try {
    const decoded = atob(trimmed).trim();
    return decoded || trimmed;
  } catch {
    return trimmed;
  }
}
