# Supabase 2FA (TOTP) Setup Guide

This document provides a concise overview of how 2FA (Two-Factor Authentication / TOTP) is integrated into our application using Supabase Auth.

---

## 1. Supabase Dashboard Setup

1. Go to your **Supabase Dashboard** -> **Authentication** -> **MFA**.
2. Enable **App Authenticator (TOTP)**.
3. Set your preferred **Enforcement Level**:
   - Optional / Mandatory per application policy.

---

## 2. Architecture & Codebase Setup

Our application implements a dedicated MFA feature module under `src/features/auth-mfa/`:

- **[mfaService.ts](file:///d:/Code/UI/chat-rag-web/src/Web/src/features/auth-mfa/services/mfaService.ts)**: Thin service wrapper around Supabase Auth MFA methods (`enroll`, `challenge`, `verify`, `unenroll`, `listFactors`, `getAssuranceLevel`).
- **[TwoFactorContext.tsx](file:///d:/Code/UI/chat-rag-web/src/Web/src/features/auth-mfa/context/TwoFactorContext.tsx)**: React Context providing the global `MFAStatus` state machine (`loading`, `unenrolled`, `enrolled_unverified`, `verified`).
- **[useTwoFactor.ts](file:///d:/Code/UI/chat-rag-web/src/Web/src/features/auth-mfa/hooks/useTwoFactor.ts)**: Hook to consume 2FA context state and actions.
- **[MFAVerificationModal.tsx](file:///d:/Code/UI/chat-rag-web/src/Web/src/features/auth-mfa/components/MFAVerificationModal.tsx)** & **[MFAEnrollmentModal.tsx](file:///d:/Code/UI/chat-rag-web/src/Web/src/features/auth-mfa/components/MFAEnrollmentModal.tsx)**: Reusable UI modals for code challenge verification and initial QR setup.

---

## 3. How 2FA Flow Works in Our App

1. **User Login (`aal1`)**:
   User signs in with Email/Password or OAuth. Supabase assigns Authenticated Assurance Level 1 (`aal1`).
2. **Assurance Level Check**:
   `TwoFactorContext` calls `getAssuranceLevel()`:
   - If user has NO TOTP enrolled $\rightarrow$ `unenrolled`
   - If TOTP is enrolled but session is `aal1` $\rightarrow$ `enrolled_unverified` (Prompts challenge modal)
   - If TOTP is verified and session is `aal2` $\rightarrow$ `verified` (Access granted)
3. **Enrollment Flow**:
   - Calls `enrollTotp()` to generate `qr_code` (SVG data URI) and `secret`.
   - User scans QR code with Authenticator app (e.g. Google Authenticator, 1Password, Bitwarden).
   - User submits 6-digit code $\rightarrow$ `createChallenge()` + `verifyChallenge()` $\rightarrow$ Session upgrades to `aal2`.
4. **Challenge / Verification Flow**:
   - User inputs 6-digit TOTP code.
   - App calls `createChallenge({ factorId })` followed by `verifyChallenge()`.
   - On success, Supabase updates session to `aal2`.

---

## 4. Testing & Local Setup

- Ensure `.env` includes valid Supabase environment variables:
  ```env
  VITE_SUPABASE_URL=https://your-project.supabase.co
  VITE_SUPABASE_ANON_KEY=your-anon-key
  ```
- Run the dev server: `npm run dev` inside `src/Web`.
- Log in and verify MFA prompts or navigate to account settings to trigger enrollment/verification.
