/**
 * Database Types
 *
 * This file contains TypeScript types for the Supabase database.
 * In a production app, you would generate these types using:
 * npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      chat_sessions: {
        Row: {
          id: string;
          createdBy: string;
          title: string;
          creationDate: string;
          lastActivityDate: string;
          messages: Json;
        };
        Insert: {
          id?: string;
          createdBy: string;
          title: string;
          creationDate?: string;
          lastActivityDate?: string;
          messages?: Json;
        };
        Update: {
          createdBy?: string;
          title?: string;
          creationDate?: string;
          lastActivityDate?: string;
          messages?: Json;
        };
        Relationships: [];
      };
      documents: {
        Row: {
          id: string;
          content: string;
          metadata: Record<string, string>;
          embedding: number[];
          created_at: string;
        };
        Insert: {
          id?: string;
          content: string;
          metadata?: Record<string, string>;
          embedding: number[];
          created_at?: string;
        };
        Update: {
          content?: string;
          metadata?: Record<string, string>;
          embedding?: number[];
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      match_documents: {
        Args: {
          query_embedding: number[];
          match_threshold: number;
          match_count: number;
        };
        Returns: {
          id: string;
          content: string;
          metadata: Record<string, string>;
          similarity: number;
        }[];
      };
    };
    Enums: Record<string, never>;
  };
}
