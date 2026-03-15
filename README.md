# Chat RAG Web

A React + Vite + TypeScript application with Supabase Auth, provider-agnostic AI chat, retrieval-augmented generation, and persisted chat history. Users can authenticate, start a new conversation, resume old conversations by URL, search their own chat history, and continue where they left off.

## Architecture Overview

The app is organized into four main layers:

- `src/context`
  - `AuthContext` manages the authenticated Supabase session.
  - `ChatHistoryContext` manages recent chats, search, pagination, and mutation methods for persisted conversations.
- `src/services/ai`
  - `IChatService` and `IEmbeddingService` define the provider-neutral contract.
  - `Gemini*Service` and `Ollama*Service` implement provider-specific chat and embedding behavior.
  - `factory.ts` selects the active provider from environment variables.
- `src/services/rag`
  - `RagChatService` composes embeddings, Supabase vector search, and the active chat provider.
  - `vector-search.repository.ts` keeps `pgvector` retrieval isolated from the LLM implementation.
- `src/services/chat-history`
  - `SupabaseChatHistoryRepository` handles chat session create/load/append/list operations against the `chat_sessions` table.
  - Message/title helpers convert between persisted JSON and UI-friendly message shapes.

At runtime, the flow is:

1. User opens `/chat` for a new conversation or `/chat/:chatId` for an existing one.
2. The chat page loads persisted messages from `chat_sessions` when `chatId` is present.
3. On the first user message, the app creates a new session and navigates to `/chat/:chatId`.
4. Every user/assistant turn is appended to the `messages` JSONB array.
5. The sidebar shows the current user’s recent chats, supports title search, and pages in groups of 10.

## Environment Variables

Create `.env.local` in the project root:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

VITE_AI_PROVIDER=gemini
VITE_GEMINI_API_KEY=your-gemini-key
VITE_GEMINI_CHAT_MODEL=gemini-3-flash-preview
VITE_GEMINI_EMBEDDING_MODEL=gemini-embedding-001

VITE_OLLAMA_BASE_URL=http://localhost:11434
VITE_OLLAMA_CHAT_MODEL=llama3.2
VITE_OLLAMA_EMBEDDING_MODEL=nomic-embed-text
```

Use `.env.example` as the starter template.

## Supabase SQL Setup

Run the following SQL in the Supabase SQL editor to create the persisted chat history table, indexes, and row-level security policies:

```sql
create extension if not exists pg_trgm;

create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  "createdBy" text not null,
  title text not null,
  "creationDate" timestamptz not null default now(),
  "lastActivityDate" timestamptz not null default now(),
  messages jsonb not null default '[]'::jsonb,
  constraint chat_sessions_messages_is_array
    check (jsonb_typeof(messages) = 'array')
);

create index if not exists chat_sessions_createdBy_lastActivityDate_idx
  on public.chat_sessions ("createdBy", "lastActivityDate" desc);

create index if not exists chat_sessions_title_trgm_idx
  on public.chat_sessions
  using gin (title gin_trgm_ops);

alter table public.chat_sessions enable row level security;

drop policy if exists "chat_sessions_select_own" on public.chat_sessions;
create policy "chat_sessions_select_own"
  on public.chat_sessions
  for select
  using ("createdBy" = auth.jwt() ->> 'email');

drop policy if exists "chat_sessions_insert_own" on public.chat_sessions;
create policy "chat_sessions_insert_own"
  on public.chat_sessions
  for insert
  with check ("createdBy" = auth.jwt() ->> 'email');

drop policy if exists "chat_sessions_update_own" on public.chat_sessions;
create policy "chat_sessions_update_own"
  on public.chat_sessions
  for update
  using ("createdBy" = auth.jwt() ->> 'email')
  with check ("createdBy" = auth.jwt() ->> 'email');

drop policy if exists "chat_sessions_delete_own" on public.chat_sessions;
create policy "chat_sessions_delete_own"
  on public.chat_sessions
  for delete
  using ("createdBy" = auth.jwt() ->> 'email');
```

## Chat History Behavior

- The first user prompt creates a new row in `chat_sessions`.
- The chat title is generated locally from the first prompt by trimming whitespace and capping the length.
- `messages` stores the ordered conversation as JSONB:
  - `{ id, role, content, timestamp }`
- Existing chats are resumed by loading `/chat/:chatId`.
- The sidebar fetches the current user’s recent chats ordered by `"lastActivityDate"` descending.
- Title search is case-insensitive, and “Load more” fetches the next 10 chats.
- Users can only access their own chats through Supabase RLS on `"createdBy"`.

## Running Locally

```bash
npm install
npm run lint
npm run build
npm start
```

The app runs on `http://localhost:5173` by default.

## Notes

- Chat history requires authenticated users with an email claim.
- The warning beneath the chat input is intentional: prompts are sent to a cloud or local LLM provider depending on your selected configuration.
- The SQL above assumes your Supabase/Postgres version supports `uuid` as requested.
