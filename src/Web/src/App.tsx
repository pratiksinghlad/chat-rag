/**
 * Main Application Component
 *
 * Sets up routing and authentication context for the application.
 */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ChakraProvider } from "@chakra-ui/react";
import { AuthProvider } from "@/context/AuthContext";
import { ChatHistoryProvider } from "@/context/ChatHistoryContext";
import { TwoFactorProvider } from "@/features/auth-mfa/context/TwoFactorContext";
import { RequireTwoFactor } from "@/features/auth-mfa/components/RequireTwoFactor";
import LandingPage from "@/pages/LandingPage";
import ProfilePage from "@/pages/ProfilePage";
import ChatRagPage from "@/pages/ChatRagPage";
import KnowledgeBaseDocuments from "@/pages/KnowledgeBaseDocuments";
import theme from "@/theme";
import "@/styles/index.css";

function App() {
  return (
    <ChakraProvider theme={theme}>
      <AuthProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <ChatHistoryProvider>
            {/* TwoFactorProvider sits inside AuthProvider so it can read the
                session, and outside individual pages so MFA state persists
                across route transitions. */}
            <TwoFactorProvider>
              <Routes>
                {/* Landing page (login) — excluded from 2FA guard */}
                <Route path="/" element={<LandingPage />} />

                {/* Profile page (2FA protected) */}
                <Route
                  path="/profile"
                  element={
                    <RequireTwoFactor>
                      <ProfilePage />
                    </RequireTwoFactor>
                  }
                />

                {/* Chat RAG page (2FA protected) */}
                <Route
                  path="/chat"
                  element={
                    <RequireTwoFactor>
                      <ChatRagPage />
                    </RequireTwoFactor>
                  }
                />
                <Route
                  path="/chat/:chatId"
                  element={
                    <RequireTwoFactor>
                      <ChatRagPage />
                    </RequireTwoFactor>
                  }
                />

                {/* Knowledge Base Documents page (2FA protected) */}
                <Route
                  path="/documents"
                  element={
                    <RequireTwoFactor>
                      <KnowledgeBaseDocuments />
                    </RequireTwoFactor>
                  }
                />

                {/* Catch-all redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </TwoFactorProvider>
          </ChatHistoryProvider>
        </BrowserRouter>
      </AuthProvider>
    </ChakraProvider>
  );
}

export default App;
