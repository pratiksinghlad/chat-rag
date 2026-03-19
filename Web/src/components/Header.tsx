import {
  Flex,
  HStack,
  Icon,
  Text,
  Button,
  useColorModeValue,
} from "@chakra-ui/react";
import { useAuth } from "@/context/AuthContext";

export function Header() {
  const { signOut } = useAuth();
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const bg = useColorModeValue("white", "gray.800");

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <Flex
      as="header"
      align="center"
      justify="space-between"
      px={{ base: 4, md: 8 }}
      py={4}
      borderBottom="1px"
      borderColor={borderColor}
      bg={bg}
      position="sticky"
      top={0}
      zIndex={10}
      h="72px"
    >
      <HStack spacing={3}>
        <Icon viewBox="0 0 100 100" boxSize={8} color="blue.600">
          <circle cx="50" cy="50" r="45" fill="currentColor" opacity="0.2" />
          <path
            d="M30 50 L45 65 L70 35"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </Icon>
        <Text fontSize="xl" fontWeight="bold" color="gray.800">
          Chat Rag Web
        </Text>
      </HStack>

      <Button
        variant="outline"
        size="sm"
        onClick={handleSignOut}
        leftIcon={
          <Icon viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"
            />
          </Icon>
        }
        aria-label="Sign out"
      >
        Sign Out
      </Button>
    </Flex>
  );
}

export default Header;
