import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, SupabaseClient, User } from "npm:@supabase/supabase-js";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";

// --- Configuration ---
const DOCUMENT_MATCH_POLICY = {
  minimumSimilarity: 0.6,
  minimumLexicalCoverage: 0.5,
  lexicalWeight: 0.05,
} as const;

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'can', 'company', 'do', 'for', 'how', 'i', 'in', 'is', 'it', 'me', 'my', 'of', 'on', 'or', 'our', 'please', 'tell', 'the', 'to', 'us', 'we', 'what', 'with', 'you', 'your'
]);

// --- ENV RESOLVERS (Survival for manual renames) ---
function getSupabaseUrl() {
  return Deno.env.get("SUPABASE_URL") || Deno.env.get("SB_URL");
}
function getSupabaseAnonKey() {
  return Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SB_ANON_KEY");
}
function getSupabaseServiceKey() {
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SB_SERVICE_ROLE_KEY") || Deno.env.get("SB_ANON_KEY");
}

// --- Singletons ---
let genAIInstance: GoogleGenerativeAI | null = null;
function getGenAI(): GoogleGenerativeAI {
  if (!genAIInstance) {
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey) throw new Error("Missing GEMINI_API_KEY.");
    genAIInstance = new GoogleGenerativeAI(geminiKey);
  }
  return genAIInstance;
}

let supabaseAdminInstance: SupabaseClient | null = null;
function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdminInstance) {
    const url = getSupabaseUrl();
    const key = getSupabaseServiceKey();
    if (!url || !key) throw new Error("Missing Supabase URL or Service Key.");
    supabaseAdminInstance = createClient(url, key);
  }
  return supabaseAdminInstance;
}

// --- Auth Middleware ---
async function verifyUser(req: Request): Promise<User> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    console.error("[Auth] Missing Authorization header");
    throw new Error('Unauthorized: Missing Authorization header');
  }

  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  
  if (!url || !anonKey) {
    console.error("[Auth] Missing SUPABASE_URL or SUPABASE_ANON_KEY secrets");
    throw new Error("Missing Supabase configuration secrets.");
  }

  // Debug JWT segments
  const token = authHeader.replace(/^Bearer\s+/, "");
  const segments = token.split('.');
  console.log(`[Auth] Token Length: ${token.length}, Segments: ${segments.length}`);

  const supabase = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    console.error(`[Auth] Verification failed: ${error?.message || 'Invalid Token'}`);
    throw new Error(`Unauthorized: ${error?.message || 'Invalid user token'}`);
  }

  return user;
}

// --- NLP Utilities ---
function tokenize(value: string): Set<string> {
  const matches = value.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  return new Set(matches.map(normalizeToken).filter(t => t.length > 1 && !STOP_WORDS.has(t)));
}

function normalizeToken(token: string): string {
  if (token.length <= 3) return token;
  if (token.endsWith('ies') && token.length > 4) return `${token.slice(0, -3)}y`;
  if (token.endsWith('ing') && token.length > 5) return token.slice(0, -3);
  if (token.endsWith('ed') && token.length > 4) return token.slice(0, -2);
  if (token.endsWith('es') && token.length > 4) return token.slice(0, -2);
  if (token.endsWith('s') && token.length > 3) return token.slice(0, -1);
  return token;
}

function getQueryCoverage(queryTerms: Set<string>, candidateTerms: Set<string>): number {
  if (queryTerms.size === 0 || candidateTerms.size === 0) return 0;
  let matched = 0;
  for (const t of queryTerms) if (candidateTerms.has(t)) matched++;
  return matched / queryTerms.size;
}

function buildSearchTerms(content: string, metadata: any): Set<string> {
  const metaValues = ['question', 'answer', 'category', 'tags', 'title', 'heading', 'section', 'summary', 'keywords']
    .flatMap(f => { const v = metadata?.[f]; return typeof v === 'string' ? [v] : (Array.isArray(v) ? v : []); })
    .join(' ');
  return tokenize(`${content} ${metaValues}`);
}

// --- Main Handler ---
Deno.serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const json = await req.json().catch(() => ({}));
    const { action, body } = json;

    // PUBLIC ACTION: HEALTH CHECK
    if (action === 'health-check') {
      console.log("[AI-Proxy] Health check received.");
      return new Response(JSON.stringify({ status: 'ok', time: new Date().toISOString() }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // AUTH REQUIRED
    const user = await verifyUser(req);
    console.log(`[AI-Proxy] User confirmed: ${user.email}`);

    const genAI = getGenAI();
    const supabaseAdmin = getSupabaseAdmin();

    if (action === 'rag-chat') {
      const { message, history: rawHistory, mode, systemInstruction } = body || {};
      const chatMode = mode || 'all';
      console.log(`[AI-Proxy] RAG Chat triggered for mode: ${chatMode}.`);
      
      const isLlmOnly = chatMode === 'llm-chat';
      let retrievedDocs: any[] = [];
      let strongMatch: any = null;
      let hasGoodMatch = false;

      // 1. Embedding & Search
      if (!isLlmOnly) {
        let embedding;
        try {
          const embedModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
          const embedRes = await embedModel.embedContent(message);
          embedding = embedRes.embedding.values;
        } catch (e: any) {
          throw new Error(`Embedding failed: ${e.message}`);
        }
        
        const { data: documents, error: searchError } = await supabaseAdmin.rpc('match_documents', {
          query_embedding: embedding,
          match_threshold: DOCUMENT_MATCH_POLICY.minimumSimilarity - 0.1,
          match_count: 10,
        });

        if (searchError) throw searchError;

        const queryTerms = tokenize(message);
        const rankedDocs = (documents || []).map((doc: any) => {
          const lexicalCoverage = getQueryCoverage(queryTerms, buildSearchTerms(doc.content, doc.metadata || {}));
          const isStrongMatch = doc.similarity >= DOCUMENT_MATCH_POLICY.minimumSimilarity && lexicalCoverage >= DOCUMENT_MATCH_POLICY.minimumLexicalCoverage;
          return { ...doc, lexicalCoverage, rerankScore: doc.similarity + lexicalCoverage * DOCUMENT_MATCH_POLICY.lexicalWeight, isStrongMatch };
        }).sort((a: any, b: any) => b.rerankScore - a.rerankScore);

        retrievedDocs = rankedDocs.map((d: any) => ({ id: String(d.id), content: d.content, metadata: d.metadata || {}, similarity: d.similarity }));
        strongMatch = rankedDocs.find((d: any) => d.isStrongMatch);
        hasGoodMatch = rankedDocs.some((d: any) => d.similarity >= DOCUMENT_MATCH_POLICY.minimumSimilarity);
      }

      // Early Knowledge Base Overrides (FAQ Matching)
      if (chatMode === 'knowledge-base' || chatMode === 'all') {
        if (strongMatch && strongMatch.metadata?.document_type === 'faq') {
           const answer = strongMatch.metadata?.answer || strongMatch.content;
           console.log("[AI-Proxy] Returning deterministic FAQ match.");
           return new Response(JSON.stringify({ text: answer, contextDocuments: retrievedDocs, isGrounded: true }), 
             { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
      }

      if (chatMode === 'knowledge-base') {
        if (!hasGoodMatch) {
          console.log("[AI-Proxy] No good match found in KB mode. Returning fallback.");
          return new Response(JSON.stringify({ 
            text: "No data exists in the knowledge base for the question you asked.", 
            contextDocuments: retrievedDocs, 
            isGrounded: false 
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
      }

      // 2. System Instructions & LLM Grounding Phase
      let finalSystemInstruction = systemInstruction;
      let isGrounded = false;
      
      const contextText = retrievedDocs.slice(0, 5).map((d: any, i: number) => `[Document ${i+1}] (similarity: ${d.similarity.toFixed(3)})\n${d.content}`).join('\n\n');

      if (isLlmOnly) {
         finalSystemInstruction = finalSystemInstruction || [
           'You are a helpful AI assistant.',
           'Answer the user question accurately using your general knowledge.',
           'Be concise and professional.'
         ].join('\n');
      } else if (chatMode === 'knowledge-base') {
         finalSystemInstruction = [
           'You are a highly precise AI assistant. Your primary goal is to answer the user question using ONLY the provided retrieved context below.',
           'STRICT RULES:',
           '1. Use the "RETRIEVED CONTEXT" section to answer.',
           '2. If the answer is not explicitly contained within the context, state: "No data exists in the knowledge base for the question you asked."',
           '3. Do not invent facts or use your internal knowledge to supplement missing information.',
           '4. Maintain a professional and helpful tone.',
           '',
           '--- RETRIEVED CONTEXT ---',
           contextText,
           '--- END RETRIEVED CONTEXT ---',
         ].join('\n');
         isGrounded = !!strongMatch; // Strict grounding for KB mode
      } else {
         // mode === 'all'
         if (retrievedDocs.length > 0) {
           finalSystemInstruction = [
             'You are a helpful AI assistant.',
             'Use the retrieved context as the primary source whenever it is relevant to the user question.',
             'If the retrieved context is incomplete, you may use general knowledge to provide a helpful answer.',
             'Do not contradict the retrieved context.',
             'If part of the answer is based on general knowledge rather than the retrieved context, make that distinction clear in the response when appropriate.',
             'Be concise and professional.',
             '',
             '--- RETRIEVED CONTEXT ---',
             contextText,
             '--- END RETRIEVED CONTEXT ---',
           ].join('\n');
           // Grounding in 'all' mode now requires a strong lexical match AND similarity >= 0.6
           isGrounded = !!strongMatch; 
         } else {
           finalSystemInstruction = [
             'You are a helpful AI assistant.',
             'Answer the user question accurately using your general knowledge.',
             'Be concise and professional.'
           ].join('\n');
         }
      }

      const chatModel = genAI.getGenerativeModel({ 
        model: "gemini-3-flash-preview", 
        systemInstruction: finalSystemInstruction 
      });

      // Sanitize history
      const history = Array.isArray(rawHistory) ? rawHistory.map((h: any) => ({
        role: h.role === 'assistant' ? 'model' : h.role,
        parts: Array.isArray(h.parts) ? h.parts : [{ text: String(h.parts || h.text || '') }]
      })) : [];

      let result;
      try {
        const chat = chatModel.startChat({ history });
        result = await chat.sendMessage(message);
      } catch (e: any) {
        throw new Error(`Generation failed: ${e.message}`);
      }
      
      const responseText = result.response.text();
      
      // 3. Final Grounding Decision
      // Even if we had context, if the LLM says it couldn't find the answer in that context, we aren't grounded.
      const fallbackPhrases = [
        "No data exists in the knowledge base"
      ];
      
      const isActuallyGrounded = isGrounded && !fallbackPhrases.some(phrase => 
        responseText.toLowerCase().includes(phrase.toLowerCase())
      );
      
      return new Response(JSON.stringify({ 
        text: responseText, 
        contextDocuments: retrievedDocs, 
        isGrounded: isActuallyGrounded,
        mode: chatMode
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'embed') {
      const { text, model: modelName } = body || {};
      try {
        const model = genAI.getGenerativeModel({ model: modelName || "gemini-embedding-001" });
        const res = await model.embedContent(text);
        return new Response(JSON.stringify({ embedding: res.embedding.values }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (e: any) {
        throw new Error(`Standalone Embedding failed: ${e.message}`);
      }
    }

    throw new Error(`Unsupported action: ${action}`);

  } catch (err: any) {
    const isAuth = err.message.startsWith('Unauthorized:');
    console.error(`[AI-Proxy Error] ${err.message}`);
    return new Response(JSON.stringify({ error: err.message }), {
      status: isAuth ? 401 : 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
