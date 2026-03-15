import { useState, type FormEvent, type KeyboardEvent } from "react";
import {
  Box,
  Flex,
  Input,
  IconButton,
  Icon,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";

interface ChatInputProps {
  onSend: (message: string) => void;
  isDisabled: boolean;
}

export function ChatInput({ onSend, isDisabled }: ChatInputProps) {
  const [value, setValue] = useState("");
  const inputBg = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const fieldBg = useColorModeValue("gray.50", "gray.800");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || isDisabled) return;
    onSend(trimmed);
    setValue("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <Box borderTop="1px" borderColor={borderColor} bg={inputBg} p={4}>
      <Flex as="form" onSubmit={handleSubmit} gap={3} align="center">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask something..."
          size="lg"
          borderRadius="xl"
          bg={fieldBg}
          _focus={{
            borderColor: "blue.400",
            boxShadow: "0 0 0 1px var(--chakra-colors-blue-400)",
          }}
          isDisabled={isDisabled}
          id="chat-input"
        />
        <IconButton
          type="submit"
          aria-label="Send message"
          icon={
            <Icon viewBox="0 0 24 24" boxSize={5}>
              <path
                fill="currentColor"
                d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"
              />
            </Icon>
          }
          colorScheme="blue"
          size="lg"
          borderRadius="xl"
          isDisabled={isDisabled || !value.trim()}
          isLoading={isDisabled}
        />
      </Flex>
    </Box>
  );
}

export default ChatInput;
