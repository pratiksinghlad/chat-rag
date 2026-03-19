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
  embedding halfvec(3072),
  created_at timestamptz default now()
);

create index on documents using hnsw (embedding halfvec_cosine_ops);
```

> `gemini-embedding-001` returns 3072 dimensions by default, and the current app expects `halfvec(3072)` end to end.

## 3. Create the `match_documents` RPC Function

```sql
create or replace function match_documents (
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
  from documents
  where 1 - (documents.embedding <=> query_embedding) > match_threshold
  order by documents.embedding <=> query_embedding
  limit match_count;
$$;
```

Use Gemini `RETRIEVAL_DOCUMENT` for ingested documents and Gemini `RETRIEVAL_QUERY` for browser-side search queries.

## 4. Insert Sample Documents

```sql
insert into documents (content, metadata, embedding)
values
(
  'React is a JavaScript library for building user interfaces. It was created by Facebook (now Meta). Key concepts include JSX, Virtual DOM, hooks like useState and useEffect, and one-way data binding.',
  '{"topic": "react", "source": "knowledge-base"}'::jsonb,
  (select array_agg(0.1 + (i % 10) * 0.001) from generate_series(1, 3072) as s(i))::halfvec
),
(
  'Supabase is an open source Firebase alternative. It provides a PostgreSQL database, authentication, instant APIs, edge functions, realtime subscriptions, storage, and vector embeddings via pgvector.',
  '{"topic": "supabase", "source": "knowledge-base"}'::jsonb,
  (select array_agg(0.5 + (i % 10) * 0.001) from generate_series(1, 3072) as s(i))::halfvec
),
(
  'Gemini is a family of multimodal AI models developed by Google DeepMind. The embedding model gemini-embedding-001 produces 3072-dimensional vectors by default.',
  '{"topic": "gemini", "source": "knowledge-base"}'::jsonb,
  (select array_agg(0.9 + (i % 10) * 0.001) from generate_series(1, 3072) as s(i))::halfvec
);
```

## 5. Quick Test

```sql
select * from match_documents(
  (select array_agg(0.1 + (i % 10) * 0.001) from generate_series(1, 3072) as s(i))::halfvec,
  0.0,
  5
);
```

This should return all 3 documents. If you get `[]`, make sure you ran the schema successfully first.

## 6. One-Time Reset After the FAQ Loader Fix

If `faq.json` was previously indexed as raw text, do this once:

1. `delete from public.documents;`
2. Remove `EmbeddingPipeline/data/record_manager.db`
3. Re-run the embedding pipeline

After reindexing, FAQ rows should appear as individual records:

```sql
select
  metadata->>'document_type' as document_type,
  metadata->>'faq_id' as faq_id,
  metadata->>'question' as question
from public.documents
where metadata->>'document_type' = 'faq';
```
