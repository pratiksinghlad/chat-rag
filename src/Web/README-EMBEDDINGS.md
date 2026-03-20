# Embeddings And RAG, In Plain English

This project uses embeddings to find useful knowledge-base chunks before the model answers. That is the heart of retrieval-augmented generation, or RAG.

## Tiny Glossary

- **Embedding**: A list of numbers that captures the meaning of text, not just the exact words.
- **RAG**: A pattern where the app retrieves relevant documents first, then gives them to the LLM while answering.
- **Query embedding**: The vector made from the user's question so the database can search by meaning.
- **Document embedding**: The vector stored for each chunk of your knowledge base so similar questions can find it later.
- **Similarity score**: A number showing how closely two embeddings point in the same semantic direction.
- **Chunking**: Splitting big documents into smaller pieces so retrieval stays focused and useful.

## Current Pipeline In This Repo

```text
Documents
  -> split into chunks
  -> create embeddings
  -> store in Supabase `documents`
  -> embed the user query
  -> search with `match_documents`
  -> rerank results
  -> answer from KB or LLM
```

## What Happens Here Specifically

1. The Python pipeline reads supported files and splits them into chunks.
2. The pipeline currently uses Gemini `gemini-embedding-001` for document embeddings.
3. Each chunk is stored in Supabase `documents` with a `halfvec(3072)` embedding.
4. At chat time, the web app embeds the user question with the active provider.
5. Supabase returns similar chunks through the `match_documents` RPC.
6. Strong FAQ-like matches can answer directly; otherwise the LLM writes the final response.

## Why A Single Keyword Might Score Around `0.60`

Embeddings compare meaning, not exact string matches, so a short query like `React` is compared with the meaning of a full paragraph. A score around `0.60` to `0.70` is often a strong semantic match, not a bad result.

## Simple Score Guide

| Score | Usually means |
| --- | --- |
| `0.75+` | Very close match or near-duplicate wording |
| `0.60 - 0.74` | Strong semantic match and often good enough for RAG |
| `Below 0.50` | Broader or weaker relation |

The web app currently searches with:

- `matchThreshold = 0.60`
- `matchCount = 5`

That keeps retrieval fairly strict while still letting relevant KB chunks through.

## Related Docs

- [Web integration setup](./README-INTEGRATION.md)
- [Supabase and pgvector setup](./README-SUPABASE.md)
- [Embedding pipeline guide](../EmbeddingPipeline/README.md)
