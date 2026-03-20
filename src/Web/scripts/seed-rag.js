/**
 * Gemini SQL Generator — Specifically seeds the 3 example docs with REAL embeddings.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

dotenv.config({ path: path.join(rootDir, '.env.local') });

const apiKey = process.env.VITE_GEMINI_API_KEY ? Buffer.from(process.env.VITE_GEMINI_API_KEY, 'base64').toString('utf8') : '';

if (!apiKey) {
  console.error('❌ Error: VITE_GEMINI_API_KEY missing in .env.local');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' }, { apiVersion: 'v1beta' });

const EXAMPLES = [
  {
    topic: 'react',
    content: 'React is a JavaScript library for building user interfaces. It was created by Facebook (now Meta) and is maintained by Meta and a community of developers. React allows developers to create reusable UI components that manage their own state. Key concepts include JSX, Virtual DOM, component lifecycle, hooks like useState and useEffect, and one-way data binding.'
  },
  {
    topic: 'supabase',
    content: 'Supabase is an open source Firebase alternative. It provides a PostgreSQL database, authentication, instant APIs, edge functions, realtime subscriptions, storage, and vector embeddings. Supabase uses Row Level Security (RLS) to protect data. It is built on top of PostgreSQL and supports pgvector for AI and machine learning workloads including semantic search and RAG pipelines.'
  },
  {
    topic: 'gemini',
    content: 'Gemini is a family of multimodal AI models developed by Google DeepMind. Gemini models can understand and generate text, code, images, audio, and video. The gemini-embedding-001 model supports Matryoshka Representation Learning (MRL) which allows flexible output dimensions: 3072 (default), 1536, or 768. Gemini models are available through Google AI Studio and Vertex AI.'
  }
];

async function generate() {
  console.log('🚀 Generating setup_rag_text_embedding.sql with REAL embeddings...');
  
  // 1. Read the schema part
  const schemaPath = path.join(rootDir, 'setup_rag.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8').split('-- 4. Seed Data')[0];

  let sql = schema + '-- 4. REAL SEED DATA (Generated via Gemini)\n';
  sql += 'insert into documents (content, metadata, embedding)\nvalues\n';

  const rowStrings = [];

  for (const item of EXAMPLES) {
    console.log(`📄 Embedding ${item.topic}...`);
    try {
      const result = await model.embedContent(item.content);
      const vector = `[${result.embedding.values.join(',')}]`;
      const metadata = JSON.stringify({ topic: item.topic, source: 'knowledge-base' });
      const escapedContent = item.content.replace(/'/g, "''");
      
      rowStrings.push(`(\n  '${escapedContent}',\n  '${metadata}'::jsonb,\n  '${vector}'::halfvec\n)`);
      console.log(`✅ Success: ${item.topic}`);
    } catch (err) {
      console.error(`❌ Error embedding ${item.topic}:`, err.message);
    }
  }

  sql += rowStrings.join(',\n') + ';\n';
  
  const outputPath = path.join(rootDir, 'setup_rag_text_embedding.sql');
  fs.writeFileSync(outputPath, sql);
  
  console.log(`\n✨ Successfully created: ${outputPath}`);
  console.log('👉 Use this ONE file in Supabase SQL Editor to setup everything with REAL 3072-dim vectors.');
}

generate();
