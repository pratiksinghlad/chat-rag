import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useChatHistory } from '@/context/ChatHistoryContext';
import { createChatService } from '@/services/ai/factory';
import {
  buildChatTitle,
  createStoredChatMessage,
  toConversationHistory,
  toUiMessages,
} from '@/services/chat-history/utils';
import type { ChatSessionDetail } from '@/services/chat-history/types';
import type { ChatMessage } from '@/types/chat';

interface UseChatRagReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  isInitializing: boolean;
  error: string | null;
  activeChatTitle: string | null;
  sendMessage: (input: string) => Promise<void>;
  clearChat: () => void;
}

const chatService = createChatService();

export function useChatRag(): UseChatRagReturn {
  const navigate = useNavigate();
  const { chatId } = useParams<{ chatId?: string }>();
  const { user } = useAuth();
  const { getChatById, createChat, appendMessages } = useChatHistory();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeChat, setActiveChat] = useState<ChatSessionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const loadActiveChat = async () => {
      if (!chatId) {
        setActiveChat(null);
        setMessages([]);
        setError(null);
        setIsInitializing(false);
        return;
      }

      setIsInitializing(true);
      try {
        setError(null);
        const chat = await getChatById(chatId);

        if (!chat) {
          if (!isCancelled) {
            setActiveChat(null);
            setMessages([]);
            setError('This chat could not be found or you do not have access to it.');
            navigate('/chat', { replace: true });
          }
          return;
        }

        if (!isCancelled) {
          setActiveChat(chat);
          setMessages(toUiMessages(chat.messages));
        }
      } catch (loadError) {
        if (!isCancelled) {
          setActiveChat(null);
          setMessages([]);
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Failed to load the selected chat.'
          );
        }
      } finally {
        if (!isCancelled) {
          setIsInitializing(false);
        }
      }
    };

    void loadActiveChat();

    return () => {
      isCancelled = true;
    };
  }, [chatId, getChatById, navigate, user?.email]);

  const sendMessage = useCallback(
    async (input: string) => {
      const trimmed = input.trim();
      if (!trimmed) return;

      if (!user?.email) {
        setError('Your account must have an email address to use chat history.');
        return;
      }

      const userMessage = createStoredChatMessage('user', trimmed);
      setError(null);

      try {
        let session = activeChat;

        if (!session) {
          session = await createChat({
            title: buildChatTitle(trimmed),
            firstMessage: userMessage,
          });

          setActiveChat(session);
          setMessages(toUiMessages(session.messages));
          navigate(`/chat/${session.id}`, { replace: true });
        } else {
          session = await appendMessages(session.id, [userMessage]);
          setActiveChat(session);
          setMessages(toUiMessages(session.messages));
        }

        const history = toConversationHistory(session.messages).slice(0, -1);
        setIsLoading(true);
        const response = await chatService.getChatResponse({
          message: trimmed,
          history,
        });

        const assistantMessage = createStoredChatMessage(
          'assistant',
          response.text
        );
        const updatedSession = await appendMessages(session.id, [
          assistantMessage,
        ]);

        setActiveChat(updatedSession);
        setMessages(toUiMessages(updatedSession.messages));
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'An unexpected error occurred.';

        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [activeChat, appendMessages, createChat, navigate, user?.email]
  );

  const clearChat = useCallback(() => {
    setActiveChat(null);
    setMessages([]);
    setError(null);
    navigate('/chat');
  }, [navigate]);

  return {
    messages,
    isLoading,
    isInitializing,
    error,
    activeChatTitle: activeChat?.title ?? null,
    sendMessage,
    clearChat,
  };
}
