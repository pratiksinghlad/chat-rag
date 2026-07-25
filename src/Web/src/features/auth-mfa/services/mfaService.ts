/**
 * MFA Service
 *
 * Low-level wrappers around the Supabase MFA SDK (`supabase.auth.mfa`).
 * This is the ONLY file in the codebase that is allowed to import and call
 * these APIs directly. All higher layers consume this service.
 *
 * Follows the Single Responsibility Principle — no state, no React, no UI.
 */

import { supabase } from '@/lib/supabase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EnrollTotpResult {
  /** The factor's unique identifier (needed for challenge/verify) */
  factorId: string;
  /** `otpauth://` URI — pass directly to a QR code renderer */
  totpUri: string;
  /** Raw TOTP secret for manual entry in authenticator apps */
  secret: string;
}

export interface AssuranceLevelResult {
  /** The current assurance level for this session ('aal1' | 'aal2') */
  currentLevel: string | null;
  /** The maximum level achievable given enrolled factors */
  nextLevel: string | null;
}

export interface TotpFactor {
  id: string;
  friendly_name?: string;
  factor_type: 'totp';
  status: 'verified' | 'unverified';
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

/**
 * Enroll a new TOTP factor for the currently authenticated user.
 * The returned `totpUri` should be rendered as a QR code.
 * The factor is NOT verified until the user submits their first code.
 */
export async function enrollTotp(): Promise<EnrollTotpResult> {
  // 1. Fetch all factors to find any dangling unverified ones
  try {
    const factors = await listTotpFactors();
    const unverified = factors.filter((f) => f.status === 'unverified');
    for (const factor of unverified) {
      try {
        await unenrollFactor(factor.id);
      } catch (err) {
        console.warn('Failed to unenroll unverified factor:', factor.id, err);
      }
    }
  } catch (err) {
    console.warn('Could not list factors before enrollment:', err);
  }

  // 2. Attempt enrollment with default friendlyName
  let response = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: 'Authenticator App',
    issuer: 'Chat RAG',
  });

  // 3. Fallback: If friendlyName conflict occurs, attempt enrollment without static friendlyName
  if (response.error && response.error.message?.includes('already exists')) {
    response = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      issuer: 'Chat RAG',
    });
  }

  if (response.error) throw response.error;
  if (!response.data) throw new Error('No enrollment data returned from Supabase');

  return {
    factorId: response.data.id,
    totpUri: response.data.totp.uri,
    secret: response.data.totp.secret,
  };
}

/**
 * List all TOTP factors (verified AND unverified) enrolled for the current user.
 * Returns an empty array if none are enrolled.
 */
export async function listTotpFactors(): Promise<TotpFactor[]> {
  const { data, error } = await supabase.auth.mfa.listFactors();

  if (error) throw error;
  if (!data) return [];

  // Note: Supabase's `data.totp` array contains ONLY verified factors.
  // We use `data.all` so we can detect both 'verified' and 'unverified' factors
  // (unverified factors must be cleaned up before re-enrollment).
  const allFactors = (data.all ?? []) as TotpFactor[];
  return allFactors.filter((f) => f.factor_type === 'totp');
}

/**
 * Create a challenge for the given factor.
 * A challenge must be created before a code can be verified.
 * Challenges expire after ~60 seconds.
 */
export async function createChallenge(factorId: string): Promise<string> {
  const { data, error } = await supabase.auth.mfa.challenge({ factorId });

  if (error) throw error;
  if (!data) throw new Error('No challenge data returned from Supabase');

  return data.id;
}

/**
 * Verify a TOTP code against an active challenge.
 * On success, the session's assurance level is upgraded to `aal2`.
 */
export async function verifyChallenge(
  factorId: string,
  challengeId: string,
  code: string
): Promise<void> {
  const { error } = await supabase.auth.mfa.verify({
    factorId,
    challengeId,
    code,
  });

  if (error) throw error;
}

/**
 * Get the current and next achievable assurance levels for this session.
 * `currentLevel === 'aal2'` means 2FA has been verified this session.
 * `nextLevel === 'aal2'` means the user has a TOTP factor enrolled.
 */
export async function getAssuranceLevel(): Promise<AssuranceLevelResult> {
  const { data, error } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (error) throw error;

  return {
    currentLevel: data?.currentLevel ?? null,
    nextLevel: data?.nextLevel ?? null,
  };
}

/**
 * Unenroll (remove) a TOTP factor.
 * Used if the user wants to disable 2FA or re-enroll.
 */
export async function unenrollFactor(factorId: string): Promise<void> {
  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  if (error) throw error;
}
