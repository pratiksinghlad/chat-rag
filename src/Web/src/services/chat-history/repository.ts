import { supabase } from '@/lib/supabase';
import { ChatHistoryError } from '@/services/chat-history/errors';
import type {
  ChatHistoryRepository,
  ChatSessionDetail,
  ChatSessionListResult,
  CreateChatInput,
  ListChatsInput,
  StoredChatMessage,
} from '@/services/chat-history/types';
import type { Json } from '@/types/database';

export class SupabaseChatHistoryRepository implements ChatHistoryRepository {
  async listChats(input: ListChatsInput): Promise<ChatSessionListResult> {
    const limit = input.limit;
    const upperBound = input.offset + limit;
    let query = supabase
      .from('chat_sessions')
      .select('id, title, createdBy, creationDate, lastActivityDate, messages')
      .order('lastActivityDate', { ascending: false })
      .range(input.offset, upperBound);

    const trimmedSearch = input.search?.trim();
    if (trimmedSearch) {
      query = query.ilike('title', `%${trimmedSearch}%`);
    }

    const { data, error } = await query;

    if (error) {
      throw new ChatHistoryError('Failed to load chat history.', {
        cause: error,
      });
    }

    const rows = (data ?? []).map(mapChatSessionRow);
    return {
      chats: rows.slice(0, limit).map((row) => ({
        id: row.id,
        title: row.title,
        createdBy: row.createdBy,
        creationDate: row.creationDate,
        lastActivityDate: row.lastActivityDate,
        messageCount: row.messages.length,
      })),
      hasMore: rows.length > limit,
    };
  }

  async getChatById(chatId: string): Promise<ChatSessionDetail | null> {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('id', chatId)
      .maybeSingle();

    if (error) {
      throw new ChatHistoryError('Failed to load the selected chat.', {
        cause: error,
      });
    }

    return data ? mapChatSessionRow(data) : null;
  }

  async createChat(input: CreateChatInput): Promise<ChatSessionDetail> {
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({
        createdBy: input.createdBy,
        title: input.title,
        messages: toMessagesJson([input.firstMessage]),
      })
      .select('*')
      .single();

    if (error) {
      throw new ChatHistoryError('Failed to create a new chat.', {
        cause: error,
      });
    }

    return mapChatSessionRow(data);
  }

  async appendMessages(
    chatId: string,
    messages: StoredChatMessage[]
  ): Promise<ChatSessionDetail> {
    const existingChat = await this.getChatById(chatId);

    if (!existingChat) {
      throw new ChatHistoryError('The selected chat no longer exists.');
    }

    const nextMessages = [...existingChat.messages, ...messages];
    const { data, error } = await supabase
      .from('chat_sessions')
      .update({
        messages: toMessagesJson(nextMessages),
        lastActivityDate: new Date().toISOString(),
      })
      .eq('id', chatId)
      .select('*')
      .single();

    if (error) {
      throw new ChatHistoryError('Failed to update the chat session.', {
        cause: error,
      });
    }

    return mapChatSessionRow(data);
  }

  async deleteChat(chatId: string): Promise<void> {
    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', chatId);

    if (error) {
      throw new ChatHistoryError('Failed to delete the chat session.', {
        cause: error,
      });
    }
  }
}

function mapChatSessionRow(row: {
  id: string;
  title: string;
  createdBy: string;
  creationDate: string;
  lastActivityDate: string;
  messages: unknown;
}): ChatSessionDetail {
  const messages = parseMessages(row.messages);

  return {
    id: row.id,
    title: row.title,
    createdBy: row.createdBy,
    creationDate: row.creationDate,
    lastActivityDate: row.lastActivityDate,
    messages,
    messageCount: messages.length,
  };
}

function parseMessages(value: unknown): StoredChatMessage[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') {
      return [];
    }

    const candidate = entry as Partial<StoredChatMessage>;
    if (
      typeof candidate.id !== 'string' ||
      typeof candidate.content !== 'string' ||
      typeof candidate.timestamp !== 'string' ||
      (candidate.role !== 'user' &&
        candidate.role !== 'assistant' &&
        candidate.role !== 'error')
    ) {
      return [];
    }

    return [
      {
        id: candidate.id,
        role: candidate.role,
        content: candidate.content,
        timestamp: candidate.timestamp,
        isGrounded:
          typeof candidate.isGrounded === 'boolean'
            ? candidate.isGrounded
            : undefined,
      },
    ];
  });
}

function toMessagesJson(messages: StoredChatMessage[]): Json {
  return messages as unknown as Json;
}
