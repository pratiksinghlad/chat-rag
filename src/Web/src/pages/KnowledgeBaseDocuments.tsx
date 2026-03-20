/**
 * Knowledge Base Documents Page
 * 
 * Allows users to view documents from the knowledge base (KT embeddings).
 */

import { useState, useEffect } from "react";
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Divider,
  useColorModeValue,
  Flex,
  Icon,
  Code,
} from "@chakra-ui/react";
import AppShell from "@/components/AppShell";
import LoadingSpinner from "@/components/LoadingSpinner";

interface DocumentItem {
  name: string;
  path: string;
  type: "md" | "txt" | "json";
}

const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "");

// Dynamically discover all documents in the public/documents folder
// Using relative path to avoid /public prefix warnings and query syntax for URL resolution
const globbedDocs = import.meta.glob("../../public/documents/*.{md,txt,json}", { 
  eager: true, 
  query: '?url', 
  import: 'default' 
});

const DOCUMENTS: DocumentItem[] = Object.keys(globbedDocs).map((fullPath) => {
  // Extract filename with extension: "../../public/documents/company-handbook.md" -> "company-handbook.md"
  const fileNameWithExt = fullPath.split("/").pop() || "";
  const [fileName, extension] = fileNameWithExt.split(".");
  
  // Format readable name: "company-handbook" -> "Company Handbook"
  const name = fileName
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  // Final URL path must be relative to the served root and include BASE_URL
  // Results in: /chat-rag-web/documents/faq.json
  const path = `${BASE_URL}/documents/${fileNameWithExt}`;

  return {
    name: name === "Faq" ? "FAQ" : name, // Special case for FAQ
    path,
    type: extension as "md" | "txt" | "json"
  };
});

export function KnowledgeBaseDocuments() {
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [content, setContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const borderColor = useColorModeValue("gray.200", "gray.700");
  const listBg = useColorModeValue("gray.50", "gray.900");
  const contentBg = useColorModeValue("white", "gray.800");

  useEffect(() => {
    if (selectedDoc) {
      void loadDocument(selectedDoc);
    }
  }, [selectedDoc]);

  const loadDocument = async (doc: DocumentItem) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(doc.path);
      if (!response.ok) {
        throw new Error(`Failed to load document: ${response.statusText}`);
      }
      const text = await response.text();
      setContent(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      setContent("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppShell>
      <Flex h="full" direction={{ base: "column", md: "row" }} gap={6}>
        {/* Document List (Sidebar-like) */}
        <Box
          w={{ base: "full", md: "250px", lg: "300px" }}
          bg={listBg}
          borderRadius="xl"
          borderWidth="1px"
          borderColor={borderColor}
          p={4}
          overflowY="auto"
        >
          <VStack align="stretch" spacing={4}>
            <Box>
              <Heading size="sm" mb={1} color="gray.700">
                Knowledge Base
              </Heading>
              <Text fontSize="xs" color="gray.500">
                Select a document to view its content
              </Text>
            </Box>
            <Divider />
            <VStack align="stretch" spacing={2}>
              {DOCUMENTS.map((doc) => (
                <Button
                  key={doc.path}
                  variant={selectedDoc?.path === doc.path ? "solid" : "ghost"}
                  colorScheme={selectedDoc?.path === doc.path ? "blue" : "gray"}
                  justifyContent="flex-start"
                  size="md"
                  onClick={() => setSelectedDoc(doc)}
                  leftIcon={
                    <Icon viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d={
                          doc.type === "json"
                            ? "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm2 10v2h2v-2H7zm0-4v2h2V9H7zm4 4v2h6v-2h-6zm0-4v2h6V9h-6z"
                            : "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"
                        }
                      />
                    </Icon>
                  }
                  textAlign="left"
                  overflow="hidden"
                  textOverflow="ellipsis"
                  whiteSpace="nowrap"
                >
                  <Text isTruncated>{doc.name}</Text>
                </Button>
              ))}
            </VStack>
          </VStack>
        </Box>

        {/* Document Viewer */}
        <Box
          flex="1"
          bg={contentBg}
          borderRadius="xl"
          borderWidth="1px"
          borderColor={borderColor}
          p={{ base: 4, md: 6 }}
          overflowY="auto"
          position="relative"
          minH="400px"
        >
          {!selectedDoc ? (
            <Flex
              h="full"
              direction="column"
              align="center"
              justify="center"
              textAlign="center"
              py={20}
            >
              <Icon
                viewBox="0 0 24 24"
                boxSize={12}
                color="gray.300"
                mb={4}
              >
                <path
                  fill="currentColor"
                  d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"
                />
              </Icon>
              <Heading size="md" color="gray.400" mb={2}>
                No document selected
              </Heading>
              <Text color="gray.500">
                Choose a file from the list on the left to start viewing.
              </Text>
            </Flex>
          ) : isLoading ? (
            <LoadingSpinner message={`Loading ${selectedDoc.name}...`} />
          ) : error ? (
            <Box textAlign="center" py={10}>
              <Text color="red.500" fontWeight="bold">
                Error: {error}
              </Text>
              <Button mt={4} size="sm" onClick={() => void loadDocument(selectedDoc)}>
                Retry
              </Button>
            </Box>
          ) : (
            <VStack align="stretch" spacing={6}>
              <HStack justify="space-between">
                <Box>
                  <Heading size="lg" color="gray.800">
                    {selectedDoc.name}
                  </Heading>
                  <Text fontSize="sm" color="gray.500" mt={1}>
                    Type: {selectedDoc.type.toUpperCase()} | Source: {selectedDoc.path}
                  </Text>
                </Box>
              </HStack>
              <Divider />
              <Box
                className="document-content"
                fontSize="md"
                lineHeight="tall"
                color="gray.700"
                whiteSpace="pre-wrap"
              >
                {selectedDoc.type === "json" ? (
                  <Code
                    display="block"
                    p={4}
                    borderRadius="md"
                    w="full"
                    bg="gray.50"
                    color="blue.800"
                  >
                    {content}
                  </Code>
                ) : (
                  <Text>{content}</Text>
                )}
              </Box>
            </VStack>
          )}
        </Box>
      </Flex>
    </AppShell>
  );
}

export default KnowledgeBaseDocuments;
