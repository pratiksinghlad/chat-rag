/**
 * Auth Types
 *
 * TypeScript interfaces for authentication-related data.
 * These types ensure type safety when working with user data.
 */

import type { User, Session } from '@supabase/supabase-js';

/**
 * OAuth providers supported by the application
 */
export type OAuthProvider = 'google' | 'github' | 'azure';

/**
 * Extended user profile information extracted from OAuth providers
 */
export interface UserProfile {
  /** User's unique identifier */
  id: string;
  /** User's email address */
  email: string;
  /** User's full name (may be null if not provided by OAuth) */
  fullName: string | null;
  /** URL to user's avatar/profile picture */
  avatarUrl: string | null;
  /** OAuth provider used for authentication */
  provider: string | null;
  /** When the user was created */
  createdAt: string | null;
  /** When the user last signed in */
  lastSignInAt: string | null;
}

/**
 * Authentication context state
 */
export interface AuthState {
  /** Current authenticated user */
  user: User | null;
  /** Current session */
  session: Session | null;
  /** Whether auth state is being loaded */
  isLoading: boolean;
  /** Any authentication error */
  error: Error | null;
}

/**
 * Authentication context methods
 */
export interface AuthContextValue extends AuthState {
  /** Sign in with an OAuth provider */
  signInWithOAuth: (provider: OAuthProvider) => Promise<void>;
  /** Sign out the current user */
  signOut: () => Promise<void>;
  /** Get the user's profile information */
  getUserProfile: () => UserProfile | null;
}

/**
 * Extract user profile from Supabase User object
 * Handles different metadata structures from various OAuth providers
 */
export function extractUserProfile(user: User | null): UserProfile | null {
  if (!user) return null;

  const metadata = user.user_metadata || {};
  const appMetadata = user.app_metadata || {};

  return {
    id: user.id,
    email: user.email || '',
    fullName:
      metadata.full_name ||
      metadata.name ||
      metadata.preferred_username ||
      null,
    avatarUrl:
      metadata.avatar_url ||
      metadata.picture ||
      null,
    provider: appMetadata.provider || null,
    createdAt: user.created_at || null,
    lastSignInAt: user.last_sign_in_at || null,
  };
}
