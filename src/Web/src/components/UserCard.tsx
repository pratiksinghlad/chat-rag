/**
 * User Card Component
 *
 * Displays authenticated user's profile information including:
 * - Avatar (with fallback)
 * - Full name
 * - Email
 * - Authentication provider
 */

import {
  Box,
  Flex,
  Text,
  Avatar,
  Icon,
  Badge,
  VStack,
  HStack,
  useColorModeValue,
} from "@chakra-ui/react";
import type { UserProfile } from "@/types/auth";

interface UserCardProps {
  /** User's profile data */
  profile: UserProfile;
}

/**
 * Get provider display name
 */
function getProviderDisplayName(provider: string | null): string {
  const providerNames: Record<string, string> = {
    google: "Google",
    github: "GitHub",
    azure: "Microsoft",
  };
  return provider ? providerNames[provider] || provider : "Unknown";
}

export function UserCard({ profile }: UserCardProps) {
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const bgCard = useColorModeValue("white", "gray.800");

  return (
    <Box
      as="article"
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="xl"
      bg={bgCard}
      p={6}
      shadow="sm"
      w="100%"
      maxW="md"
      mx="auto"
      aria-label="User profile information"
    >
      <Flex direction="column" align="center" gap={6}>
        <Box position="relative">
          <Avatar
            size="2xl"
            name={profile.fullName || profile.email}
            src={profile.avatarUrl || undefined}
            ignoreFallback={!profile.avatarUrl}
          />
          <Flex
            position="absolute"
            bottom={0}
            right={0}
            bg="blue.500"
            color="white"
            borderRadius="full"
            p={1}
            align="center"
            justify="center"
            title="Verified account"
            borderWidth={2}
            borderColor="white"
          >
            <Icon viewBox="0 0 24 24" boxSize={4}>
              <path
                d="M8 12l2.5 2.5L16 9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </Icon>
          </Flex>
        </Box>

        <VStack spacing={1} textAlign="center">
          <Text
            fontSize="2xl"
            fontWeight="bold"
            id="user-name"
            color="gray.900"
          >
            {profile.fullName || "Name not provided"}
          </Text>

          <HStack color="gray.500" id="user-email">
            <Icon viewBox="0 0 24 24" boxSize={4}>
              <path
                fill="currentColor"
                d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"
              />
            </Icon>
            <Text>{profile.email || "Email not provided"}</Text>
          </HStack>

          <HStack mt={2}>
            <Text fontSize="sm" color="gray.500">
              Signed in with
            </Text>
            <Badge
              colorScheme={
                profile.provider === "github"
                  ? "gray"
                  : profile.provider === "google"
                    ? "red"
                    : "blue"
              }
            >
              {getProviderDisplayName(profile.provider)}
            </Badge>
          </HStack>
        </VStack>

        <Flex
          w="100%"
          pt={4}
          borderTopWidth="1px"
          borderColor="gray.100"
          justify="space-between"
          fontSize="sm"
          color="gray.500"
        >
          {profile.createdAt && (
            <VStack align="flex-start" spacing={0}>
              <Text fontSize="xs" fontWeight="medium">
                Member since
              </Text>
              <Text>
                {new Date(profile.createdAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </Text>
            </VStack>
          )}
          {profile.lastSignInAt && (
            <VStack align="flex-end" spacing={0}>
              <Text fontSize="xs" fontWeight="medium">
                Last sign in
              </Text>
              <Text>
                {new Date(profile.lastSignInAt).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </Text>
            </VStack>
          )}
        </Flex>
      </Flex>
    </Box>
  );
}

export default UserCard;
