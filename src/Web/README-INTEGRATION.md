# Web App Integration Guide

This is the setup guide for the React app in `src/Web`.

The app uses Supabase for auth, chat history, and vector search. It uses one AI provider at a time for chat plus query embeddings: Gemini for cloud, or Ollama for local inference.

## Supported Providers Today

| Provider | Type | What it does in this repo |
| --- | --- | --- |
| Gemini | Managed cloud | Chat responses and query embeddings in the browser |
| Ollama | Local runtime | Chat responses and query embeddings from your local machine |

The ingestion pipeline in [`../EmbeddingPipeline/README.md`](../EmbeddingPipeline/README.md) currently uses Gemini embeddings when indexing documents.

## Install And Run

```bash
cd src/Web
npm install
cp .env.example .env.local
npm start
```

Useful extras:

```bash
npm run lint
npm run build
```

## Minimal Environment Setup

The app reads these values from `.env.local`.

### Option 1: Gemini

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

VITE_AI_PROVIDER=gemini
VITE_GEMINI_API_KEY=your-gemini-key
VITE_GEMINI_CHAT_MODEL=gemini-3-flash-preview
VITE_GEMINI_EMBEDDING_MODEL=gemini-embedding-001
```

Notes:

- `VITE_GEMINI_API_KEY` can be raw or Base64-encoded. The app accepts both, but raw is simpler.
- Because this is a browser app, restrict your Gemini key to allowed origins before shipping.

### Option 2: Ollama

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

VITE_AI_PROVIDER=ollama
VITE_OLLAMA_BASE_URL=http://localhost:11434
VITE_OLLAMA_CHAT_MODEL=llama3.2
VITE_OLLAMA_EMBEDDING_MODEL=nomic-embed-text
```

Before starting the app, make sure Ollama is running and the models are available:

```bash
ollama pull llama3.2
ollama pull nomic-embed-text
ollama serve
```

## Chat Modes

| Mode | What it means |
| --- | --- |
| `All` | Search the knowledge base first, then let the LLM fill gaps if needed. |
| `Only knowledge base` | Answer only from retrieved knowledge-base content. |
| `Only LLM chat` | Skip retrieval and talk directly to the selected model. |

## Current Runtime Flow

1. The user sends a message from `ChatInput`.
2. The active provider creates a query embedding.
3. Supabase runs `match_documents` against the `documents` table.
4. The app reranks the matches and checks for strong FAQ-style hits.
5. If the KB fully answers, it returns a grounded response.
6. Otherwise, the provider generates a final reply with retrieved context attached.

## Good To Know

- The provider is selected by `VITE_AI_PROVIDER`, so only one provider is active at a time.
- Chat history lives in Supabase `chat_sessions`, not in the model provider.
- Local Ollama keeps model inference local, but your data is still in Supabase unless you also host storage privately.

## Related Docs

- [Embeddings and RAG basics](./README-EMBEDDINGS.md)
- [Supabase and pgvector setup](./README-SUPABASE.md)
- [Provider and privacy choices](./README-PROVIDERS.md)
