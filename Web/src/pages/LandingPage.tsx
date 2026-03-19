/**
 * Landing Page
 *
 * The main entry point for unauthenticated users.
 * Displays OAuth sign-in buttons for Microsoft, Google, and GitHub.
 */

import type { ReactElement } from "react";
import { useState } from "react";
import { Navigate } from "react-router-dom";
import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  VStack,
  SimpleGrid,
  Icon,
  Alert,
  AlertIcon,
  AlertTitle,
  Link,
} from "@chakra-ui/react";
import { useAuth } from "@/context/AuthContext";
import OAuthButton from "@/components/OAuthButton";
import LoadingSpinner from "@/components/LoadingSpinner";
import type { OAuthProvider } from "@/types/auth";

export function LandingPage() {
  const { user, isLoading, error, signInWithOAuth } = useAuth();
  const [signingIn, setSigningIn] = useState<OAuthProvider | null>(null);

  // Redirect authenticated users to chat by default
  if (user && !isLoading) {
    return <Navigate to="/chat" replace />;
  }

  // Show loading state while checking auth
  if (isLoading && !signingIn) {
    return (
      <Flex minH="100vh" align="center" justify="center" bg="white">
        <LoadingSpinner message="Checking authentication..." />
      </Flex>
    );
  }

  const handleSignIn = async (provider: OAuthProvider) => {
    setSigningIn(provider);
    await signInWithOAuth(provider);
    // Note: The page will redirect, so we don't need to reset state
  };

  return (
    <Box minH="100vh" bg="white">
      {/* Background decorations - optional or remove for clean look */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        height="50vh"
        bgGradient="linear(to-b, gray.50, white)"
        zIndex={0}
      />

      <Container maxW="container.lg" position="relative" zIndex={1} py={12}>
        <VStack spacing={12}>
          {/* Header */}
          <VStack spacing={6} textAlign="center">
            <Icon viewBox="0 0 100 100" boxSize={16} color="blue.600">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="currentColor"
                opacity="0.2"
              />
              <path
                d="M30 50 L45 65 L70 35"
                stroke="currentColor"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </Icon>
            <VStack spacing={2}>
              <Heading as="h1" size="2xl" color="gray.900">
                Chat RAG Web
              </Heading>
            </VStack>
          </VStack>

          {/* Sign-in card */}
          <Box
            w="100%"
            maxW="md"
            bg="white"
            p={8}
            borderRadius="xl"
            boxShadow="lg"
            border="1px solid"
            borderColor="gray.100"
          >
            <VStack spacing={6}>
              <Box textAlign="center">
                <Heading as="h2" size="md" mb={2} color="gray.800">
                  Welcome Back
                </Heading>
                <Text color="gray.500">
                  Choose your preferred sign-in method to continue
                </Text>
              </Box>

              {/* Error display */}
              {error && (
                <Alert status="error" borderRadius="md">
                  <AlertIcon />
                  <AlertTitle fontSize="sm">{error.message}</AlertTitle>
                </Alert>
              )}

              {/* OAuth buttons */}
              <VStack w="100%" spacing={3}>
                <OAuthButton
                  provider="google"
                  onClick={() => handleSignIn("google")}
                  isLoading={signingIn === "google"}
                  disabled={signingIn !== null}
                />
                <OAuthButton
                  provider="github"
                  onClick={() => handleSignIn("github")}
                  isLoading={signingIn === "github"}
                  disabled={signingIn !== null}
                />
                <OAuthButton
                  provider="azure"
                  onClick={() => handleSignIn("azure")}
                  isLoading={signingIn === "azure"}
                  disabled={signingIn !== null}
                />
              </VStack>

              {/* Privacy note */}
              <Text fontSize="xs" color="gray.500" textAlign="center">
                By signing in, you agree to our{" "}
                <Link color="blue.600" href="#terms">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link color="blue.600" href="#privacy">
                  Privacy Policy
                </Link>
              </Text>
            </VStack>
          </Box>

          {/* Features section */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8} w="100%" pt={8}>
            <Feature
              icon={
                <path
                  fill="currentColor"
                  d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"
                />
              }
              title="Secure"
              text="Enterprise-grade security with OAuth 2.0"
            />
            <Feature
              icon={
                <path
                  fill="currentColor"
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                />
              }
              title="Simple"
              text="One click sign-in with your existing accounts"
            />
            <Feature
              icon={
                <path
                  fill="currentColor"
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"
                />
              }
              title="Universal"
              text="Works with Google, Microsoft, and GitHub"
            />
          </SimpleGrid>
        </VStack>
      </Container>

      {/* Footer */}
      <Box
        as="footer"
        py={8}
        textAlign="center"
        borderTop="1px solid"
        borderColor="gray.100"
        mt="auto"
      >
        <Text fontSize="sm" color="gray.400">
          Powered by{" "}
          <Link href="https://supabase.com" isExternal color="blue.500">
            Supabase
          </Link>
        </Text>
      </Box>
    </Box>
  );
}

function Feature({
  icon,
  title,
  text,
}: {
  icon: ReactElement;
  title: string;
  text: string;
}) {
  return (
    <VStack spacing={4} textAlign="center" p={4}>
      <Flex
        w={12}
        h={12}
        align="center"
        justify="center"
        borderRadius="full"
        bg="blue.50"
        color="blue.500"
      >
        <Icon viewBox="0 0 24 24" boxSize={6}>
          {icon}
        </Icon>
      </Flex>
      <Heading as="h3" size="sm" color="gray.800">
        {title}
      </Heading>
      <Text color="gray.600" fontSize="sm">
        {text}
      </Text>
    </VStack>
  );
}

export default LandingPage;
