/**
 * Gemini AI Service
 *
 * Handles both embeddings (vectorization) and chat completions
 * using the @google/generative-ai SDK.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { RAG_CONFIG } from '@/types/chat';

const encodedKey = import.meta.env.VITE_GEMINI_API_KEY;

// Simple decoding; in a real app, you might use a more robust obfuscation library,
// but for client-side keys, the main goal is to avoid automated scrapers/scanners.
const apiKey = encodedKey ? atob(encodedKey) : '';

if (!apiKey) {
  console.warn(
    'Missing VITE_GEMINI_API_KEY. Chat-RAG features will not work. See README-INTEGRATION.md.'
  );
}

// Lazily initialized — safe even when API key is missing at import time
let genAI: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!apiKey) {
    throw new Error(
      'VITE_GEMINI_API_KEY is not set (or invalid base64). Add the base64 encoded key to your .env.local file.'
    );
  }
  if (!genAI) {
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

/**
 * Generate a 3072-dimension embedding vector for the given text.
 * Uses `gemini-embedding-001` which natively outputs 3072 dims —
 * matches vector(3072) or halfvec(3072) in Supabase.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const model = getClient().getGenerativeModel(
    { model: RAG_CONFIG.EMBEDDING_MODEL },
    { apiVersion: 'v1beta' }
  );

  const result = await model.embedContent(text);
  return result.embedding.values;
}

/**
 * Generate a chat response using `gemini-3-flash-preview` with RAG context injected
 * into the system prompt. Returns the full text response.
 */
export async function generateChatResponse(
  userMessage: string,
  ragContext: string
): Promise<string> {
  const model = getClient().getGenerativeModel(
    {
      model: RAG_CONFIG.CHAT_MODEL,
      systemInstruction: buildSystemPrompt(ragContext),
    },
    { apiVersion: 'v1beta' }
  );

  const result = await model.generateContent(userMessage);
  const response = result.response;
  const text = response.text();

  if (!text) {
    throw new Error('Gemini returned an empty response.');
  }

  return text;
}

/** Build the system prompt that injects retrieved context */
function buildSystemPrompt(context: string): string {
  if (!context) {
    return [
      'You are a helpful AI assistant.',
      'Answer the user\'s question to the best of your ability.',
      'If you don\'t know the answer, say so honestly.',
    ].join('\n');
  }

  return [
    'You are a helpful AI assistant with access to a knowledge base.',
    'Use the following retrieved context to answer the user\'s question.',
    'If the context does not contain relevant information, say so and answer based on your general knowledge.',
    'Always cite which part of the context you used when applicable.',
    '',
    '--- RETRIEVED CONTEXT ---',
    context,
    '--- END CONTEXT ---',
  ].join('\n');
}
