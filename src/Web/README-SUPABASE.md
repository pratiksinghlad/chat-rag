# Supabase + pgvector Setup

Supabase does three jobs in this project: user auth, chat history storage, and vector search.

**Vector DB pg**: Postgres stores embeddings through the `pgvector` extension. Supabase lets the app query those vectors with SQL and RPC functions.

## Environment Variables

### For the web app

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### For the embedding pipeline

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

The web app uses the public anon key. The pipeline needs the service role key because it writes embeddings into `documents`.

## 1. Chat History Schema

Run this in the Supabase SQL editor to create `chat_sessions` and the search index used by the sidebar:

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

## 2. Vector Search Schema

Run this to create the `documents` table and `match_documents` RPC used by the RAG flow:

```sql
create extension if not exists vector;

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  metadata jsonb default '{}'::jsonb,
  embedding halfvec(3072),
  created_at timestamptz default now()
);

create index if not exists documents_embedding_hnsw_idx
  on public.documents using hnsw (embedding halfvec_cosine_ops);

create or replace function public.match_documents (
  query_embedding halfvec(3072),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
language sql stable
as $$
  select
    documents.id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) as similarity
  from public.documents
  where 1 - (documents.embedding <=> query_embedding) > match_threshold
  order by documents.embedding <=> query_embedding
  limit match_count;
$$;
```

The current app expects `halfvec(3072)` because the ingestion pipeline uses Gemini `gemini-embedding-001`.

## 3. Helper SQL Files In This Repo

- [`setup_rag_text_embedding.sql`](./setup_rag_text_embedding.sql): Full dev bootstrap for `documents` and `match_documents`, plus sample vector rows. Use with care because it drops and recreates the `documents` table.
- [`seed_data.sql`](./seed_data.sql): Inserts generated sample project docs after the vector schema already exists. Good for demos and testing.

If you want the safest path, create the schema manually first, then use the helper files only on development data.

## 4. What Connects To What

| Piece | Used by |
| --- | --- |
| `chat_sessions` | Authenticated chat history in the web app |
| `documents` | Embedded knowledge-base chunks |
| `match_documents` | Vector search during chat |
| RLS policies | Prevent users from reading each other's chat history |

## 5. After Setup

1. Start the web app from `src/Web`.
2. Run the embedding pipeline from `src/EmbeddingPipeline`.
3. Open `/chat` and ask questions against your indexed data.

## Related Docs

- [Web integration setup](./README-INTEGRATION.md)
- [Embeddings and RAG basics](./README-EMBEDDINGS.md)
- [Embedding pipeline guide](../EmbeddingPipeline/README.md)
