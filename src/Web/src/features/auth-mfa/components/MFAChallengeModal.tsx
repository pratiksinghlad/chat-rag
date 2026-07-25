/**
 * MFA Challenge Modal
 *
 * Shown on login when the user has an enrolled TOTP factor but the session
 * is only at assurance level `aal1`. The user must enter their 6-digit
 * authenticator code to upgrade the session to `aal2`.
 *
 * Blocking: cannot be dismissed — the user must verify to access the app.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  VStack,
  HStack,
  Text,
  Box,
  Alert,
  AlertIcon,
  AlertDescription,
  PinInput,
  PinInputField,
  Heading,
  Icon,
  useColorModeValue,
} from '@chakra-ui/react';
import { useTwoFactorAuth } from '../hooks/useTwoFactorAuth';
import { useAuth } from '@/context/AuthContext';

// Maximum consecutive failed attempts before signing the user out
const MAX_ATTEMPTS = 5;

export function MFAChallengeModal() {
  const { challengeAndVerify, error, clearError } = useTwoFactorAuth();
  const { signOut } = useAuth();

  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);

  const cardBg = useColorModeValue('white', 'gray.800');
  const mutedText = useColorModeValue('gray.500', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const iconBg = useColorModeValue('blue.50', 'blue.900');
  const iconColor = useColorModeValue('blue.600', 'blue.200');

  const handleVerify = useCallback(async () => {
    if (code.length !== 6 || isVerifying) return;

    setLocalError(null);
    clearError();
    setIsVerifying(true);

    try {
      await challengeAndVerify(code);
      // On success the TwoFactorContext sets status → 'verified'
      // RequireTwoFactor will unmount this modal automatically
    } catch (err) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      if (newAttempts >= MAX_ATTEMPTS) {
        setLocalError(
          `Too many failed attempts. Signing you out for security.`
        );
        setTimeout(() => signOut(), 2000);
      } else {
        setLocalError(
          err instanceof Error
            ? err.message
            : `Invalid code. ${MAX_ATTEMPTS - newAttempts} attempt(s) remaining.`
        );
      }

      setCode('');
    } finally {
      setIsVerifying(false);
    }
  }, [code, isVerifying, clearError, challengeAndVerify, attempts, signOut]);

  // Auto-submit when all 6 digits are entered
  useEffect(() => {
    if (code.length === 6) {
      handleVerify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const displayError = localError ?? error?.message ?? null;
  const isLockedOut = attempts >= MAX_ATTEMPTS;

  return (
    <Modal
      isOpen
      onClose={() => {}} // no-op — cannot dismiss
      closeOnOverlayClick={false}
      closeOnEsc={false}
      isCentered
      size="sm"
      motionPreset="slideInBottom"
    >
      <ModalOverlay
        bg="blackAlpha.700"
        backdropFilter="blur(6px)"
      />
      <ModalContent
        bg={cardBg}
        borderRadius="2xl"
        boxShadow="2xl"
        mx={4}
        overflow="hidden"
      >
        {/* Accent bar */}
        <Box h="4px" bgGradient="linear(to-r, blue.400, purple.500)" />

        <ModalHeader pt={6} pb={2}>
          <VStack spacing={1} align="center">
            <Box
              w={12}
              h={12}
              borderRadius="xl"
              bg={iconBg}
              display="flex"
              alignItems="center"
              justifyContent="center"
              mb={1}
            >
              <Icon viewBox="0 0 24 24" boxSize={6} color={iconColor}>
                <path
                  fill="currentColor"
                  d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 4l6 2.67V11c0 3.52-2.43 6.79-6 7.93C8.43 17.79 6 14.52 6 11V7.67L12 5z"
                />
              </Icon>
            </Box>
            <Heading size="md" fontWeight={700}>
              Two-Factor Authentication
            </Heading>
            <Text fontSize="sm" color={mutedText}>
              Enter the code from your authenticator app
            </Text>
          </VStack>
        </ModalHeader>

        <ModalBody pb={6}>
          <VStack spacing={5}>
            {/* PIN Input */}
            <HStack spacing={2} justify="center">
              <PinInput
                otp
                size="lg"
                value={code}
                onChange={setCode}
                isDisabled={isVerifying || isLockedOut}
                focusBorderColor="blue.400"
                placeholder="○"
                autoFocus
              >
                {[...Array(6)].map((_, i) => (
                  <PinInputField
                    key={i}
                    borderRadius="lg"
                    fontWeight={700}
                    fontSize="xl"
                    w={10}
                    h={12}
                  />
                ))}
              </PinInput>
            </HStack>

            {/* Attempt counter */}
            {attempts > 0 && !isLockedOut && (
              <Text fontSize="xs" color="orange.500" textAlign="center">
                {MAX_ATTEMPTS - attempts} attempt{MAX_ATTEMPTS - attempts !== 1 ? 's' : ''} remaining
              </Text>
            )}

            {/* Error feedback */}
            {displayError && (
              <Alert
                status={isLockedOut ? 'error' : 'warning'}
                borderRadius="lg"
                fontSize="sm"
              >
                <AlertIcon />
                <AlertDescription>{displayError}</AlertDescription>
              </Alert>
            )}

            <Button
              colorScheme="blue"
              size="md"
              w="100%"
              borderRadius="lg"
              fontWeight={600}
              isLoading={isVerifying}
              loadingText="Verifying..."
              isDisabled={code.length !== 6 || isLockedOut}
              onClick={handleVerify}
            >
              Verify
            </Button>
          </VStack>
        </ModalBody>

        <ModalFooter
          borderTop="1px solid"
          borderColor={borderColor}
          py={3}
          flexDirection="column"
          gap={1}
        >
          <Text fontSize="xs" color={mutedText} textAlign="center">
            Open your authenticator app to find your 6-digit code.
          </Text>
          <Button
            variant="link"
            size="xs"
            color={mutedText}
            fontWeight={400}
            onClick={signOut}
          >
            Sign out and use a different account
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default MFAChallengeModal;
