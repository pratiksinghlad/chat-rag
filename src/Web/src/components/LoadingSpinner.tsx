/**
 * Loading Spinner Component
 *
 * Displays animated loading indicator with optional loading message.
 */

import { Spinner, VStack, Text, Center } from "@chakra-ui/react";

interface LoadingSpinnerProps {
  /** Optional message to display below spinner */
  message?: string;
  /** Size variant */
  size?: "small" | "medium" | "large";
}

export function LoadingSpinner({
  message = "Loading...",
  size = "medium",
}: LoadingSpinnerProps) {
  const chakraSize = size === "small" ? "sm" : size === "medium" ? "md" : "xl";

  return (
    <Center p={4}>
      <VStack spacing={3}>
        <Spinner
          thickness="4px"
          speed="0.65s"
          emptyColor="gray.200"
          color="blue.500"
          size={chakraSize}
        />
        {message && (
          <Text fontSize="sm" color="gray.500" fontWeight="medium">
            {message}
          </Text>
        )}
      </VStack>
    </Center>
  );
}

export default LoadingSpinner;
