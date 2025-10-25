import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Carriers from "./pages/Carriers";
import Tools from "./pages/Tools";
import Training from "./pages/Training";
import Marketing from "./pages/Marketing";
import Compliance from "./pages/Compliance";
import AIAssist from "./pages/AIAssist";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import AcceptInvitation from "./pages/AcceptInvitation";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/accept-invitation" element={<AcceptInvitation />} />
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="carriers" element={<Carriers />} />
          <Route path="ai-assist" element={<AIAssist />} />
          <Route path="tools" element={<Tools />} />
          <Route path="training" element={<Training />} />
          <Route path="marketing" element={<Marketing />} />
          <Route path="compliance" element={<Compliance />} />
          <Route path="admin" element={<Admin />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
