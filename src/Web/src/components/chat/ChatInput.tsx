import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import {
  Box,
  Flex,
  IconButton,
  Icon,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Textarea,
  Text,
  useColorModeValue,
  Tooltip,
  Button,
} from "@chakra-ui/react";
import {
  CHAT_MODE_OPTIONS,
  DEFAULT_CHAT_MODE,
  type ChatMode,
} from "@/types/chat-mode";

interface ChatInputProps {
  onSend: (input: { message: string; mode: ChatMode }) => void | Promise<void>;
  isDisabled: boolean;
}

export function ChatInput({ onSend, isDisabled }: ChatInputProps) {
  const [value, setValue] = useState("");
  const [mode, setMode] = useState<ChatMode>(DEFAULT_CHAT_MODE);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const bg = useColorModeValue("white", "gray.900");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const inputBg = useColorModeValue("gray.50", "gray.800");
  const focusBorderColor = useColorModeValue("blue.500", "blue.400");
  const textColor = useColorModeValue("gray.800", "gray.100");
  const placeholderColor = useColorModeValue("gray.400", "gray.500");
  const helperTextColor = useColorModeValue("gray.500", "gray.400");
  const disclaimerBg = useColorModeValue("orange.50", "rgba(251, 211, 141, 0.08)");
  const menuButtonHoverBg = useColorModeValue("gray.200", "gray.700");
  const selectedItemBg = useColorModeValue("blue.50", "blue.900");
  const itemHoverBg = useColorModeValue("gray.100", "gray.700");

  const selectedMode = CHAT_MODE_OPTIONS.find((option) => option.value === mode);

  useEffect(() => {
    syncTextareaHeight(textareaRef.current);
  }, [value]);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || isDisabled) return;
    onSend({ message: trimmed, mode });
    setValue("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Box
      borderTop="1px"
      borderColor={borderColor}
      bg={bg}
      px={{ base: 2, md: 4, lg: 6 }}
      py={{ base: 1.5, md: 2 }}
      flexShrink={0}
      zIndex={10}
    >
      <Box maxW="4xl" mx="auto">
        <Box
          position="relative"
          bg={inputBg}
          borderRadius="2xl"
          borderWidth="1px"
          borderColor={borderColor}
          transition="all 0.2s"
          _focusWithin={{
            borderColor: focusBorderColor,
            boxShadow: `0 0 0 1px ${focusBorderColor}`,
            bg: bg,
          }}
          p={1}
        >
          <Flex align="center" px={2} py={1} gap={2}>
            <Menu gutter={8}>
              <Tooltip label="Change response mode" fontSize="xs" placement="top" hasArrow>
                <MenuButton
                  as={Button}
                  variant="ghost"
                  size="sm"
                  px={2}
                  leftIcon={
                    <Icon viewBox="0 0 24 24" boxSize={4}>
                      <path
                        fill="currentColor"
                        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
                      />
                      <circle cx="12" cy="12" r="3" fill="currentColor" />
                    </Icon>
                  }
                  rightIcon={
                    <Icon viewBox="0 0 24 24" boxSize={3}>
                      <path fill="currentColor" d="M7 10l5 5 5-5z" />
                    </Icon>
                  }
                  borderRadius="full"
                  fontWeight="medium"
                  fontSize="xs"
                  color={helperTextColor}
                  _hover={{ bg: menuButtonHoverBg }}
                  isDisabled={isDisabled}
                  display={{ base: "none", sm: "flex" }}
                >
                  {selectedMode?.label}
                </MenuButton>
              </Tooltip>
              <MenuList
                bg={bg}
                borderColor={borderColor}
                boxShadow="lg"
                borderRadius="xl"
                py={2}
              >
                {CHAT_MODE_OPTIONS.map((option) => (
                  <MenuItem
                    key={option.value}
                    onClick={() => setMode(option.value as ChatMode)}
                    fontSize="sm"
                    fontWeight={mode === option.value ? "bold" : "normal"}
                    bg={mode === option.value ? selectedItemBg : "transparent"}
                    color={mode === option.value ? "blue.500" : "inherit"}
                    _hover={{ bg: itemHoverBg }}
                    px={4}
                    py={2}
                  >
                    <Box>
                      <Text fontWeight="semibold">{option.label}</Text>
                      <Text fontSize="xs" color={helperTextColor} noOfLines={1}>
                        {option.description}
                      </Text>
                    </Box>
                  </MenuItem>
                ))}
              </MenuList>
            </Menu>

            {/* Mobile Mode Button (only icon) */}
            <Menu gutter={8}>
              <MenuButton
                as={IconButton}
                variant="ghost"
                size="sm"
                display={{ base: "flex", sm: "none" }}
                icon={
                  <Icon viewBox="0 0 24 24" boxSize={4}>
                    <path
                      fill="currentColor"
                      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
                    />
                    <circle cx="12" cy="12" r="3" fill="currentColor" />
                  </Icon>
                }
                isDisabled={isDisabled}
                aria-label="Change mode"
                borderRadius="full"
              />
              <MenuList>
                {CHAT_MODE_OPTIONS.map((option) => (
                  <MenuItem
                    key={option.value}
                    onClick={() => setMode(option.value as ChatMode)}
                    fontSize="sm"
                  >
                    {option.label}
                  </MenuItem>
                ))}
              </MenuList>
            </Menu>

            <Box flex={1}>
              <Textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  syncTextareaHeight(e.currentTarget);
                }}
                onKeyDown={handleKeyDown}
                placeholder={selectedMode?.placeholder ?? "Ask anything..."}
                variant="unstyled"
                minH="16px"
                maxH="150px"
                resize="none"
                fontSize="md"
                lineHeight="tall"
                color={textColor}
                _placeholder={{ color: placeholderColor }}
                isDisabled={isDisabled}
                id="chat-input"
                py={1}
              />
            </Box>

            <IconButton
              aria-label="Send message"
              icon={
                <Icon viewBox="0 0 24 24" boxSize={4}>
                  <path
                    fill="currentColor"
                    d="M3.4 20.4l17.45-7.48c.81-.35.81-1.49 0-1.84L3.4 3.6c-.66-.29-1.39.2-1.39.91L2 9.12c0 .5.37.93.87.99L17 12 2.87 12.88c-.5.07-.87.5-.87 1l.01 4.61c0 .71.73 1.2 1.39.91z"
                  />
                </Icon>
              }
              colorScheme="blue"
              size="sm"
              borderRadius="lg"
              onClick={handleSubmit}
              isDisabled={isDisabled || !value.trim()}
              isLoading={isDisabled}
              boxShadow="sm"
              _hover={{ transform: "translateY(-1px)", boxShadow: "md" }}
              _active={{ transform: "translateY(0)" }}
              transition="all 0.2s"
            />
          </Flex>
        </Box>

        <Box
          mt={1}
          px={3}
          py={0.5}
          borderRadius="md"
          bg={disclaimerBg}
          borderWidth="1px"
          borderColor="orange.100"
          display="inline-flex"
          alignItems="center"
          gap={1.5}
        >
          <Text color="red.600" fontSize="2xs" fontWeight="medium" lineHeight="shorter">
            {"\u26A0\uFE0F"} Please avoid entering sensitive or confidential
            information. This system uses a cloud-based LLM provider to process
            requests.
          </Text>
        </Box>
      </Box>
    </Box>
  );
}

export default ChatInput;

function syncTextareaHeight(element: HTMLTextAreaElement | null) {
  if (!element) {
    return;
  }

  element.style.height = "auto";
  element.style.height = `${Math.min(element.scrollHeight, 180)}px`;
}
