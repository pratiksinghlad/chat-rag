import type { RetrievedDocument } from '@/services/ai/types';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'error';
  content: string;
  timestamp: Date;
  isGrounded?: boolean;
}

export type ChatContextDocument = RetrievedDocument;
