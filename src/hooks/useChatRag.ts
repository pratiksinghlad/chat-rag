import { useState, useCallback } from 'react';
import { createChatService } from '@/services/ai/factory';
import type { ChatHistoryMessage } from '@/services/ai/types';
import type { ChatMessage } from '@/types/chat';

interface UseChatRagReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (input: string) => Promise<void>;
  clearChat: () => void;
}

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const chatService = createChatService();

export function useChatRag(): UseChatRagReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (input: string) => {
      const trimmed = input.trim();
      if (!trimmed) return;

      const userMsg: ChatMessage = {
        id: createId(),
        role: 'user',
        content: trimmed,
        timestamp: new Date(),
      };

      const history = messages
        .filter(isConversationMessage)
        .map<ChatHistoryMessage>((message) => ({
          role: message.role,
          content: message.content,
        }));

      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      setError(null);

      try {
        const response = await chatService.getChatResponse({
          message: trimmed,
          history,
        });

        const assistantMsg: ChatMessage = {
          id: createId(),
          role: 'assistant',
          content: response.text,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'An unexpected error occurred.';

        setError(errorMessage);

        const errorMsg: ChatMessage = {
          id: createId(),
          role: 'error',
          content: errorMessage,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isLoading, error, sendMessage, clearChat };
}

function isConversationMessage(
  message: ChatMessage
): message is ChatMessage & { role: 'user' | 'assistant' } {
  return message.role === 'user' || message.role === 'assistant';
}
