# Supabase Setup for Chat-RAG (pgvector)

This guide walks through setting up the Supabase vector store for the RAG pipeline.

## 1. Enable pgvector Extension

Open the **SQL Editor** in your Supabase Dashboard and run:

```sql
create extension if not exists vector;
```

## 2. Create the `documents` Table

```sql
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  metadata jsonb default '{}'::jsonb,
  embedding vector(3072),
  created_at timestamptz default now()
);

-- HNSW index for fast similarity search
create index on documents using hnsw (embedding vector_cosine_ops);
```

> **Why 3072 dimensions?** The `gemini-embedding-001` model outputs 3072-dimensional vectors by default. It supports Matryoshka Representation Learning allowing reduction to 1536 or 768, but 3072 provides the highest quality.

## 3. Create the `match_documents` RPC Function

```sql
create or replace function match_documents (
  query_embedding vector(3072),
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
  from documents
  where 1 - (documents.embedding <=> query_embedding) > match_threshold
  order by documents.embedding <=> query_embedding
  limit match_count;
$$;
```

## 4. Insert Sample Documents

```sql
insert into documents (content, metadata, embedding)
values
(
  'React is a JavaScript library for building user interfaces. It was created by Facebook (now Meta). Key concepts include JSX, Virtual DOM, hooks like useState and useEffect, and one-way data binding.',
  '{"topic": "react", "source": "knowledge-base"}'::jsonb,
  (select array_agg(0.1 + (i % 10) * 0.001) from generate_series(1, 3072) as s(i))::vector
),
(
  'Supabase is an open source Firebase alternative. It provides a PostgreSQL database, authentication, instant APIs, edge functions, realtime subscriptions, storage, and vector embeddings via pgvector.',
  '{"topic": "supabase", "source": "knowledge-base"}'::jsonb,
  (select array_agg(0.5 + (i % 10) * 0.001) from generate_series(1, 3072) as s(i))::vector
),
(
  'Gemini is a family of multimodal AI models developed by Google DeepMind. The embedding model gemini-embedding-001 produces 3072-dimensional vectors by default.',
  '{"topic": "gemini", "source": "knowledge-base"}'::jsonb,
  (select array_agg(0.9 + (i % 10) * 0.001) from generate_series(1, 3072) as s(i))::vector
);
```

## 5. Quick Test

You can test the function directly in the SQL Editor:

```sql
-- Use match_threshold = 0.0 when testing with dummy seed data.
-- Dummy vectors (~0.1 uniform) have near-zero cosine similarity with
-- real Gemini embeddings, so a threshold of 0.5 will return nothing.
select * from match_documents(
  (select array_agg(0.1 + (i % 10) * 0.001) from generate_series(1, 768) as s(i))::vector,
  0.0,  -- threshold: 0.0 returns everything
  5
);
```

This should return all 3 documents. If you get `[]`, make sure you ran `setup_rag.sql` successfully first.

> **Why empty results with real Gemini embeddings?**
> The seed data uses dummy vectors (`0.1, 0.1, ...`). Their cosine similarity against a real Gemini embedding is near zero — well below the default 0.5 threshold. The app code now uses `MATCH_THRESHOLD: 0.0` so all documents are returned during testing. Once you populate the DB with **real** Gemini-generated embeddings, raise the threshold back to `0.3`–`0.5`.
