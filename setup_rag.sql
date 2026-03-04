-- =============================================================
-- Supabase pgvector Setup for Chat-RAG
-- Model: text-embedding-004 — natively outputs 768 dimensions
--        (switching from gemini-embedding-001 which defaults to 3072)
-- =============================================================

-- Enable pgvector extension
create extension if not exists vector;

-- 1. NUCLEAR CLEANUP — drop ALL match_documents functions (any dimension)
DO $$ 
DECLARE 
  r RECORD;
BEGIN 
  FOR r IN (
    SELECT oid::regprocedure AS func_signature
    FROM pg_proc 
    WHERE proname = 'match_documents'
  ) 
  LOOP 
    EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE'; 
  END LOOP; 
END $$;

-- Drop old table
DROP TABLE IF EXISTS documents CASCADE;

-- 2. Create Table — 768 dimensions
--    (Gemini MRL allows reducing 3072 → 768 with minimal quality loss)
create table documents (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  metadata jsonb default '{}'::jsonb,
  embedding vector(768),
  created_at timestamptz default now()
);

-- IVFFlat index — works up to 2000 dims (safe for 768)
create index on documents using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- 3. match_documents function — 768 dimensions
create or replace function match_documents (
  query_embedding vector(768),
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

-- 4. Seed Data — 3 documents with 768-dim dummy vectors
insert into documents (content, metadata, embedding)
values
(
  'React is a JavaScript library for building user interfaces. It was created by Facebook (now Meta) and is maintained by Meta and a community of developers. React allows developers to create reusable UI components that manage their own state. Key concepts include JSX, Virtual DOM, component lifecycle, hooks like useState and useEffect, and one-way data binding.',
  '{"topic": "react", "source": "knowledge-base"}'::jsonb,
  (select array_agg(0.1 + (i % 10) * 0.001) from generate_series(1, 768) as s(i))::vector
),
(
  'Supabase is an open source Firebase alternative. It provides a PostgreSQL database, authentication, instant APIs, edge functions, realtime subscriptions, storage, and vector embeddings. Supabase uses Row Level Security (RLS) to protect data. It is built on top of PostgreSQL and supports pgvector for AI and machine learning workloads including semantic search and RAG pipelines.',
  '{"topic": "supabase", "source": "knowledge-base"}'::jsonb,
  (select array_agg(0.5 + (i % 10) * 0.001) from generate_series(1, 768) as s(i))::vector
),
(
  'Gemini is a family of multimodal AI models developed by Google DeepMind. Gemini models can understand and generate text, code, images, audio, and video. The gemini-embedding-001 model supports Matryoshka Representation Learning (MRL) which allows flexible output dimensions: 3072 (default), 1536, or 768. Gemini models are available through Google AI Studio and Vertex AI.',
  '{"topic": "gemini", "source": "knowledge-base"}'::jsonb,
  (select array_agg(0.9 + (i % 10) * 0.001) from generate_series(1, 768) as s(i))::vector
);
