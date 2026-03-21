/**
 * Authentication Context
 *
 * Provides authentication state and methods throughout the application.
 * Handles OAuth sign-in, sign-out, and session management.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { User, Session, AuthChangeEvent } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import {
  type OAuthProvider,
  type AuthContextValue,
  type UserProfile,
  extractUserProfile,
} from "@/types/auth";

// Create context with undefined default (will be checked in useAuth hook)
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Initialize auth state on mount
   * - Check for existing session
   * - Set up auth state change listener
   */
  useEffect(() => {
    // Get initial session
    const initAuth = async () => {
      try {
        const {
          data: { session: initialSession },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        setSession(initialSession);
        setUser(initialSession?.user ?? null);
      } catch (err) {
        console.error("Error initializing auth:", err);
        setError(
          err instanceof Error ? err : new Error("Failed to initialize auth"),
        );
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, currentSession: Session | null) => {
        console.log("Auth state changed:", event);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setError(null);

        // Handle specific events
        if (event === "SIGNED_OUT") {
          setUser(null);
          setSession(null);
        }
      },
    );

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Sign in with OAuth provider
   * Redirects to provider's login page
   */
  const signInWithOAuth = useCallback(async (provider: OAuthProvider) => {
    setError(null);
    setIsLoading(true);

    try {
      // Map provider names to Supabase provider identifiers
      const providerMap: Record<OAuthProvider, "google" | "github" | "azure"> =
        {
          google: "google",
          github: "github",
          azure: "azure", // Microsoft Azure AD
        };

      // Construct redirect URL carefully to avoid double slashes
      const origin = window.location.origin.replace(/\/$/, "");
      const base = import.meta.env.BASE_URL.replace(/\/$/, "");
      const redirectUrl = `${origin}${base}/`;

      console.log("--- OAuth Debug ---");
      console.log("Origin:", origin);
      console.log("Base URL:", base);
      console.log("Final Redirect URL:", redirectUrl);
      console.log("--------------------");

      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: providerMap[provider],
        options: {
          // Redirect back to the app after OAuth (handles subpaths like /chat-rag/)
          redirectTo: redirectUrl,
          // Request additional scopes for user info
          scopes: provider === "google" ? "email profile" : undefined,
        },
      });

      if (signInError) {
        throw signInError;
      }
    } catch (err) {
      console.error("OAuth sign-in error:", err);
      setError(err instanceof Error ? err : new Error("Failed to sign in"));
      setIsLoading(false);
    }
  }, []);

  /**
   * Sign out the current user
   */
  const signOut = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        throw signOutError;
      }

      setUser(null);
      setSession(null);
    } catch (err) {
      console.error("Sign-out error:", err);
      setError(err instanceof Error ? err : new Error("Failed to sign out"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get the user's profile from metadata
   */
  const getUserProfile = useCallback((): UserProfile | null => {
    return extractUserProfile(user);
  }, [user]);

  const value: AuthContextValue = {
    user,
    session,
    isLoading,
    error,
    signInWithOAuth,
    signOut,
    getUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access authentication context
 * @throws Error if used outside AuthProvider
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}

export default AuthContext;
