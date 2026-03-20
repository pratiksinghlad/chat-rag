import {
  Flex,
  HStack,
  Icon,
  Text,
  Button,
  useColorModeValue,
  Link as ChakraLink,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Box,
} from "@chakra-ui/react";
import { NavLink as RouterNavLink } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export function Header() {
  const { signOut } = useAuth();
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const bg = useColorModeValue("white", "gray.800");
  const navHoverBg = useColorModeValue("gray.100", "gray.700");
  const activeColor = "blue.600";

  const handleSignOut = async () => {
    await signOut();
  };

  const navLinks = [
    { name: "Chat", path: "/chat" },
    { name: "Profile", path: "/profile" },
    { name: "Documents", path: "/documents" },
  ];

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
      <HStack spacing={{ base: 2, md: 8 }} align="center">
        <HStack spacing={3} as={RouterNavLink} to="/chat">
          <Icon viewBox="0 0 24 24" boxSize={8} color="blue.600">
            <circle cx="12" cy="12" r="11" fill="currentColor" opacity="0.15" />
            <path
              d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"
              fill="currentColor"
            />
          </Icon>
          <Text
            fontSize="xl"
            fontWeight="bold"
            color="gray.800"
            display={{ base: "none", sm: "block" }}
          >
            Chat Rag
          </Text>
        </HStack>

        {/* Desktop Navigation */}
        <HStack spacing={1} display={{ base: "none", md: "flex" }}>
          {navLinks.map((link) => (
            <ChakraLink
              key={link.path}
              as={RouterNavLink}
              to={link.path}
              px={3}
              py={2}
              borderRadius="md"
              fontWeight="medium"
              color="gray.600"
              _activeLink={{
                color: activeColor,
                bg: "blue.50",
              }}
              _hover={{
                bg: navHoverBg,
                textDecoration: "none",
              }}
            >
              {link.name}
            </ChakraLink>
          ))}
        </HStack>
      </HStack>

      <HStack spacing={3}>
        {/* Mobile Navigation Menu */}
        <Box display={{ base: "block", md: "none" }}>
          <Menu>
            <MenuButton
              as={IconButton}
              aria-label="Options"
              icon={
                <Icon viewBox="0 0 24 24" boxSize={5}>
                  <path
                    fill="currentColor"
                    d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"
                  />
                </Icon>
              }
              variant="outline"
              size="sm"
            />
            <MenuList>
              {navLinks.map((link) => (
                <MenuItem
                  key={link.path}
                  as={RouterNavLink}
                  to={link.path}
                >
                  {link.name}
                </MenuItem>
              ))}
              <MenuItem onClick={handleSignOut} color="red.500">
                Sign Out
              </MenuItem>
            </MenuList>
          </Menu>
        </Box>

        <Button
          variant="outline"
          size="sm"
          onClick={handleSignOut}
          display={{ base: "none", md: "flex" }}
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
      </HStack>
    </Flex>
  );
}

export default Header;
