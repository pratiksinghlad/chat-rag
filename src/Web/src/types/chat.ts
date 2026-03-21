import type { ChatMode } from '@/services/ai/chat-mode';
import type { RetrievedDocument } from '@/services/ai/types';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'error';
  content: string;
  timestamp: Date;
  isGrounded?: boolean;
  mode?: ChatMode;
}

export type ChatContextDocument = RetrievedDocument;
