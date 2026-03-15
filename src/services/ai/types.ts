export type AIProvider = 'gemini' | 'ollama';

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
}

export interface ChatResponse {
  text: string;
  provider: AIProvider;
  contextDocuments?: RetrievedDocument[];
  isGrounded: boolean;
}

export interface IChatService {
  getChatResponse(input: ChatRequest): Promise<ChatResponse>;
}

export interface IEmbeddingService {
  createEmbedding(input: string | string[]): Promise<number[][]>;
}
