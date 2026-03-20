import {
  Box,
  VStack,
  Flex,
  Button,
  Input,
  Spinner,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { useLocation, useNavigate } from "react-router-dom";
import { useChatHistory } from "@/context/ChatHistoryContext";

export function Sidebar() {
  const bg = useColorModeValue("white", "gray.800");
  const mutedBg = useColorModeValue("gray.50", "gray.900");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const surfaceBorderColor = useColorModeValue("gray.100", "gray.700");
  const listItemBg = useColorModeValue("blue.50", "blue.900");
  const listItemHoverBg = useColorModeValue("gray.100", "gray.700");
  const activeTextColor = useColorModeValue("blue.700", "blue.100");
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
      as="aside"
      w={{ base: "full", md: "22rem", lg: "24rem" }}
      h="full"
      bg={bg}
      borderRight="1px"
      borderColor={borderColor}
      py={4}
      px={4}
      flexShrink={0}
      display={{ base: "none", md: "block" }}
    >
      <Flex direction="column" h="full" minH={0} gap={4}>
        <Box
          bg={mutedBg}
          borderRadius="2xl"
          borderWidth="1px"
          borderColor={surfaceBorderColor}
          p={4}
        >
          <Text fontSize="xs" fontWeight="semibold" color="blue.500" mb={1}>
            Your workspace
          </Text>
          <Text fontSize="lg" fontWeight="bold" color="gray.800">
            Recent chats
          </Text>
          <Text fontSize="sm" color="gray.500" mt={1} mb={4}>
            Pick up a conversation or start something new.
          </Text>

          <Button
            colorScheme="blue"
            size="md"
            borderRadius="xl"
            w="full"
            onClick={() => navigate("/chat")}
          >
            New chat
          </Button>
        </Box>

        <Box
          bg={mutedBg}
          borderRadius="2xl"
          borderWidth="1px"
          borderColor={surfaceBorderColor}
          p={4}
        >
          <Text fontSize="xs" fontWeight="semibold" color="gray.500" mb={2}>
            Search
          </Text>
          <Input
            placeholder="Search chats"
            size="md"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            borderRadius="xl"
            bg={bg}
          />
        </Box>

        <Flex direction="column" minH={0} flex="1">
          <Text
            fontSize="xs"
            fontWeight="semibold"
            color="gray.500"
            px={2}
            pb={2}
            textTransform="uppercase"
            letterSpacing="0.08em"
          >
            Recent chats
          </Text>

          <Box
            flex="1"
            minH={0}
            overflowY="auto"
            pr={1}
            borderRadius="2xl"
            css={{
              scrollbarGutter: "stable",
            }}
          >
            <VStack spacing={2} align="stretch">
              {isLoadingChats ? (
                <Box py={6} textAlign="center">
                  <Spinner size="sm" color="blue.400" />
                </Box>
              ) : null}
              {error ? (
                <Text fontSize="sm" color="red.500" px={2}>
                  {error}
                </Text>
              ) : null}
              {!isLoadingChats && chats.length === 0 ? (
                <Box
                  bg={mutedBg}
                  borderRadius="2xl"
                  borderWidth="1px"
                  borderColor={surfaceBorderColor}
                  px={4}
                  py={5}
                >
                  <Text fontSize="sm" color="gray.500">
                    No chats found yet.
                  </Text>
                </Box>
              ) : null}
              {chats.map((chat) => (
                <Button
                  key={chat.id}
                  justifyContent="flex-start"
                  variant="ghost"
                  h="auto"
                  minH="72px"
                  py={4}
                  px={4}
                  borderRadius="2xl"
                  borderWidth="1px"
                  borderColor={chat.id === activeChatId ? "blue.200" : surfaceBorderColor}
                  bg={chat.id === activeChatId ? listItemBg : mutedBg}
                  color={chat.id === activeChatId ? activeTextColor : "inherit"}
                  _hover={{ bg: listItemHoverBg }}
                  onClick={() => navigate(`/chat/${chat.id}`)}
                >
                  <Box textAlign="left" w="full" overflow="hidden">
                    <Text fontSize="sm" fontWeight="semibold" noOfLines={2}>
                      {chat.title}
                    </Text>
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      {formatChatTimestamp(chat.lastActivityDate)}
                    </Text>
                  </Box>
                </Button>
              ))}
              {hasMore ? (
                <Button
                  variant="ghost"
                  size="sm"
                  borderRadius="xl"
                  onClick={() => void loadMoreChats()}
                  isLoading={isLoadingMore}
                >
                  Load more
                </Button>
              ) : null}
            </VStack>
          </Box>
        </Flex>
      </Flex>
    </Box>
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
