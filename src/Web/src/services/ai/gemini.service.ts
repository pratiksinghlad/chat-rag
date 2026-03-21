import { supabase } from '@/lib/supabase';
import {
  AIProviderError,
} from '@/services/ai/errors';
import type {
  ChatRequest,
  ChatResponse,
  IChatService,
  IEmbeddingService,
} from '@/services/ai/types';

interface GeminiConfig {
  chatModel: string;
  embeddingModel: string;
}

abstract class GeminiServiceBase {
  constructor(protected readonly config: GeminiConfig) {}

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
      const { data, error } = await supabase.functions.invoke('ai-proxy-chat-rag', {
        body: {
          action: 'rag-chat',
          body: {
            model: this.chatModel,
            systemInstruction: input.systemInstruction,
            message: input.message,
            history: input.history,
            mode: input.mode,
          },
        },
      });

      if (error) throw error;
      
      return {
        text: data.text || 'No response from proxy',
        provider: 'gemini',
        contextDocuments: data.contextDocuments,
        isGrounded: data.isGrounded ?? false,
      };
    } catch (error) {
      console.error('Gemini proxy error:', error);
      throw new AIProviderError('Gemini chat request failed via proxy.', {
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
      const results = await Promise.all(
        values.map(async (value) => {
          const { data, error } = await supabase.functions.invoke('ai-proxy-chat-rag', {
            body: {
              action: 'embed',
              body: {
                model: this.embeddingModel,
                text: value,
              },
            },
          });

          if (error) throw error;
          if (!data?.embedding) throw new Error('Failed to get embedding from proxy');
          return data.embedding;
        })
      );

      return results;
    } catch (error) {
      console.error('Gemini embedding proxy error:', error);
      throw new AIProviderError('Gemini embedding request failed via proxy.', {
        cause: error,
      });
    }
  }
}



