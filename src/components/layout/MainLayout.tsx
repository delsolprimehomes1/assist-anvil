import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Header } from "@/components/layout/Header";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <main className={cn(
          "flex-1 min-h-screen transition-all duration-700 pb-28 md:pb-0 safe-bottom",
          sidebarOpen && isMobile && "scale-95 blur-[2px]"
        )}>
          <div className="w-full max-w-none px-4 md:px-6 py-6">
            <Outlet />
          </div>
        </main>
      </div>
      
      {isMobile && <BottomNav />}
    </div>
  );
};