import { Box, Flex, useColorModeValue } from "@chakra-ui/react";
import { useLocation } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const location = useLocation();
  const bg = useColorModeValue("gray.50", "gray.900");
  const isChatRoute = location.pathname.startsWith("/chat");

  return (
    <Flex h="100vh" flexDir="column" bg={bg} overflow="hidden">
      <Header />
      <Flex flex="1" minH={0} overflow="hidden">
        {isChatRoute ? <Sidebar /> : null}
        <Box
          flex="1"
          minH={0}
          overflowY={isChatRoute ? "hidden" : "auto"}
          p={isChatRoute ? { base: 0, md: 4, lg: 5 } : { base: 4, md: 6, lg: 8 }}
        >
          {children}
        </Box>
      </Flex>
    </Flex>
  );
}

export default AppShell;
