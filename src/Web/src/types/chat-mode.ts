export type ChatMode = 'all' | 'knowledge-base' | 'llm-chat';

export interface ChatModeOption {
  value: ChatMode;
  label: string;
  description: string;
  placeholder: string;
}

export const DEFAULT_CHAT_MODE: ChatMode = 'all';

export const CHAT_MODE_OPTIONS: readonly ChatModeOption[] = [
  {
    value: 'all',
    label: 'All',
    description: 'Use the knowledge base first and let the LLM complete gaps when needed.',
    placeholder: 'Ask anything. We will use your knowledge base and the LLM together.',
  },
  {
    value: 'knowledge-base',
    label: 'Only knowledge base',
    description: 'Answer strictly from retrieved internal knowledge base content.',
    placeholder: 'Ask about something covered in your internal knowledge base.',
  },
  {
    value: 'llm-chat',
    label: 'Only LLM chat',
    description: 'Skip retrieval and chat directly with the LLM.',
    placeholder: 'Ask anything. This will skip internal knowledge base retrieval.',
  },
] as const;
