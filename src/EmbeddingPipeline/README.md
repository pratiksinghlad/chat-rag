# Embedding Pipeline

Incremental document ingestion for a RAG system using Gemini embeddings, LangChain, and Supabase pgvector.

Current repo setup: this pipeline uses Gemini embeddings and writes chunks into the Supabase `documents` table consumed by the web app.

## What it does

- Loads supported files from `data/documents`
- Splits them into chunks
- Generates Gemini embeddings through the Google REST API
- Upserts chunks into the Supabase `documents` table
- Uses LangChain incremental indexing so unchanged chunks are skipped and removed source files are cleaned up
- Indexes structured FAQ JSON as one clean question/answer record per entry

The pipeline keeps the existing Supabase schema unchanged. `documents.id` remains a `uuid`.

## Supported runtime

- Python `3.13`
- `uv` for environment and command execution

Python 3.14 currently emits upstream LangChain/Pydantic warnings, so this project targets 3.13 for a clean run.

## Project layout

```text
EmbeddingPipeline/
|-- main.py
|-- pyproject.toml
|-- .env.example
|-- data/documents/
|-- logs/
|-- src/
|   |-- config/
|   |-- embeddings/
|   |-- indexing/
|   |-- loaders/
|   |-- transformers/
|   `-- vectorstore/
`-- tests/
```

## Setup

```bash
cd src/EmbeddingPipeline
uv sync
```

Create `.env` from `.env.example` and set:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`

## Database requirements

The pipeline expects a Supabase table named `documents` with a UUID primary key:

```sql
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  metadata jsonb default '{}'::jsonb,
  embedding halfvec(3072),
  created_at timestamptz default now()
);
```

It also expects the `match_documents` function used by the frontend:

```sql
create or replace function match_documents(
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
language plpgsql
as $$
begin
  return query
  select
    documents.id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where 1 - (documents.embedding <=> query_embedding) > match_threshold
  order by documents.embedding <=> query_embedding
  limit match_count;
end;
$$;
```

## First run after this fix

This version uses deterministic UUID-compatible document IDs for incremental indexing.

If you have old pipeline data from the broken indexing flow, do a one-time reset before the first run:

1. Clear the `documents` table in Supabase.
2. Delete `data/record_manager.db`.
3. Run the pipeline again.

That gives you a clean transition to the new `supabase/documents_v2` record-manager namespace.

## Run the pipeline

```bash
uv run main.py
```

Run it a second time without changing files and unchanged chunks should be skipped.

## Configuration

These settings are supported:

| Variable                    | Default                            | Purpose                                   |
| --------------------------- | ---------------------------------- | ----------------------------------------- |
| `SUPABASE_URL`              | required                           | Supabase project URL                      |
| `SUPABASE_SERVICE_ROLE_KEY` | required                           | Service role key                          |
| `GEMINI_API_KEY`            | required                           | Gemini API key                            |
| `EMBEDDING_MODEL`           | `gemini-embedding-001`             | Embedding model                           |
| `EMBEDDING_DIMENSIONS`      | `3072`                             | Expected vector size                      |
| `CHUNK_SIZE`                | `1000`                             | Max characters per chunk                  |
| `CHUNK_OVERLAP`             | `200`                              | Overlap between chunks                    |
| `DATA_DIR`                  | `data/documents`                   | Input directory                           |
| `RECORD_MANAGER_DB_URL`     | `sqlite:///data/record_manager.db` | Local incremental index store             |
| `RECORD_MANAGER_NAMESPACE`  | `supabase/documents_v2`            | Cache namespace for this pipeline version |
| `LOG_LEVEL`                 | `INFO`                             | Logging level                             |

Removed configuration:

- `DOCUMENTS_CONTENT_COLUMN`
- `DOCUMENTS_METADATA_COLUMN`
- `DOCUMENTS_EMBEDDING_COLUMN`

Those values are not supported by the installed LangChain `SupabaseVectorStore`, and this pipeline assumes the standard `documents` table shape shown above.

## Supported file types

- `.pdf`
- `.txt`
- `.md`
- `.csv`
- `.json` (`entries[]` FAQ payloads are indexed entry-by-entry; other JSON falls back to plain text)
- `.log`
- `.rst`

## Verification

```bash
uv run python -m unittest
uv run python -m compileall src main.py
uv build
```
