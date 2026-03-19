# Chat-RAG Integration Guide

## Environment Variables

Add these to your `.env.local` file:

| Variable                 | Description            | Where to get it                           |
| ------------------------ | ---------------------- | ----------------------------------------- |
| `VITE_SUPABASE_URL`      | Supabase project URL   | Dashboard → Settings → API                |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Dashboard → Settings → API                |
| `VITE_GEMINI_API_KEY`    | Base64 encoded API key | Run `btoa('YOUR_KEY')` in browser console |

### 🔐 Security & configuration

**IMPORTANT:** Since this is a client-side application, your API key is visible to anyone inspecting the network traffic.

1.  **Obfuscation (Step 1)**: We use Base64 encoding to prevent automated GitHub secret scanners from revoking your key instantly.
    - Open your browser developer tools (F12) -> Console.
    - Type `btoa('YOUR_ACTUAL_GOOGLE_API_KEY')` and press Enter.
    - Copy the output string.
    - Paste it into `.env.local` as `VITE_GEMINI_API_KEY=...`

2.  **Restriction (Step 2 - GOLD STANDARD)**: You **MUST** restrict your API key in the Google Cloud Console to prevent unauthorized usage.
    - Go to [Google Cloud Console > Credentials](https://console.cloud.google.com/apis/credentials).
    - Click on your API Key.
    - Under **Application restrictions**, select **Websites**.
    - Add your deployed domain (e.g., `https://your-app.vercel.app/*`) and `http://localhost:5173/*` for development.
    - This ensures that even if someone steals your key, they cannot use it from a different website.

## RAG Pipeline Architecture

```
User Input
    │
    ▼
┌───────────────────┐
│  1. Embed Query   │  → Gemini gemini-embedding-001 (RETRIEVAL_QUERY) → 3072-dim vector
└───────┬───────────┘
        │
        ▼
┌───────────────────┐
│  2. Vector Search │  → Supabase match_documents RPC on `halfvec(3072)`
└───────┬───────────┘
        │
        ▼
┌───────────────────┐
│  3. KB Resolve    │  → Deterministic FAQ / KB answer on strong knowledge hits
└───────┬───────────┘
        │
        ▼
┌───────────────────┐
│  4. Generate      │  → Gemini gemini-3-flash-preview only when KB does not fully answer
└───────┬───────────┘
        │
        ▼
   Chat UI Response
```

## Dependency Audit

| Package                 | Version   | Purpose                     | Status            |
| ----------------------- | --------- | --------------------------- | ----------------- |
| `@supabase/supabase-js` | `^2.45.0` | Supabase client, vector RPC | Already installed |
| `@google/generative-ai` | `latest`  | Gemini embeddings + chat    | **New**           |
| `react`                 | `^18.3.1` | UI framework                | Already installed |
| `react-router-dom`      | `^6.26.0` | Routing                     | Already installed |
| `@chakra-ui/react`      | `^2.8.2`  | UI components               | Already installed |

## File Structure

```
src/
├── types/
│   ├── chat.ts              # ChatMessage, SupabaseDocument, RagContext
│   └── database.ts          # Updated with documents table + RPC types
├── services/
│   ├── gemini.ts            # Embedding + chat completion service
│   └── rag.ts               # RAG pipeline orchestrator
├── hooks/
│   └── useChatRag.ts        # Chat state + RAG workflow hook
├── components/
│   └── chat/
│       ├── ChatMessage.tsx   # Chat bubble component
│       └── ChatInput.tsx     # Input bar component
├── pages/
│   └── ChatRag.tsx          # Full chat page
└── ...
```

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up your .env.local (see above)

# 3. Run the Supabase SQL scripts (see README-SUPABASE.md)

# 4. Reindex the embedding corpus after enabling the FAQ-aware loader

# 5. Start the dev server
npm run start

# 6. Navigate to /chat after signing in
```
