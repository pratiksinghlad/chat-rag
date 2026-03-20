import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '@/context/AuthContext';
import { ChatHistoryConfigurationError } from '@/services/chat-history/errors';
import { SupabaseChatHistoryRepository } from '@/services/chat-history/repository';
import type {
  ChatHistoryRepository,
  ChatSessionDetail,
  ChatSessionSummary,
  StoredChatMessage,
} from '@/services/chat-history/types';
import { summarizeChatSession } from '@/services/chat-history/utils';

const CHAT_HISTORY_PAGE_SIZE = 10;
const chatHistoryRepository: ChatHistoryRepository =
  new SupabaseChatHistoryRepository();

interface ChatHistoryContextValue {
  chats: ChatSessionSummary[];
  searchQuery: string;
  hasMore: boolean;
  isLoadingChats: boolean;
  isLoadingMore: boolean;
  error: string | null;
  setSearchQuery: (value: string) => void;
  refreshChats: () => Promise<void>;
  loadMoreChats: () => Promise<void>;
  getChatById: (chatId: string) => Promise<ChatSessionDetail | null>;
  createChat: (input: {
    title: string;
    firstMessage: StoredChatMessage;
  }) => Promise<ChatSessionDetail>;
  appendMessages: (
    chatId: string,
    messages: StoredChatMessage[]
  ) => Promise<ChatSessionDetail>;
  deleteChat: (chatId: string) => Promise<void>;
}

const ChatHistoryContext = createContext<ChatHistoryContextValue | undefined>(
  undefined
);

export function ChatHistoryProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [chats, setChats] = useState<ChatSessionSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userEmail = user?.email ?? null;

  const loadChats = useCallback(
    async (offset: number, append: boolean) => {
      if (!user) {
        setChats([]);
        setHasMore(false);
        setError(null);
        return;
      }

      if (!userEmail) {
        throw new ChatHistoryConfigurationError(
          'Your account must have an email address to use chat history.'
        );
      }

      const result = await chatHistoryRepository.listChats({
        search: searchQuery,
        limit: CHAT_HISTORY_PAGE_SIZE,
        offset,
      });

      setChats((currentChats) =>
        append ? [...currentChats, ...result.chats] : result.chats
      );
      setHasMore(result.hasMore);
    },
    [searchQuery, user, userEmail]
  );

  const refreshChats = useCallback(async () => {
    if (!user) {
      setChats([]);
      setHasMore(false);
      setError(null);
      return;
    }

    setIsLoadingChats(true);
    try {
      setError(null);
      await loadChats(0, false);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load chat history.'
      );
      setChats([]);
      setHasMore(false);
    } finally {
      setIsLoadingChats(false);
    }
  }, [loadChats, user]);

  const loadMoreChats = useCallback(async () => {
    if (!hasMore || isLoadingMore || !user) {
      return;
    }

    setIsLoadingMore(true);
    try {
      setError(null);
      await loadChats(chats.length, true);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load more chats.'
      );
    } finally {
      setIsLoadingMore(false);
    }
  }, [chats.length, hasMore, isLoadingMore, loadChats, user]);

  const getChatById = useCallback(async (chatId: string) => {
    return chatHistoryRepository.getChatById(chatId);
  }, []);

  const createChat = useCallback(
    async (input: { title: string; firstMessage: StoredChatMessage }) => {
      if (!userEmail) {
        throw new ChatHistoryConfigurationError(
          'Your account must have an email address to use chat history.'
        );
      }

      const createdChat = await chatHistoryRepository.createChat({
        createdBy: userEmail,
        title: input.title,
        firstMessage: input.firstMessage,
      });

      startTransition(() => {
        setChats((currentChats) => [
          summarizeChatSession(createdChat),
          ...currentChats.filter((chat) => chat.id !== createdChat.id),
        ]);
      });
      return createdChat;
    },
    [userEmail]
  );

  const appendMessages = useCallback(
    async (chatId: string, messages: StoredChatMessage[]) => {
      const updatedChat = await chatHistoryRepository.appendMessages(
        chatId,
        messages
      );

      startTransition(() => {
        const updatedSummary = summarizeChatSession(updatedChat);
        setChats((currentChats) => [
          updatedSummary,
          ...currentChats.filter((chat) => chat.id !== chatId),
        ]);
      });
      return updatedChat;
    },
    []
  );

  const deleteChat = useCallback(async (chatId: string) => {
    await chatHistoryRepository.deleteChat(chatId);
    startTransition(() => {
      setChats((currentChats) =>
        currentChats.filter((chat) => chat.id !== chatId)
      );
    });
  }, []);

  useEffect(() => {
    void refreshChats();
  }, [refreshChats]);

  return (
    <ChatHistoryContext.Provider
      value={{
        chats,
        searchQuery,
        hasMore,
        isLoadingChats,
        isLoadingMore,
        error,
        setSearchQuery,
        refreshChats,
        loadMoreChats,
        getChatById,
        createChat,
        appendMessages,
        deleteChat,
      }}
    >
      {children}
    </ChatHistoryContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useChatHistory(): ChatHistoryContextValue {
  const context = useContext(ChatHistoryContext);

  if (context === undefined) {
    throw new Error('useChatHistory must be used within a ChatHistoryProvider');
  }

  return context;
}
