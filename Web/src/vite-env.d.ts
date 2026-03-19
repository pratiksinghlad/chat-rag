/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_AI_PROVIDER?: 'gemini' | 'ollama';
  readonly VITE_GEMINI_API_KEY?: string;
  readonly VITE_GEMINI_CHAT_MODEL?: string;
  readonly VITE_GEMINI_EMBEDDING_MODEL?: string;
  readonly VITE_OLLAMA_BASE_URL?: string;
  readonly VITE_OLLAMA_CHAT_MODEL?: string;
  readonly VITE_OLLAMA_EMBEDDING_MODEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
