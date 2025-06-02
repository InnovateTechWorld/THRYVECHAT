
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Chat from "./pages/Chat";
import Models from "./pages/Models";
import Notes from "./pages/Notes";
import Sessions from "./pages/Sessions";
import Memory from "./pages/Memory";
import Exports from "./pages/Exports";
import Usage from "./pages/Usage";
import Connected from "./pages/Connected";
import Billing from "./pages/Billing";
import Settings from "./pages/Settings";
import ApiAnalytics from "./pages/ApiAnalytics";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/chat" element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            } />
            <Route path="/models" element={
              <ProtectedRoute>
                <Models />
              </ProtectedRoute>
            } />
            <Route path="/notes" element={
              <ProtectedRoute>
                <Notes />
              </ProtectedRoute>
            } />
            <Route path="/sessions" element={
              <ProtectedRoute>
                <Sessions />
              </ProtectedRoute>
            } />
            <Route path="/memory" element={
              <ProtectedRoute>
                <Memory />
              </ProtectedRoute>
            } />
            <Route path="/exports" element={
              <ProtectedRoute>
                <Exports />
              </ProtectedRoute>
            } />
            <Route path="/api-analytics/:id" element={
              <ProtectedRoute>
                <ApiAnalytics />
              </ProtectedRoute>
            } />
            <Route path="/usage" element={
              <ProtectedRoute>
                <Usage />
              </ProtectedRoute>
            } />
            <Route path="/connected" element={
              <ProtectedRoute>
                <Connected />
              </ProtectedRoute>
            } />
            <Route path="/billing" element={
              <ProtectedRoute>
                <Billing />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
