import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Header } from "@/components/layout/Header";
import { useIsMobile } from "@/hooks/use-mobile";

export const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex">
        {!isMobile && (
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        )}
        
        <main className="flex-1 min-h-screen transition-smooth pb-20 md:pb-0">
          <div className="w-full max-w-none px-4 md:px-6 py-6">
            <Outlet />
          </div>
        </main>
      </div>
      
      {isMobile && <BottomNav />}
    </div>
  );
};