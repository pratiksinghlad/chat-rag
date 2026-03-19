/**
 * Supabase Client Configuration
 *
 * This file initializes the Supabase client using public environment variables.
 *
 * Security Notes:
 * - VITE_SUPABASE_URL: Public by design, safe for client-side use
 * - VITE_SUPABASE_ANON_KEY: Public API key with Row Level Security (RLS) enabled
 *   This key is safe to expose in client bundles as RLS policies control data access
 * - SUPABASE_SERVICE_ROLE_KEY: NEVER expose this key client-side!
 *   Use only in serverless functions or backend services
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl) {
  throw new Error(
    'Missing VITE_SUPABASE_URL environment variable. Please check your .env.local file.'
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_ANON_KEY environment variable. Please check your .env.local file.'
  );
}

// Create Supabase client with type-safe database schema
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persist session in localStorage
    persistSession: true,
    // Auto-refresh tokens before expiry
    autoRefreshToken: true,
    // Detect session from URL (for OAuth redirects)
    detectSessionInUrl: true,
    // Storage key for session
    storageKey: 'sso-app-auth',
  },
});

export default supabase;
