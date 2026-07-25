/**
 * useTwoFactorAuth Hook
 *
 * The clean public API for consuming 2FA state and actions in components.
 * Domain components should import this hook — never the context directly.
 *
 * Follows the Clean Architecture convention of a thin adapter layer:
 * components → hook → context → service → Supabase SDK
 */

import { useTwoFactorContext } from '../context/TwoFactorContext';
import type { TwoFactorContextValue, MFAStatus } from '../context/TwoFactorContext';

export type { MFAStatus };
export type { TwoFactorContextValue as TwoFactorAuth };

/**
 * Access 2FA state and actions.
 *
 * @throws Error if called outside `<TwoFactorProvider>`
 *
 * @example
 * const { status, challengeAndVerify } = useTwoFactorAuth();
 */
export function useTwoFactorAuth(): TwoFactorContextValue {
  return useTwoFactorContext();
}

export default useTwoFactorAuth;
