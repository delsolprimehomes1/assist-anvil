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
          "flex-1 flex flex-col min-h-0 transition-all duration-700 pb-28 md:pb-0 safe-bottom overflow-hidden",
          sidebarOpen && isMobile && "scale-95 blur-[2px]"
        )}>
          <div className="flex-1 w-full max-w-none overflow-auto">
            <Outlet />
          </div>
        </main>
      </div>
      
      {isMobile && <BottomNav />}
    </div>
  );
};