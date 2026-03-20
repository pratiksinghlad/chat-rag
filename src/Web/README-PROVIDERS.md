# AI Provider And Privacy Guide

This guide helps you choose between cloud AI, local AI, and public shared AI.

Important: this repo currently integrates **Gemini** and **Ollama**. The other products below are examples for decision-making, not claims of built-in support.

## Quick Terms

- **Cloud provider LLM**: A hosted model from a vendor such as Google, Azure, or AWS. You get managed infrastructure and less ops work.
- **Local LLM with Ollama**: A model that runs on your own machine or private server. You control inference, hardware, and runtime access.
- **Public shared AI**: Consumer chat apps with the lowest setup friction. Great for learning, but usually the worst fit for sensitive data.

## Decision Table

| Priority | Setup Type | Data Privacy Guarantee | Examples | Best For |
| --- | --- | --- | --- | --- |
| Speed + Privacy + Security | Managed Cloud (private or ZDR options) | Usually strong, but only if your plan includes controls like ZDR, private networking, or contractual isolation. | Azure OpenAI on private networking, Amazon Bedrock, Google Vertex AI | Enterprises, legal, healthcare, teams needing managed ops |
| Absolute Privacy + Control | Local LLM Hosting | Data can stay inside your hardware or private infrastructure, but only if storage and deployment are private too. | Ollama + AnythingLLM, vLLM on private servers, NVIDIA NIM | Privacy-focused teams, government, proprietary R&D |
| Low Cost + Speed | Public Shared AI | Data handling varies by product and plan, so treat these as non-sensitive by default. | ChatGPT Free or Plus, Claude consumer tiers, Gemini consumer tiers | Individuals, students, low-risk creative work |

## What That Means In This Repo

| Choice | Model inference | Data storage | Good fit |
| --- | --- | --- | --- |
| Gemini + hosted Supabase | Cloud | Hosted Supabase | Fastest managed demo |
| Ollama + hosted Supabase | Local model | Hosted Supabase | Local inference with simple setup |
| Ollama + private storage | Local or private infra | Private database and hosting | Strongest control, highest ops work |

**Reality check**: running Ollama locally does **not** make the whole stack private if your docs, chat history, or vectors still live in a hosted database.

## Quick Setup Notes

### Gemini

- Best when you want a fast cloud setup and minimal local hardware work.
- In this repo, set `VITE_AI_PROVIDER=gemini` in `src/Web/.env.local`.

### Ollama

- Best when you want local model inference and full control over the running model.
- In this repo, install Ollama, pull your chat and embedding models, then set `VITE_AI_PROVIDER=ollama`.

```bash
ollama pull llama3.2
ollama pull nomic-embed-text
ollama serve
```

### Public Shared AI

- Useful for learning and quick experiments outside this repo.
- Not wired into this project, and not recommended for sensitive documents.

## When To Pick What

- Pick **Gemini** when you want the quickest path to a working cloud demo.
- Pick **Ollama** when you want local inference or cannot rely on cloud models.
- Pick **public shared AI** only for low-risk experimentation, not for production document chat.

## Related Docs

- [Web integration setup](./README-INTEGRATION.md)
- [Supabase and pgvector setup](./README-SUPABASE.md)
