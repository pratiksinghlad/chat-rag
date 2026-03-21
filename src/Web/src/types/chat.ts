import type { ChatMode } from '@/types/chat-mode';
import type { RetrievedDocument } from '@/types/ai';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'error';
  content: string;
  timestamp: Date;
  isGrounded?: boolean;
  mode?: ChatMode;
}

export type ChatContextDocument = RetrievedDocument;
