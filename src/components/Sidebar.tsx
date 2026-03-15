import {
  Box,
  VStack,
  Button,
  Icon,
  Input,
  Spinner,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useChatHistory } from "@/context/ChatHistoryContext";

export function Sidebar() {
  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const listItemBg = useColorModeValue("gray.50", "gray.700");
  const listItemHoverBg = useColorModeValue("gray.100", "gray.600");
  const location = useLocation();
  const navigate = useNavigate();
  const {
    chats,
    searchQuery,
    hasMore,
    isLoadingChats,
    isLoadingMore,
    error,
    setSearchQuery,
    loadMoreChats,
  } = useChatHistory();
  const activeChatId = location.pathname.startsWith("/chat/")
    ? location.pathname.split("/").at(-1) ?? null
    : null;

  return (
    <Box
      as="nav"
      w={{ base: "full", md: 60 }}
      h="full"
      bg={bg}
      borderRight="1px"
      borderColor={borderColor}
      py={4}
      display={{ base: "none", md: "block" }}
    >
      <VStack spacing={2} align="stretch" px={4}>
        <NavItem
          icon="chat"
          label="Chat"
          to="/chat"
          isActive={location.pathname.startsWith("/chat")}
        />
        <NavItem
          icon="profile"
          label="Profile"
          to="/profile"
          isActive={location.pathname === "/profile"}
        />
        <NavItem
          icon="document"
          label="Documents"
          to="#"
          isActive={false}
          isDisabled
        />
        <Box h="px" bg={borderColor} my={2} />
        <NavItem
          icon="settings"
          label="Settings"
          to="#"
          isActive={false}
          isDisabled
        />
        <Box h="px" bg={borderColor} my={2} />
        <Button
          colorScheme="blue"
          variant="outline"
          onClick={() => navigate("/chat")}
        >
          New chat
        </Button>
        <Input
          placeholder="Search chats"
          size="sm"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
        <Text fontSize="xs" fontWeight="semibold" color="gray.500" px={1}>
          Recent chats
        </Text>
        {isLoadingChats ? (
          <Box py={4} textAlign="center">
            <Spinner size="sm" color="blue.400" />
          </Box>
        ) : null}
        {error ? (
          <Text fontSize="xs" color="red.500" px={1}>
            {error}
          </Text>
        ) : null}
        {!isLoadingChats && chats.length === 0 ? (
          <Text fontSize="sm" color="gray.500" px={1}>
            No chats found yet.
          </Text>
        ) : null}
        {chats.map((chat) => (
          <Button
            key={chat.id}
            justifyContent="flex-start"
            variant="ghost"
            h="auto"
            minH="56px"
            py={3}
            px={3}
            bg={chat.id === activeChatId ? listItemBg : "transparent"}
            _hover={{ bg: listItemHoverBg }}
            onClick={() => navigate(`/chat/${chat.id}`)}
          >
            <Box textAlign="left" w="full" overflow="hidden">
              <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                {chat.title}
              </Text>
              <Text fontSize="xs" color="gray.500">
                {formatChatTimestamp(chat.lastActivityDate)}
              </Text>
            </Box>
          </Button>
        ))}
        {hasMore ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void loadMoreChats()}
            isLoading={isLoadingMore}
          >
            Load more
          </Button>
        ) : null}
      </VStack>
    </Box>
  );
}

function NavItem({
  icon,
  label,
  to,
  isActive,
  isDisabled,
}: {
  icon: string;
  label: string;
  to: string;
  isActive: boolean;
  isDisabled?: boolean;
}) {
  const getIcon = (name: string) => {
    switch (name) {
      case "profile":
        return (
          <path
            fill="currentColor"
            d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
          />
        );
      case "chat":
        return (
          <path
            fill="currentColor"
            d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"
          />
        );
      case "document":
        return (
          <path
            fill="currentColor"
            d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"
          />
        );
      case "settings":
        return (
          <path
            fill="currentColor"
            d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"
          />
        );
      default:
        return null;
    }
  };

  const button = (
    <Button
      variant={isActive ? "solid" : "ghost"}
      colorScheme={isActive ? "blue" : "gray"}
      justifyContent="flex-start"
      w="full"
      leftIcon={
        <Icon viewBox="0 0 24 24" boxSize={5}>
          {getIcon(icon)}
        </Icon>
      }
      fontWeight={isActive ? "semibold" : "medium"}
      isDisabled={isDisabled}
      opacity={isDisabled ? 0.5 : 1}
    >
      {label}
    </Button>
  );

  if (isDisabled || to === "#") {
    return button;
  }

  return (
    <Link to={to} style={{ textDecoration: "none" }}>
      {button}
    </Link>
  );
}

export default Sidebar;

function formatChatTimestamp(value: string): string {
  const date = new Date(value);
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
