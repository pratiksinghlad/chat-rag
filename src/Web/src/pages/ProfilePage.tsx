/**
 * Profile Page
 *
 * Displays user profile information including name, email, and avatar.
 */

import { Navigate } from "react-router-dom";
import {
  Box,
  Heading,
  Text,
  Button,
  SimpleGrid,
  Icon,
  VStack,
  Avatar,
  Divider,
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
        <Box textAlign="center" animation="fadeIn 0.5s ease-out">
          <Avatar
            size="2xl"
            name={profile?.fullName || "User"}
            src={profile?.avatarUrl || ""}
            mb={4}
            border="4px solid"
            borderColor="blue.500"
          />
          <Heading as="h1" size="xl" mb={2} color="gray.900">
            {profile?.fullName || "My Profile"}
          </Heading>
          <Text color="gray.600" fontSize="lg">
            Manage your account settings and preferences
          </Text>
        </Box>

        <Divider />

        {/* User profile card */}
        {profile && (
          <Box>
            <Heading as="h2" size="md" mb={6} color="gray.700">
              Account Information
            </Heading>
            <UserCard profile={profile} />
          </Box>
        )}

        {/* Profile Actions */}
        <Box>
          <Heading as="h2" size="md" mb={6} color="gray.700">
            Account Settings
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
            <ActionCard
              icon={
                <path
                  fill="currentColor"
                  d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                />
              }
              title="Edit Profile"
              badge="Coming Soon"
              isDisabled
            />

            <ActionCard
              icon={
                <path
                  fill="currentColor"
                  d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"
                />
              }
              title="Security"
              badge="Coming Soon"
              isDisabled
            />

            <ActionCard
              icon={
                <path
                  fill="currentColor"
                  d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"
                />
              }
              title="Notifications"
              badge="Coming Soon"
              isDisabled
            />
          </SimpleGrid>
        </Box>
      </VStack>
    </AppShell>
  );
}

// Helper component for action cards
function ActionCard({
  icon,
  title,
  badge,
  isDisabled,
}: {
  icon: React.ReactNode;
  title: string;
  badge?: string;
  isDisabled?: boolean;
}) {
  return (
    <Button
      variant="outline"
      height="auto"
      p={6}
      display="flex"
      flexDirection="column"
      gap={4}
      isDisabled={isDisabled}
      _hover={{
        transform: isDisabled ? "none" : "translateY(-2px)",
        shadow: "md",
      }}
      transition="all 0.2s"
      borderColor="gray.200"
      bg="white"
      position="relative"
    >
      {badge && (
        <Box
          position="absolute"
          top={2}
          right={2}
          bg="orange.100"
          color="orange.800"
          fontSize="xs"
          px={2}
          py={0.5}
          borderRadius="full"
          borderWidth="1px"
          borderColor="orange.200"
        >
          {badge}
        </Box>
      )}
      <Box p={3} bg="blue.50" color="blue.500" borderRadius="lg">
        <Icon viewBox="0 0 24 24" boxSize={6}>
          {icon}
        </Icon>
      </Box>
      <Text fontWeight="medium" color="gray.700">
        {title}
      </Text>
    </Button>
  );
}

export default ProfilePage;
