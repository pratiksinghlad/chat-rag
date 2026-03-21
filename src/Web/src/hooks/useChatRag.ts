import { startTransition, useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useChatHistory } from '@/context/ChatHistoryContext';
import { supabase } from '@/lib/supabase';
import {
  buildChatTitle,
  createStoredChatMessage,
  toConversationHistory,
  toUiMessages,
} from '@/services/chat-history/utils';
import type { ChatMode } from '@/types/chat-mode';
import type { ChatSessionDetail } from '@/services/chat-history/types';
import type { ChatMessage } from '@/types/chat';

interface SendMessageInput {
  message: string;
  mode: ChatMode;
}

interface UseChatRagReturn {
  activeChatId: string | null;
  messages: ChatMessage[];
  isSendingMessage: boolean;
  isSwitchingChats: boolean;
  isDeletingChat: boolean;
  error: string | null;
  activeChatTitle: string | null;
  sendMessage: (input: SendMessageInput) => Promise<void>;
  clearChat: () => void;
  deleteActiveChat: () => Promise<void>;
}


export function useChatRag(): UseChatRagReturn {
  const navigate = useNavigate();
  const { chatId } = useParams<{ chatId?: string }>();
  const { user } = useAuth();
  const { getChatById, createChat, appendMessages, deleteChat } =
    useChatHistory();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeChat, setActiveChat] = useState<ChatSessionDetail | null>(null);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isSwitchingChats, setIsSwitchingChats] = useState(false);
  const [isDeletingChat, setIsDeletingChat] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isStale = false;

    const loadActiveChat = async () => {
      if (!chatId) {
        startTransition(() => {
          setActiveChat(null);
          setMessages([]);
          setError(null);
          setIsSwitchingChats(false);
        });
        return;
      }

      setIsSwitchingChats(true);
      try {
        setError(null);
        const chat = await getChatById(chatId);

        if (!chat) {
          if (!isStale) {
            setError('This chat could not be found or you do not have access to it.');
            navigate('/chat', { replace: true });
          }
          return;
        }

        if (!isStale) {
          startTransition(() => {
            setActiveChat(chat);
            setMessages(toUiMessages(chat.messages));
          });
        }
      } catch (loadError) {
        if (!isStale) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Failed to load the selected chat.'
          );
        }
      } finally {
        if (!isStale) {
          setIsSwitchingChats(false);
        }
      }
    };

    void loadActiveChat();

    return () => {
      isStale = true;
    };
  }, [chatId, getChatById, navigate, user?.email]);

  const sendMessage = useCallback(
    async (input: SendMessageInput) => {
      const trimmed = input.message.trim();
      if (!trimmed) return;

      if (!user?.email) {
        setError('Your account must have an email address to use chat history.');
        return;
      }

      const userMessage = createStoredChatMessage('user', trimmed, false, input.mode);
      const optimisticUserMessage = toUiMessages([userMessage])[0];
      setError(null);
      setMessages((currentMessages) => [...currentMessages, optimisticUserMessage]);

      try {
        let session = activeChat;

        if (!session) {
          session = await createChat({
            title: buildChatTitle(trimmed),
            firstMessage: userMessage,
          });

          setActiveChat(session);
          navigate(`/chat/${session.id}`, { replace: true });
        } else {
          session = await appendMessages(session.id, [userMessage]);
          setActiveChat(session);
        }

        const history = toConversationHistory(session.messages).slice(0, -1);
        setMessages(toUiMessages(session.messages));
        setIsSendingMessage(true);
        const { data, error: proxyError } = await supabase.functions.invoke('ai-proxy-chat-rag', {
          body: {
            action: 'rag-chat',
            body: {
              model: import.meta.env.VITE_GEMINI_CHAT_MODEL ?? 'gemini-3-flash-preview',
              message: trimmed,
              history,
              mode: input.mode,
            },
          },
        });

        if (proxyError) throw proxyError;
        
        const response = {
          text: data.text || 'No response from proxy',
          isGrounded: data.isGrounded ?? false,
        };

        const assistantMessage = createStoredChatMessage(
          'assistant',
          response.text,
          response.isGrounded,
          input.mode
        );
        const updatedSession = await appendMessages(session.id, [
          assistantMessage,
        ]);

        setActiveChat(updatedSession);
        setMessages(toUiMessages(updatedSession.messages));
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'An unexpected error occurred.';

        setMessages((currentMessages) =>
          currentMessages.filter((message) => message.id !== optimisticUserMessage.id)
        );
        setError(errorMessage);
      } finally {
        setIsSendingMessage(false);
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

  const deleteActiveChat = useCallback(async () => {
    if (!activeChat) {
      return;
    }

    setIsDeletingChat(true);
    try {
      await deleteChat(activeChat.id);
      startTransition(() => {
        setActiveChat(null);
        setMessages([]);
        setError(null);
      });
      navigate('/chat', { replace: true });
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Failed to delete the selected chat.'
      );
    } finally {
      setIsDeletingChat(false);
    }
  }, [activeChat, deleteChat, navigate]);

  return {
    activeChatId: activeChat?.id ?? null,
    messages,
    isSendingMessage,
    isSwitchingChats,
    isDeletingChat,
    error,
    activeChatTitle: activeChat?.title ?? null,
    sendMessage,
    clearChat,
    deleteActiveChat,
  };
}
