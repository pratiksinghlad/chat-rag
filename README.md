# Chat RAG Web

Bring your docs, ask a question, and let the app do the scavenger hunt.

This repo is a learn-by-building RAG project with a React web app, Supabase auth + vector search, and a Python embedding pipeline. You can run it with a cloud model through Gemini or a local model through Ollama.

## What This Project Does

- Sign users in with Supabase OAuth.
- Save chat history in Postgres.
- Search embedded knowledge-base documents with `pgvector`.
- Answer with your knowledge base first, then fall back to the LLM when needed.

## How It Works

1. A user signs in and opens the chat page.
2. The app embeds the question.
3. Supabase runs `match_documents` to find similar chunks.
4. Strong FAQ-style matches can answer directly.
5. Otherwise, the LLM answers with retrieved context attached.

## Project Structure

```text
chat-rag-web/
|-- README.md
`-- src/
    |-- Web/
    |   |-- src/                    # React + Vite app
    |   |-- public/documents/       # Sample knowledge-base files shown in the UI
    |   |-- README-INTEGRATION.md   # Web app setup
    |   |-- README-EMBEDDINGS.md    # Embeddings + RAG basics
    |   |-- README-SUPABASE.md      # Supabase + pgvector setup
    |   `-- README-PROVIDERS.md     # Cloud vs local vs public AI choices
    `-- EmbeddingPipeline/
        |-- main.py                 # Ingestion entry point
        |-- src/                    # Loaders, splitter, indexing, vector store
        `-- README.md               # Pipeline setup and usage
```

## Main App Pieces

| Area | Main files/components | Job |
| --- | --- | --- |
| Layout | `AppShell`, `Header`, `Sidebar` | App shell, navigation, recent chats |
| Chat UI | `ChatRagPage`, `ChatInput`, `ChatMessage` | Ask questions and render answers |
| Auth | `AuthContext`, `OAuthButton`, `LandingPage` | Sign in with Supabase OAuth |
| Chat history | `ChatHistoryContext`, `repository.ts` | Create, load, search, and delete chats |
| AI + RAG | `factory.ts`, `rag-chat.service.ts`, `vector-search.repository.ts` | Pick provider, retrieve context, generate replies |

## Components And Tools Used

| Layer | Used here |
| --- | --- |
| Frontend | React, TypeScript, Vite, Chakra UI, Framer Motion |
| Auth + data | Supabase Auth, Supabase Postgres |
| Vector DB | Postgres + `pgvector` via Supabase RPC |
| LLM providers | Gemini, Ollama |
| Ingestion pipeline | Python, LangChain, Supabase vector store |

## Choose Your Setup

| If you want... | Pick this | Repo support | Read next |
| --- | --- | --- | --- |
| Fastest cloud demo | Gemini + Supabase | Supported now | [Web integration](src/Web/README-INTEGRATION.md) |
| Local model inference | Ollama + Supabase | Supported now | [Web integration](src/Web/README-INTEGRATION.md) |
| Embeddings and RAG basics | Gemini pipeline + Supabase `documents` | Supported now | [Embeddings guide](src/Web/README-EMBEDDINGS.md) |
| Supabase schema and SQL setup | Auth + chat history + `pgvector` | Supported now | [Supabase guide](src/Web/README-SUPABASE.md) |
| Privacy and provider tradeoffs | Cloud vs local vs public AI | Guide only | [Provider guide](src/Web/README-PROVIDERS.md) |

## Quick Start

### Web app

```bash
cd src/Web
npm install
cp .env.example .env.local
npm start
```

### Embedding pipeline

```bash
cd src/EmbeddingPipeline
uv sync
cp .env.example .env
uv run main.py
```

Use the pipeline when you want to index or re-index documents into Supabase.

## Read More

- [Web integration and provider setup](src/Web/README-INTEGRATION.md)
- [Embeddings and RAG, explained simply](src/Web/README-EMBEDDINGS.md)
- [Supabase and pgvector setup](src/Web/README-SUPABASE.md)
- [Cloud, local, and public AI choices](src/Web/README-PROVIDERS.md)
- [Embedding pipeline guide](src/EmbeddingPipeline/README.md)
