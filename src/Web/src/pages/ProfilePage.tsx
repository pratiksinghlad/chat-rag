/**
 * Profile Page
 *
 * Displays user profile information including name, email, and avatar.
 */

import { Navigate } from "react-router-dom";
import {
  Box,
  Heading,
  VStack,
} from "@chakra-ui/react";
import { useAuth } from "@/context/AuthContext";
import UserCard from "@/components/UserCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import AppShell from "@/components/AppShell";

export function ProfilePage() {
  const { user, isLoading, getUserProfile } = useAuth();

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <Box
        minH="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
        bg="white"
      >
        <LoadingSpinner message="Loading your profile..." />
      </Box>
    );
  }

  // Redirect unauthenticated users to landing
  if (!user) {
    return <Navigate to="/" replace />;
  }

  const profile = getUserProfile();

  return (
    <AppShell>
      <VStack spacing={8} align="stretch" maxW="container.lg" mx="auto" py={8}>
        {/* User profile card */}
        {profile && (
          <Box>
            <Heading as="h2" size="md" mb={6} color="gray.700">
              Account Information
            </Heading>
            <UserCard profile={profile} />
          </Box>
        )}
      </VStack>
    </AppShell>
  );
}

export default ProfilePage;
