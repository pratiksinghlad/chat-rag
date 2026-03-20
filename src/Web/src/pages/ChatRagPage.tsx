import { useRef, useEffect } from "react";
import { Navigate, Link } from "react-router-dom";
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
  Badge,
} from "@chakra-ui/react";
import { useAuth } from "@/context/AuthContext";
import { useChatRag } from "@/hooks/useChatRag";
import AppShell from "@/components/AppShell";
import ChatMessageBubble from "@/components/chat/ChatMessage";
import ChatInput from "@/components/chat/ChatInput";
import LoadingSpinner from "@/components/LoadingSpinner";
import { motion, AnimatePresence } from "framer-motion";

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);

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

  const emptyBg = useColorModeValue("white", "gray.900");
  const chatBg = useColorModeValue("white", "gray.900");
  const headerBorderColor = useColorModeValue("gray.100", "gray.700");
  const headerBg = useColorModeValue("white", "gray.900");
  const headingColor = useColorModeValue("gray.800", "white");
  const emptyHeadingColor = useColorModeValue("gray.700", "gray.200");
  const transitionOverlayBg = useColorModeValue(
    "rgba(255, 255, 255, 0.8)",
    "rgba(10, 10, 10, 0.8)"
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
        h="full"
        w="100%"
        bg={chatBg}
        borderRadius={{ base: "none", md: "2xl" }}
        overflow="hidden"
        boxShadow={{ base: "none", md: "xl" }}
        borderWidth={{ base: "0", md: "1px" }}
        borderColor={headerBorderColor}
        position="relative"
      >
        <Flex
          align="center"
          justify="space-between"
          px={{ base: 4, md: 6 }}
          py={4}
          borderBottom="1px"
          borderColor={headerBorderColor}
          bg={headerBg}
          zIndex={5}
        >
          <Flex align="center" gap={3}>
            <Box 
              p={2.5} 
              bg={useColorModeValue("blue.50", "rgba(66, 153, 225, 0.1)")} 
              borderRadius="xl" 
              color="blue.500"
              display={{ base: "none", sm: "block" }}
            >
              <Icon viewBox="0 0 24 24" boxSize={5}>
                <path
                  fill="currentColor"
                  d="M21 15c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2h-2V3c0-1.1-.9-2-2-2H7c-1.1 0-2 .9-2 2v2H3c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h2v4l4-4h4l4 4v-4h2zm-4-3l-4 4h-4l-4 4v-4H5V7h14v5z"
                />
              </Icon>
            </Box>
            <Box>
              <Flex align="center" gap={2}>
                <Text fontWeight="bold" fontSize="lg" color={headingColor} noOfLines={1}>
                  {activeChatTitle ?? "New Conversation"}
                </Text>
                {activeChatId && (
                  <Badge colorScheme="blue" variant="subtle" borderRadius="full" px={2}>
                    Active
                  </Badge>
                )}
              </Flex>
              <Text fontSize="xs" color="gray.500" fontWeight="medium">
                AI Knowledge Assistant
              </Text>
            </Box>
          </Flex>

          <Flex align="center" gap={2}>
            <Button
              as={Link}
              to="/documents"
              size="sm"
              variant="ghost"
              color="gray.600"
              fontWeight="medium"
              leftIcon={
                <Icon viewBox="0 0 24 24" boxSize={4}>
                  <path
                    fill="currentColor"
                    d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.1-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-3.45.3-5 1V7c1.55-.7 3.3-1 5-1 1.2 0 2.4.15 3.5.5v11zm-10 1c-1.55-.7-3.3-1-5-1-1.45 0-3.4.45-4.75 1.1V7c1.2-.5 2.5-.75 3.75-.75 1.7 0 3.45.3 5 1v11.75z"
                  />
                </Icon>
              }
              display={{ base: "none", md: "flex" }}
              _hover={{ bg: "blue.50", color: "blue.600" }}
              borderRadius="xl"
            >
              Knowledge Base
            </Button>
            
            <IconButton
              as={Link}
              to="/documents"
              aria-label="Knowledge Base"
              variant="ghost"
              size="md"
              display={{ base: "flex", md: "none" }}
              borderRadius="xl"
              icon={
                <Icon viewBox="0 0 24 24" boxSize={5}>
                  <path
                    fill="currentColor"
                    d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.1-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-3.45.3-5 1V7c1.55-.7 3.3-1 5-1 1.2 0 2.4.15 3.5.5v11zm-10 1c-1.55-.7-3.3-1-5-1-1.45 0-3.4.45-4.75 1.1V7c1.2-.5 2.5-.75 3.75-.75 1.7 0 3.45.3 5 1v11.75z"
                  />
                </Icon>
              }
            />

            {activeChatId ? (
              <IconButton
                aria-label="Delete chat"
                variant="ghost"
                size="md"
                onClick={openDeleteDialog}
                isLoading={isDeletingChat}
                borderRadius="xl"
                icon={
                  <Icon viewBox="0 0 24 24" boxSize={4}>
                    <path
                      fill="currentColor"
                      d="M16 9v10H8V9h8m-1.5-6h-5l-1 1H5v2h14V4h-3.5l-1-1zM18 7H6v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7z"
                    />
                  </Icon>
                }
                _hover={{ bg: "red.50", color: "red.500" }}
              />
            ) : null}
          </Flex>
        </Flex>

        <Box
          flex="1"
          minH={0}
          position="relative"
          bg={emptyBg}
        >
          <AnimatePresence>
            {isSwitchingChats && (
              <MotionFlex
                position="absolute"
                inset={0}
                align="center"
                justify="center"
                bg={transitionOverlayBg}
                zIndex={10}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <VStack spacing={4}>
                  <Spinner size="lg" thickness="3px" color="blue.500" emptyColor="gray.200" />
                  <Text fontWeight="medium" color="gray.600">
                    Syncing conversation...
                  </Text>
                </VStack>
              </MotionFlex>
            )}
          </AnimatePresence>

          <Box
            h="full"
            overflowY="auto"
            px={{ base: 4, md: 6, lg: 8 }}
            py={{ base: 6, md: 8 }}
            css={{
              "&::-webkit-scrollbar": { width: "6px" },
              "&::-webkit-scrollbar-track": { background: "transparent" },
              "&::-webkit-scrollbar-thumb": { 
                background: useColorModeValue("#E2E8F0", "#2D3748"),
                borderRadius: "10px" 
              },
            }}
          >
            {messages.length === 0 ? (
              <MotionBox
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                h="full"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <VStack spacing={6} maxW="2xl" mx="auto" textAlign="center" p={8}>
                  <Box
                    p={6}
                    bg={useColorModeValue("blue.50", "rgba(66, 153, 225, 0.1)")}
                    borderRadius="3xl"
                    color="blue.500"
                    boxShadow="inner"
                  >
                    <Icon viewBox="0 0 24 24" boxSize={12}>
                      <path
                        fill="currentColor"
                        d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12zm-9-4h2v2h-2zm0-6h2v4h-2z"
                      />
                    </Icon>
                  </Box>
                  <Box>
                    <Text
                      fontSize={{ base: "2xl", md: "3xl" }}
                      fontWeight="bold"
                      color={emptyHeadingColor}
                      mb={3}
                      letterSpacing="tight"
                    >
                      How can I help you today?
                    </Text>
                    <Text color="gray.500" fontSize="lg" lineHeight="tall" maxW="md" mx="auto">
                      Ask about your documentation, project specs, or start a general brainstorming session.
                    </Text>
                  </Box>
                  <Flex gap={3} flexWrap="wrap" justify="center">
                    {["Summarize our project", "Check technical specs", "Write a proposal"].map((suggestion) => (
                      <Button
                        key={suggestion}
                        size="sm"
                        variant="outline"
                        borderRadius="full"
                        onClick={() => sendMessage({ message: suggestion, mode: "all" })}
                        _hover={{ bg: "blue.50", borderColor: "blue.200", color: "blue.600" }}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </Flex>
                </VStack>
              </MotionBox>
            ) : (
              <VStack spacing={6} align="stretch" maxW="4xl" mx="auto" pb={4}>
                {messages.map((msg) => (
                  <ChatMessageBubble key={msg.id} message={msg} />
                ))}

                {isSendingMessage ? (
                  <Flex align="center" gap={3} px={4} py={3}>
                    <Box position="relative" display="flex" alignItems="center" justifyContent="center">
                      <Spinner size="xs" color="blue.500" thickness="2px" />
                      <Box 
                        as={motion.div}
                        position="absolute"
                        w="full"
                        h="full"
                        borderRadius="full"
                        border="2px solid"
                        borderColor="blue.200"
                        animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                        transition={{ duration: 1, repeat: Infinity } as any}
                      />
                    </Box>
                    <Text fontSize="sm" color="gray.500" fontWeight="medium" letterSpacing="wide">
                      THINKING...
                    </Text>
                  </Flex>
                ) : null}

                <div ref={messagesEndRef} />
              </VStack>
            )}
          </Box>
        </Box>

        <Box 
          px={{ base: 0, md: 4 }} 
          pb={{ base: 0, md: 4 }} 
          bg={chatBg}
        >
          <ChatInput
            onSend={sendMessage}
            isDisabled={isSendingMessage || isDeletingChat}
          />
        </Box>
      </Flex>

      <AlertDialog
        isOpen={isDeleteDialogOpen}
        leastDestructiveRef={cancelDeleteRef}
        onClose={closeDeleteDialog}
        isCentered
      >
        <AlertDialogOverlay backdropFilter="blur(4px)" bg="blackAlpha.600">
          <AlertDialogContent borderRadius="2xl" p={2}>
            <AlertDialogHeader fontSize="xl" fontWeight="bold">
              Delete Conversation
            </AlertDialogHeader>

            <AlertDialogBody color="gray.600">
              Are you sure? This will permanently remove this chat and all its history. This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter gap={3}>
              <Button ref={cancelDeleteRef} onClick={closeDeleteDialog} variant="ghost" borderRadius="xl">
                Keep Chat
              </Button>
              <Button
                colorScheme="red"
                borderRadius="xl"
                onClick={() => {
                  void deleteActiveChat().finally(closeDeleteDialog);
                }}
                isLoading={isDeletingChat}
                px={6}
              >
                Delete Permanently
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </AppShell>
  );
}

export default ChatRagPage;
