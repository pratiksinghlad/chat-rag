/**
 * RequireTwoFactor
 *
 * Route guard / interceptor component.
 *
 * This is the ONLY entry point where the 2FA status affects rendering.
 * Protected pages wrapped in this component are completely unaware of 2FA.
 *
 * Rendering logic:
 *   loading              → full-screen spinner
 *   unenrolled           → <MFAEnrollmentModal> (blocks the route)
 *   enrolled_unverified  → <MFAChallengeModal> (blocks the route)
 *   verified             → renders {children} (full access)
 *
 * Note: Modals are overlaid rather than navigating to a separate route.
 * This avoids URL flicker, preserves the intended destination, and keeps
 * 2FA state management fully isolated from the router.
 */

import type { ReactNode } from 'react';
import { Flex, Spinner, Text, VStack } from '@chakra-ui/react';
import { useTwoFactorAuth } from '../hooks/useTwoFactorAuth';
import { MFAEnrollmentModal } from './MFAEnrollmentModal';
import { MFAChallengeModal } from './MFAChallengeModal';
import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';

interface RequireTwoFactorProps {
  children: ReactNode;
}

export function RequireTwoFactor({ children }: RequireTwoFactorProps) {
  const { user, isLoading: authLoading } = useAuth();
  const { status } = useTwoFactorAuth();

  // 1. Auth is still initializing — wait for it
  if (authLoading) {
    return <FullScreenLoader message="Checking session..." />;
  }

  // 2. No authenticated user → redirect to landing (handled by AuthContext flow)
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // 3. MFA status is loading — brief spinner while resolving AAL
  if (status === 'loading') {
    return <FullScreenLoader message="Verifying security level..." />;
  }

  // 4. Not enrolled → show enrollment modal overlaid on the (invisible) page
  if (status === 'unenrolled') {
    return (
      <>
        {/* Children are intentionally not rendered while unverified */}
        <MFAEnrollmentModal />
      </>
    );
  }

  // 5. Enrolled but session not yet at aal2 → show challenge modal
  if (status === 'enrolled_unverified') {
    return (
      <>
        {/* Children are intentionally not rendered while unverified */}
        <MFAChallengeModal />
      </>
    );
  }

  // 6. Verified (aal2) → render protected content
  return <>{children}</>;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function FullScreenLoader({ message }: { message: string }) {
  return (
    <Flex minH="100vh" align="center" justify="center" bg="white">
      <VStack spacing={4}>
        <Spinner size="lg" color="blue.500" thickness="3px" />
        <Text color="gray.500" fontSize="sm">
          {message}
        </Text>
      </VStack>
    </Flex>
  );
}

export default RequireTwoFactor;
