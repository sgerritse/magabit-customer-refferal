import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AdminSwitchProvider } from "@/contexts/AdminSwitchContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { SessionManagerWrapper } from "@/components/auth/SessionManagerWrapper";
import Dashboard from "./pages/Dashboard";
import Progress from "./pages/Progress";
import Community from "./pages/Community";
import Podcasts from "./pages/Podcasts";
import GettingStarted from "./pages/GettingStarted";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Billing from "./pages/Billing";
import Admin from "./pages/Admin";
import Register from "./pages/Register";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import BrandAmbassador from "./pages/BrandAmbassador";
import Plans from "./pages/Plans";
import AmbassadorLandingPage from "./pages/AmbassadorLandingPage";
import Health from "./pages/Health";
import HeadersPage from "./pages/Headers";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <SessionManagerWrapper>
          <AdminSwitchProvider>
            <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route 
                path="/getting-started" 
                element={
                  <ProtectedRoute>
                    <GettingStarted />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/progress" 
                element={
                  <ProtectedRoute>
                    <Progress />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/community" 
                element={
                  <ProtectedRoute>
                    <Community />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/podcasts" 
                element={
                  <ProtectedRoute>
                    <Podcasts />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/brand-ambassador" 
                element={
                  <ProtectedRoute>
                    <BrandAmbassador />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/settings" 
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/billing" 
                element={
                  <ProtectedRoute>
                    <Billing />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/plans" 
                element={
                  <ProtectedRoute>
                    <Plans />
                  </ProtectedRoute>
                } 
              />
              <Route path="/register" element={<Register />} />
              <Route 
                path="/admin" 
                element={
                  <AdminRoute>
                    <Admin />
                  </AdminRoute>
                } 
              />
              <Route path="/auth" element={<Auth />} />
              <Route path="/health" element={<Health />} />
              <Route path="/headers" element={<HeadersPage />} />
              <Route path="/ambassador/:username" element={<AmbassadorLandingPage />} />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
            </TooltipProvider>
          </AdminSwitchProvider>
        </SessionManagerWrapper>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
