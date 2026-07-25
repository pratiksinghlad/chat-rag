/**
 * MFA Enrollment Modal
 *
 * Shown when the user has no enrolled TOTP factor.
 * Guides them through:
 *   Step 1 — Scan QR code (or manually enter the secret)
 *   Step 2 — Verify first 6-digit code to confirm the factor
 *
 * Blocking: `closeOnOverlayClick={false}` — user cannot dismiss this.
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
  Code,
  Alert,
  AlertIcon,
  AlertDescription,
  PinInput,
  PinInputField,
  Spinner,
  Heading,
  Badge,
  Divider,
  useColorModeValue,
  Icon,
} from '@chakra-ui/react';
import QRCode from 'react-qr-code';
import { useTwoFactorAuth } from '../hooks/useTwoFactorAuth';

// ---------------------------------------------------------------------------
// Step components
// ---------------------------------------------------------------------------

type Step = 'loading' | 'scan' | 'verify' | 'success';

interface EnrollmentData {
  factorId: string;
  totpUri: string;
  secret: string;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function MFAEnrollmentModal() {
  const { beginEnrollment, verifyEnrollment, error, clearError } =
    useTwoFactorAuth();

  const [step, setStep] = useState<Step>('loading');
  const [enrollmentData, setEnrollmentData] = useState<EnrollmentData | null>(
    null
  );
  const [verifyCode, setVerifyCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const cardBg = useColorModeValue('white', 'gray.800');
  const mutedText = useColorModeValue('gray.600', 'gray.400');
  const secretBg = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const stepBadgeBg = useColorModeValue('blue.50', 'blue.900');
  const stepBadgeColor = useColorModeValue('blue.600', 'blue.200');

  // Kick off enrollment immediately on mount
  const startEnrollment = useCallback(async () => {
    setLocalError(null);
    setStep('loading');
    setEnrollmentData(null);
    try {
      const result = await beginEnrollment();
      setEnrollmentData(result);
      setStep('scan');
    } catch (err) {
      setLocalError(
        err instanceof Error
          ? err.message
          : 'Failed to start enrollment. Please try again.'
      );
      setStep('scan'); // show error UI
    }
  }, [beginEnrollment]);

  useEffect(() => {
    startEnrollment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVerify = useCallback(async () => {
    if (!enrollmentData || verifyCode.length !== 6) return;

    setLocalError(null);
    clearError();
    setIsVerifying(true);

    try {
      await verifyEnrollment(enrollmentData.factorId, verifyCode);
      setStep('success');
    } catch (err) {
      setLocalError(
        err instanceof Error
          ? err.message
          : 'Invalid code. Please check your authenticator app and try again.'
      );
      setVerifyCode('');
    } finally {
      setIsVerifying(false);
    }
  }, [enrollmentData, verifyCode, clearError, verifyEnrollment]);

  // Auto-submit when all 6 digits are entered
  useEffect(() => {
    if (verifyCode.length === 6 && step === 'verify') {
      handleVerify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verifyCode]);

  const displayError = localError ?? error?.message ?? null;

  return (
    <Modal
      isOpen
      onClose={() => {}} // no-op — cannot dismiss
      closeOnOverlayClick={false}
      closeOnEsc={false}
      isCentered
      size="lg"
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
        <Box
          h="4px"
          bgGradient="linear(to-r, blue.400, purple.500)"
        />

        <ModalHeader pt={6} pb={2}>
          <VStack spacing={1} align="start">
            <HStack spacing={3}>
              <Box
                w={9}
                h={9}
                borderRadius="lg"
                bg={stepBadgeBg}
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Icon
                  viewBox="0 0 24 24"
                  boxSize={5}
                  color={stepBadgeColor}
                >
                  <path
                    fill="currentColor"
                    d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"
                  />
                </Icon>
              </Box>
              <Heading size="md" fontWeight={700}>
                Set Up Two-Factor Authentication
              </Heading>
            </HStack>
            <Text fontSize="sm" color={mutedText} pl="48px">
              Required to access your account
            </Text>
          </VStack>
        </ModalHeader>

        <ModalBody pb={6}>
          {step === 'loading' && (
            <VStack spacing={4} py={8}>
              <Spinner size="lg" color="blue.500" thickness="3px" />
              <Text color={mutedText} fontSize="sm">
                Generating your secure key...
              </Text>
            </VStack>
          )}

          {(step === 'scan' || step === 'verify') && (
            <VStack spacing={6} align="stretch">
              {/* Step indicators */}
              <HStack spacing={3}>
                <Badge
                  colorScheme={step === 'scan' ? 'blue' : 'green'}
                  borderRadius="full"
                  px={3}
                  py={1}
                  fontSize="xs"
                  fontWeight={700}
                >
                  Step 1: Scan
                </Badge>
                <Box h="1px" flex={1} bg={borderColor} />
                <Badge
                  colorScheme={step === 'verify' ? 'blue' : 'gray'}
                  borderRadius="full"
                  px={3}
                  py={1}
                  fontSize="xs"
                  fontWeight={700}
                >
                  Step 2: Verify
                </Badge>
              </HStack>

              {step === 'scan' && !enrollmentData && (
                // --- ERROR STATE: enrollment failed ---
                <VStack spacing={4} py={4} textAlign="center">
                  <Box
                    w={12} h={12} borderRadius="full" bg="red.50"
                    display="flex" alignItems="center" justifyContent="center"
                  >
                    <Icon viewBox="0 0 24 24" boxSize={6} color="red.500">
                      <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                    </Icon>
                  </Box>
                  <Alert status="error" borderRadius="lg" fontSize="sm" textAlign="left">
                    <AlertIcon />
                    <AlertDescription>
                      {displayError ?? 'Could not generate QR code. Please try again.'}
                    </AlertDescription>
                  </Alert>
                  <Button
                    colorScheme="blue" size="md" w="100%" borderRadius="lg" fontWeight={600}
                    onClick={startEnrollment}
                  >
                    Try Again
                  </Button>
                </VStack>
              )}

              {step === 'scan' && enrollmentData && (
                <>
                  <Text fontSize="sm" color={mutedText}>
                    Open your authenticator app (e.g.{' '}
                    <strong>Google Authenticator</strong>,{' '}
                    <strong>Authy</strong>, or{' '}
                    <strong>Microsoft Authenticator</strong>) and scan the QR
                    code below.
                  </Text>

                  {/* QR Code */}
                  <Box
                    alignSelf="center"
                    p={4}
                    bg="white"
                    borderRadius="xl"
                    border="1px solid"
                    borderColor={borderColor}
                    boxShadow="sm"
                  >
                    <QRCode
                      value={enrollmentData.totpUri}
                      size={180}
                      level="M"
                    />
                  </Box>

                  {/* Manual secret fallback */}
                  <Box>
                    <Text fontSize="xs" color={mutedText} mb={2} fontWeight={600}>
                      CAN'T SCAN? ENTER MANUALLY:
                    </Text>
                    <Box
                      p={3}
                      bg={secretBg}
                      borderRadius="lg"
                      border="1px solid"
                      borderColor={borderColor}
                    >
                      <Code
                        fontSize="sm"
                        letterSpacing="wider"
                        bg="transparent"
                        display="block"
                        textAlign="center"
                        wordBreak="break-all"
                        userSelect="all"
                      >
                        {enrollmentData.secret}
                      </Code>
                    </Box>
                  </Box>

                  <Button
                    colorScheme="blue"
                    size="md"
                    borderRadius="lg"
                    fontWeight={600}
                    onClick={() => setStep('verify')}
                  >
                    I've scanned the code →
                  </Button>
                </>
              )}

              {step === 'verify' && (
                <>
                  <Text fontSize="sm" color={mutedText}>
                    Enter the <strong>6-digit code</strong> from your
                    authenticator app to confirm setup.
                  </Text>

                  <VStack spacing={4}>
                    <HStack spacing={3} justify="center">
                      <PinInput
                        otp
                        size="lg"
                        value={verifyCode}
                        onChange={setVerifyCode}
                        isDisabled={isVerifying}
                        focusBorderColor="blue.400"
                        placeholder="○"
                      >
                        {[...Array(6)].map((_, i) => (
                          <PinInputField
                            key={i}
                            borderRadius="lg"
                            fontWeight={700}
                            fontSize="xl"
                          />
                        ))}
                      </PinInput>
                    </HStack>

                    {displayError && (
                      <Alert status="error" borderRadius="lg" fontSize="sm">
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
                      isDisabled={verifyCode.length !== 6}
                      onClick={handleVerify}
                    >
                      Verify & Enable 2FA
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setVerifyCode('');
                        setLocalError(null);
                        setStep('scan');
                      }}
                    >
                      ← Back to QR code
                    </Button>
                  </VStack>
                </>
              )}
            </VStack>
          )}

          {step === 'success' && (
            <VStack spacing={4} py={4} textAlign="center">
              <Box
                w={16}
                h={16}
                borderRadius="full"
                bg="green.50"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Icon viewBox="0 0 24 24" boxSize={8} color="green.500">
                  <path
                    fill="currentColor"
                    d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
                  />
                </Icon>
              </Box>
              <Heading size="md" color="green.600">
                2FA Enabled!
              </Heading>
              <Text fontSize="sm" color={mutedText}>
                Your account is now protected. You'll be asked for a code each
                time you sign in.
              </Text>
              <Divider />
              <Text fontSize="xs" color={mutedText}>
                Redirecting you to the app...
              </Text>
              <Spinner size="sm" color="blue.400" />
            </VStack>
          )}
        </ModalBody>

        {step !== 'success' && step !== 'loading' && (
          <ModalFooter
            borderTop="1px solid"
            borderColor={borderColor}
            py={3}
          >
            <Text fontSize="xs" color={mutedText} textAlign="center" w="100%">
              🔒 Your secret is stored securely in your authenticator app only.
            </Text>
          </ModalFooter>
        )}
      </ModalContent>
    </Modal>
  );
}

export default MFAEnrollmentModal;
