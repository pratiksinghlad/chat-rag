/**
 * Two-Factor Authentication Context
 *
 * Provides the MFA state machine for the application.
 * This is the authoritative source of truth for the user's 2FA status.
 *
 * Responsibilities:
 *  - Determine current MFA status on each session change
 *  - Expose enroll / challenge+verify actions
 *  - Keep track of the enrolled factorId for subsequent logins
 *
 * Non-responsibilities (deliberately excluded):
 *  - Rendering any UI
 *  - Business / domain logic
 *  - Direct Supabase SDK calls (delegated to mfaService)
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { supabase } from '@/lib/supabase';
import {
  enrollTotp,
  listTotpFactors,
  createChallenge,
  verifyChallenge,
  getAssuranceLevel,
  unenrollFactor,
  type EnrollTotpResult,
} from '../services/mfaService';

// ---------------------------------------------------------------------------
// Status type
// ---------------------------------------------------------------------------

/**
 * The four possible MFA states a session can be in:
 *
 * - `loading`              — initial check in progress
 * - `unenrolled`           — user has no TOTP factor; show enrollment screen
 * - `enrolled_unverified`  — factor exists but session is only aal1; show challenge screen
 * - `verified`             — session is aal2; render protected content
 */
export type MFAStatus =
  | 'loading'
  | 'unenrolled'
  | 'enrolled_unverified'
  | 'verified';

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

export interface TwoFactorContextValue {
  /** Current MFA status for the authenticated user's session */
  status: MFAStatus;
  /** The enrolled factor's ID (available after enrollment or when factor exists) */
  factorId: string | null;
  /** Any MFA-related error */
  error: Error | null;

  /**
   * Initiate TOTP enrollment for the current user.
   * Returns enrollment data (totpUri + secret) for rendering a QR code.
   */
  beginEnrollment: () => Promise<EnrollTotpResult>;

  /**
   * Verify the first TOTP code during enrollment.
   * On success, the factor is confirmed and the session upgrades to aal2.
   */
  verifyEnrollment: (factorId: string, code: string) => Promise<void>;

  /**
   * Create a challenge then verify a TOTP code.
   * Used on subsequent logins where the factor is already enrolled.
   */
  challengeAndVerify: (code: string) => Promise<void>;

  /** Clear any stored MFA error */
  clearError: () => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const TwoFactorContext = createContext<TwoFactorContextValue | undefined>(
  undefined
);



// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface TwoFactorProviderProps {
  children: ReactNode;
}

export function TwoFactorProvider({ children }: TwoFactorProviderProps) {
  const [status, setStatus] = useState<MFAStatus>('loading');
  const [factorId, setFactorId] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Guard against state updates after unmount
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Core: resolve MFA status from the current session
  // ---------------------------------------------------------------------------

  const resolveMFAStatus = useCallback(async () => {
    if (!isMounted.current) return;
    setStatus('loading');
    setError(null);

    try {
      // 1. Check if the user has an active session at all
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // No session → not our concern; LandingPage / AuthContext handles redirect
      if (!session) {
        if (isMounted.current) setStatus('unenrolled');
        return;
      }

      // 2. Check enrolled factors
      const factors = await listTotpFactors();
      const verifiedFactor = factors.find((f) => f.status === 'verified');

      if (!verifiedFactor) {
        // CRITICAL FIX: Actually unenroll dangling unverified factors.
        // Without this, enrollTotp() will fail on the next attempt because
        // Supabase finds the existing pending factor and may reject a new one.
        const unverifiedFactors = factors.filter((f) => f.status === 'unverified');
        for (const f of unverifiedFactors) {
          try {
            await unenrollFactor(f.id);
            console.log('[TwoFactorContext] Cleaned up unverified factor:', f.id);
          } catch (cleanupErr) {
            // Non-fatal: log and continue
            console.warn('[TwoFactorContext] Could not clean up factor:', cleanupErr);
          }
        }

        if (isMounted.current) {
          setFactorId(null);
          setStatus('unenrolled');
        }
        return;
      }

      if (isMounted.current) setFactorId(verifiedFactor.id);

      // 3. Check the current assurance level
      const { currentLevel } = await getAssuranceLevel();

      if (isMounted.current) {
        setStatus(currentLevel === 'aal2' ? 'verified' : 'enrolled_unverified');
      }
    } catch (err) {
      console.error('[TwoFactorContext] Failed to resolve MFA status:', err);
      if (isMounted.current) {
        setError(
          err instanceof Error ? err : new Error('Failed to check 2FA status')
        );
        // Fail open → show enrollment so user can re-enroll if needed
        setStatus('unenrolled');
      }
    }
  }, []);

  // ---------------------------------------------------------------------------
  // React to auth state changes (login, token refresh, logout)
  // ---------------------------------------------------------------------------

  useEffect(() => {
    // Run immediately on mount (handles page refresh with existing session)
    resolveMFAStatus();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      // SIGNED_IN fires after:
      //   a) Fresh OAuth login (redirect back from provider)
      //   b) Session restored after cookie/token expiry + new login
      // In both cases we re-check the full MFA status.
      // We deliberately do NOT re-check on TOKEN_REFRESHED — that would flash
      // the user back to 'loading' mid-session while they are already aal2.
      if (event === 'SIGNED_IN') {
        resolveMFAStatus();
      }

      // On sign-out, reset to clean state so the next login starts fresh
      if (event === 'SIGNED_OUT') {
        if (isMounted.current) {
          setStatus('unenrolled');
          setFactorId(null);
          setError(null);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [resolveMFAStatus]);

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  const beginEnrollment = useCallback(async (): Promise<EnrollTotpResult> => {
    setError(null);
    try {
      // Proactively clean up any unverified factors before enrolling.
      // This prevents Supabase from returning a stale factor or rejecting the call.
      const existing = await listTotpFactors();
      const unverified = existing.filter((f) => f.status === 'unverified');
      for (const f of unverified) {
        try { await unenrollFactor(f.id); } catch { /* ignore */ }
      }

      const result = await enrollTotp();
      if (isMounted.current) setFactorId(result.factorId);
      return result;
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error('Failed to begin enrollment');
      if (isMounted.current) setError(error);
      throw error;
    }
  }, []);

  const verifyEnrollment = useCallback(
    async (enrolledFactorId: string, code: string): Promise<void> => {
      setError(null);
      try {
        // During enrollment, challenge and verify in one logical step
        const challengeId = await createChallenge(enrolledFactorId);
        await verifyChallenge(enrolledFactorId, challengeId, code);
        // Upgrade status immediately — don't wait for the auth state change event
        if (isMounted.current) {
          setFactorId(enrolledFactorId);
          setStatus('verified');
        }
      } catch (err) {
        const error =
          err instanceof Error
            ? err
            : new Error('Verification failed. Please try again.');
        if (isMounted.current) setError(error);
        throw error;
      }
    },
    []
  );

  const challengeAndVerify = useCallback(
    async (code: string): Promise<void> => {
      setError(null);
      if (!factorId) {
        const err = new Error('No enrolled 2FA factor found.');
        setError(err);
        throw err;
      }
      try {
        const challengeId = await createChallenge(factorId);
        await verifyChallenge(factorId, challengeId, code);
        if (isMounted.current) setStatus('verified');
      } catch (err) {
        const error =
          err instanceof Error
            ? err
            : new Error('Invalid code. Please try again.');
        if (isMounted.current) setError(error);
        throw error;
      }
    },
    [factorId]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const value: TwoFactorContextValue = {
    status,
    factorId,
    error,
    beginEnrollment,
    verifyEnrollment,
    challengeAndVerify,
    clearError,
  };

  return (
    <TwoFactorContext.Provider value={value}>
      {children}
    </TwoFactorContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Internal context accessor (used by the hook — not exported for direct use)
// ---------------------------------------------------------------------------
// eslint-disable-next-line react-refresh/only-export-components
export function useTwoFactorContext(): TwoFactorContextValue {
  const context = useContext(TwoFactorContext);
  if (context === undefined) {
    throw new Error(
      'useTwoFactorContext must be used within a TwoFactorProvider'
    );
  }
  return context;
}

export default TwoFactorContext;


