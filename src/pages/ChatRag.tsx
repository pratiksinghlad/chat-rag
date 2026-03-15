import { useRef, useEffect } from "react";
import { Navigate } from "react-router-dom";
import {
  Box,
  VStack,
  Flex,
  Text,
  Icon,
  IconButton,
  Spinner,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { useAuth } from "@/context/AuthContext";
import { useChatRag } from "@/hooks/useChatRag";
import AppShell from "@/components/AppShell";
import ChatMessageBubble from "@/components/chat/ChatMessage";
import ChatInput from "@/components/chat/ChatInput";
import LoadingSpinner from "@/components/LoadingSpinner";

export function ChatRag() {
  const { user, isLoading: authLoading } = useAuth();
  const { messages, isLoading, error, sendMessage, clearChat } = useChatRag();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  const emptyBg = useColorModeValue("gray.50", "gray.800");
  const chatBg = useColorModeValue("white", "gray.900");
  const headerBorderColor = useColorModeValue("gray.200", "gray.700");
  const headerBg = useColorModeValue("white", "gray.800");
  const headingColor = useColorModeValue("gray.800", "white");
  const emptyHeadingColor = useColorModeValue("gray.700", "gray.200");

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Show error toast
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
    }
  }, [error, toast]);

  if (authLoading) {
    return (
      <Box
        minH="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
        bg="white"
      >
        <LoadingSpinner message="Loading..." />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <AppShell>
      <Flex
        direction="column"
        h="calc(100vh - 72px)"
        maxW="container.lg"
        mx="auto"
        w="100%"
        bg={chatBg}
        borderRadius={{ base: "none", md: "xl" }}
        overflow="hidden"
        boxShadow={{ base: "none", md: "lg" }}
      >
        {/* Chat header */}
        <Flex
          align="center"
          justify="space-between"
          px={5}
          py={3}
          borderBottom="1px"
          borderColor={headerBorderColor}
          bg={headerBg}
        >
          <Flex align="center" gap={3}>
            <Box p={2} bg="blue.50" borderRadius="lg" color="blue.500">
              <Icon viewBox="0 0 24 24" boxSize={5}>
                <path
                  fill="currentColor"
                  d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"
                />
              </Icon>
            </Box>
            <Box>
              <Text
                fontWeight="bold"
                fontSize="md"
                color={headingColor}
              >
                Chat RAG
              </Text>
              <Text fontSize="xs" color="gray.500">
                AI-powered knowledge assistant
              </Text>
            </Box>
          </Flex>

          {messages.length > 0 && (
            <IconButton
              aria-label="Clear chat"
              variant="ghost"
              size="sm"
              onClick={clearChat}
              icon={
                <Icon viewBox="0 0 24 24" boxSize={4}>
                  <path
                    fill="currentColor"
                    d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
                  />
                </Icon>
              }
            />
          )}
        </Flex>

        {/* Messages area */}
        <Box flex="1" overflowY="auto" px={4} py={4}>
          {messages.length === 0 ? (
            <Flex
              direction="column"
              align="center"
              justify="center"
              h="100%"
              bg={emptyBg}
              borderRadius="xl"
              p={8}
              textAlign="center"
            >
              <Box
                p={4}
                bg="blue.50"
                borderRadius="full"
                color="blue.400"
                mb={4}
              >
                <Icon viewBox="0 0 24 24" boxSize={10}>
                  <path
                    fill="currentColor"
                    d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"
                  />
                </Icon>
              </Box>
              <Text
                fontSize="xl"
                fontWeight="bold"
                color={emptyHeadingColor}
                mb={2}
              >
                Start a conversation
              </Text>
              <Text color="gray.500" maxW="sm">
                Ask me anything! I use your knowledge base to give you accurate,
                context-aware answers.
              </Text>
            </Flex>
          ) : (
            <VStack spacing={4} align="stretch">
              {messages.map((msg) => (
                <ChatMessageBubble key={msg.id} message={msg} />
              ))}

              {/* Typing indicator */}
              {isLoading && (
                <Flex align="center" gap={2} px={2}>
                  <Spinner size="xs" color="blue.400" />
                  <Text fontSize="sm" color="gray.500">
                    Thinking...
                  </Text>
                </Flex>
              )}

              <div ref={messagesEndRef} />
            </VStack>
          )}
        </Box>

        {/* Input area */}
        <ChatInput onSend={sendMessage} isDisabled={isLoading} />
      </Flex>
    </AppShell>
  );
}

export default ChatRag;
