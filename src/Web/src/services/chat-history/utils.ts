import type { ChatHistoryMessage } from '@/services/ai/types';
import type {
  ChatSessionDetail,
  ChatSessionSummary,
  StoredChatMessage,
} from '@/services/chat-history/types';
import type { ChatMessage } from '@/types/chat';

const CHAT_TITLE_MAX_LENGTH = 60;

export function createStoredChatMessage(
  role: StoredChatMessage['role'],
  content: string,
  isGrounded?: boolean,
  mode?: StoredChatMessage['mode']
): StoredChatMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    timestamp: new Date().toISOString(),
    isGrounded,
    mode,
  };
}

export function buildChatTitle(message: string): string {
  const normalized = message.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return 'Untitled chat';
  }

  if (normalized.length <= CHAT_TITLE_MAX_LENGTH) {
    return normalized;
  }

  return `${normalized.slice(0, CHAT_TITLE_MAX_LENGTH - 1).trimEnd()}…`;
}

export function toUiMessages(messages: StoredChatMessage[]): ChatMessage[] {
  return messages.map((message) => ({
    id: message.id,
    role: message.role,
    content: message.content,
    timestamp: new Date(message.timestamp),
    isGrounded: message.isGrounded,
    mode: message.mode,
  }));
}

export function toConversationHistory(
  messages: StoredChatMessage[]
): ChatHistoryMessage[] {
  return messages.flatMap((message) => {
    if (message.role !== 'user' && message.role !== 'assistant') {
      return [];
    }

    return [
      {
        role: message.role,
        content: message.content,
      },
    ];
  });
}

export function summarizeChatSession(
  chat: Pick<
    ChatSessionDetail,
    'id' | 'title' | 'createdBy' | 'creationDate' | 'lastActivityDate' | 'messages'
  >
): ChatSessionSummary {
  return {
    id: chat.id,
    title: chat.title,
    createdBy: chat.createdBy,
    creationDate: chat.creationDate,
    lastActivityDate: chat.lastActivityDate,
    messageCount: chat.messages.length,
  };
}
