/**
 * Main Application Component
 *
 * Sets up routing and authentication context for the application.
 */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ChakraProvider } from "@chakra-ui/react";
import { AuthProvider } from "@/context/AuthContext";
import { ChatHistoryProvider } from "@/context/ChatHistoryContext";
import LandingPage from "@/pages/LandingPage";
import ProfilePage from "@/pages/ProfilePage";
import ChatRagPage from "@/pages/ChatRagPage";
import "@/styles/index.css";

function App() {
  return (
    <ChakraProvider>
      <AuthProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <ChatHistoryProvider>
            <Routes>
              {/* Landing page (login) */}
              <Route path="/" element={<LandingPage />} />

              {/* Profile page (authenticated) */}
              <Route path="/profile" element={<ProfilePage />} />

              {/* Chat RAG page (authenticated) */}
              <Route path="/chat" element={<ChatRagPage />} />
              <Route path="/chat/:chatId" element={<ChatRagPage />} />

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ChatHistoryProvider>
        </BrowserRouter>
      </AuthProvider>
    </ChakraProvider>
  );
}

export default App;
