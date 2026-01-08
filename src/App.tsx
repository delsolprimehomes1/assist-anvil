import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import Carriers from "./pages/Carriers";
import Tools from "./pages/Tools";
import Training from "./pages/Training";
import TrainingPlayer from "./pages/TrainingPlayer";
import Marketing from "./pages/Marketing";
import Compliance from "./pages/Compliance";
import AIAssist from "./pages/AIAssist";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import AcceptInvitation from "./pages/AcceptInvitation";
import PendingApproval from "./pages/PendingApproval";
import ProfileSettings from "./pages/ProfileSettings";
import NotFound from "./pages/NotFound";
import News from "./pages/News";
import ResetPassword from "./pages/ResetPassword";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/accept-invitation" element={<AcceptInvitation />} />
          <Route path="/pending-approval" element={<PendingApproval />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          
          {/* Protected Dashboard Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="carriers" element={<Carriers />} />
            <Route path="news" element={<News />} />
            <Route path="ai-assist" element={<AIAssist />} />
            <Route path="tools" element={<Tools />} />
            <Route path="training" element={<Training />} />
            <Route path="training/:trainingId" element={<TrainingPlayer />} />
            <Route path="marketing" element={<Marketing />} />
            <Route path="compliance" element={<Compliance />} />
            <Route path="profile" element={<ProfileSettings />} />
            <Route path="admin" element={<Admin />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
