import type { ChatMode } from '@/types/chat-mode';

export type AIProvider = 'gemini';

export interface ChatHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface RetrievedDocument {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  similarity: number;
}

export interface RagSearchOptions {
  matchThreshold?: number;
  matchCount?: number;
}

export interface ChatRequest {
  message: string;
  history?: ChatHistoryMessage[];
  systemInstruction?: string;
  mode?: ChatMode;
}

export interface ChatResponse {
  text: string;
  provider: AIProvider;
  contextDocuments?: RetrievedDocument[];
  isGrounded: boolean;
}
