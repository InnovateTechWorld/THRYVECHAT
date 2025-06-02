import React from 'react';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'react-router-dom';

const FloatingSidebarToggle = () => {
  const { toggleSidebar, open } = useSidebar();
    const location = useLocation();

    const shouldShow = location.pathname === '/chat' || location.pathname.startsWith('/chat');
  if (!shouldShow) return null;

  return (
    <div 
      className={`fixed z-50 transition-all duration-300 ${
        open ? 'left-64 ml-4' : 'left-4'
      }`}
      style={{ top: '70px' }} // Move it below the header area
    >
      <Button
        variant="outline"
        size="sm"
        onClick={toggleSidebar}
        className="shadow-lg border-2 bg-background/95 backdrop-blur-sm hover:bg-background transition-all duration-200 hover:scale-105"
        title="Toggle Sidebar"
      >
        <Menu className="w-4 h-4" />
      </Button>
    </div>
  );
};

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full relative overflow-hidden"> {/* Added overflow-hidden */}
        <AppSidebar />
        <FloatingSidebarToggle />
        <SidebarInset className="flex-1 flex flex-col h-screen overflow-auto"> {/* Added flex flex-col h-screen overflow-auto */}
          {children}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};