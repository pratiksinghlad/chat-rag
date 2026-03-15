import { useRef, useEffect } from "react";
import { Navigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Box,
  VStack,
  Flex,
  Text,
  Icon,
  IconButton,
  Button,
  Spinner,
  useColorModeValue,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { useAuth } from "@/context/AuthContext";
import { useChatRag } from "@/hooks/useChatRag";
import AppShell from "@/components/AppShell";
import ChatMessageBubble from "@/components/chat/ChatMessage";
import ChatInput from "@/components/chat/ChatInput";
import LoadingSpinner from "@/components/LoadingSpinner";

export function ChatRagPage() {
  const { user, isLoading: authLoading } = useAuth();
  const {
    activeChatId,
    messages,
    isSendingMessage,
    isSwitchingChats,
    isDeletingChat,
    error,
    activeChatTitle,
    sendMessage,
    deleteActiveChat,
  } = useChatRag();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const cancelDeleteRef = useRef<HTMLButtonElement>(null);
  const toast = useToast();
  const {
    isOpen: isDeleteDialogOpen,
    onOpen: openDeleteDialog,
    onClose: closeDeleteDialog,
  } = useDisclosure();

  const emptyBg = useColorModeValue("gray.50", "gray.800");
  const chatBg = useColorModeValue("white", "gray.900");
  const headerBorderColor = useColorModeValue("gray.200", "gray.700");
  const headerBg = useColorModeValue("white", "gray.800");
  const headingColor = useColorModeValue("gray.800", "white");
  const emptyHeadingColor = useColorModeValue("gray.700", "gray.200");
  const transitionOverlayBg = useColorModeValue(
    "rgba(255, 255, 255, 0.72)",
    "rgba(26, 32, 44, 0.72)"
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSendingMessage]);

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
              <Text fontWeight="bold" fontSize="md" color={headingColor}>
                {activeChatTitle ?? "Chat RAG"}
              </Text>
              <Text fontSize="xs" color="gray.500">
                AI-powered knowledge assistant
              </Text>
            </Box>
          </Flex>

          {activeChatId ? (
            <IconButton
              aria-label="Delete chat"
              variant="ghost"
              size="sm"
              onClick={openDeleteDialog}
              isLoading={isDeletingChat}
              icon={
                <Icon viewBox="0 0 24 24" boxSize={4}>
                  <path
                    fill="currentColor"
                    d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
                  />
                </Icon>
              }
            />
          ) : null}
        </Flex>

        <Box
          flex="1"
          overflowY="auto"
          px={4}
          py={4}
          position="relative"
          transition="opacity 0.2s ease"
          opacity={isSwitchingChats ? 0.72 : 1}
        >
          {isSwitchingChats ? (
            <Flex
              position="absolute"
              inset={4}
              align="center"
              justify="center"
              bg={transitionOverlayBg}
              borderRadius="xl"
              zIndex={1}
              pointerEvents="none"
            >
              <Flex align="center" gap={2}>
                <Spinner size="sm" color="blue.400" />
                <Text fontSize="sm" color="gray.500">
                  Loading conversation...
                </Text>
              </Flex>
            </Flex>
          ) : null}

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

              {isSendingMessage ? (
                <Flex align="center" gap={2} px={2}>
                  <Spinner size="xs" color="blue.400" />
                  <Text fontSize="sm" color="gray.500">
                    Thinking...
                  </Text>
                </Flex>
              ) : null}

              <div ref={messagesEndRef} />
            </VStack>
          )}
        </Box>

        <ChatInput
          onSend={sendMessage}
          isDisabled={isSendingMessage || isDeletingChat}
        />
      </Flex>

      <AlertDialog
        isOpen={isDeleteDialogOpen}
        leastDestructiveRef={cancelDeleteRef}
        onClose={closeDeleteDialog}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete chat
            </AlertDialogHeader>

            <AlertDialogBody>
              This permanently deletes the selected conversation from Supabase.
              This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelDeleteRef} onClick={closeDeleteDialog}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={() => {
                  void deleteActiveChat().finally(closeDeleteDialog);
                }}
                ml={3}
                isLoading={isDeletingChat}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </AppShell>
  );
}

export default ChatRagPage;
