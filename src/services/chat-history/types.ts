export interface StoredChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'error';
  content: string;
  timestamp: string;
  isGrounded?: boolean;
}

export interface ChatSessionSummary {
  id: string;
  title: string;
  createdBy: string;
  creationDate: string;
  lastActivityDate: string;
  messageCount: number;
}

export interface ChatSessionDetail extends ChatSessionSummary {
  messages: StoredChatMessage[];
}

export interface ChatSessionListResult {
  chats: ChatSessionSummary[];
  hasMore: boolean;
}

export interface ListChatsInput {
  search?: string;
  limit: number;
  offset: number;
}

export interface CreateChatInput {
  createdBy: string;
  title: string;
  firstMessage: StoredChatMessage;
}

export interface ChatHistoryRepository {
  listChats(input: ListChatsInput): Promise<ChatSessionListResult>;
  getChatById(chatId: string): Promise<ChatSessionDetail | null>;
  createChat(input: CreateChatInput): Promise<ChatSessionDetail>;
  appendMessages(
    chatId: string,
    messages: StoredChatMessage[]
  ): Promise<ChatSessionDetail>;
  deleteChat(chatId: string): Promise<void>;
}
