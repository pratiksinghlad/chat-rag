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

interface OllamaConfig {
  baseUrl?: string;
  chatModel: string;
  embeddingModel: string;
}

abstract class OllamaServiceBase {
  constructor(private readonly config: OllamaConfig) {}

  protected get baseUrl(): string {
    const value = this.config.baseUrl?.trim();
    if (!value) {
      throw new AIConfigurationError(
        'VITE_OLLAMA_BASE_URL is required when VITE_AI_PROVIDER=ollama.'
      );
    }

    return value.replace(/\/$/, '');
  }

  protected get chatModel(): string {
    return this.config.chatModel;
  }

  protected get embeddingModel(): string {
    return this.config.embeddingModel;
  }
}

export class OllamaChatService
  extends OllamaServiceBase
  implements IChatService
{
  async getChatResponse(input: ChatRequest): Promise<ChatResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.chatModel,
          prompt: buildTranscriptPrompt(input.message, input.history),
          system: input.systemInstruction,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new AIProviderError(
          `Ollama chat request failed with status ${response.status}.`
        );
      }

      const payload = (await response.json()) as { response?: string };
      const text = payload.response?.trim();

      if (!text) {
        throw new AIProviderError('Ollama returned an empty response.');
      }

      return {
        text,
        provider: 'ollama',
        isGrounded: false,
      };
    } catch (error) {
      if (
        error instanceof AIConfigurationError ||
        error instanceof AIProviderError
      ) {
        throw error;
      }

      throw new AIProviderError('Ollama chat request failed.', {
        cause: error,
      });
    }
  }
}

export class OllamaEmbeddingService
  extends OllamaServiceBase
  implements IEmbeddingService
{
  async createEmbedding(input: string | string[]): Promise<number[][]> {
    const values = Array.isArray(input) ? input : [input];

    try {
      return Promise.all(
        values.map(async (value) => {
          const response = await fetch(`${this.baseUrl}/api/embed`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: this.embeddingModel,
              input: value,
            }),
          });

          if (!response.ok) {
            throw new AIProviderError(
              `Ollama embedding request failed with status ${response.status}.`
            );
          }

          const payload = (await response.json()) as {
            embeddings?: number[][];
          };
          const vector = payload.embeddings?.[0];

          if (!vector) {
            throw new AIProviderError(
              'Ollama returned an empty embedding response.'
            );
          }

          return vector;
        })
      );
    } catch (error) {
      if (
        error instanceof AIConfigurationError ||
        error instanceof AIProviderError
      ) {
        throw error;
      }

      throw new AIProviderError('Ollama embedding request failed.', {
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
