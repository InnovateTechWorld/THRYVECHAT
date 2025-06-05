import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { ChatInterface } from '@/components/ChatInterface';
import { MemorySidebar } from '@/components/MemorySidebar';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Brain } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const Chat = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sessionId, setSessionId] = useState<string>('');
  const [isMemorySidebarOpen, setIsMemorySidebarOpen] = useState(false); // Start closed
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLayoutReady, setIsLayoutReady] = useState(false); // ADD THIS


  useEffect(() => {
    // Get session ID from URL params or create a new one
    const urlSessionId = searchParams.get('session');
    if (urlSessionId) {
      setSessionId(urlSessionId);
    } else {
      const newSessionId = uuidv4();
      setSessionId(newSessionId);
      setSearchParams({ session: newSessionId });
    }

    // Set initialization with delay to prevent layout flash
    const initTimer = setTimeout(() => {
      setIsInitialized(true);
      // Additional delay for layout stabilization
      setTimeout(() => {
        setIsLayoutReady(true);
        if (window.innerWidth >= 768) {
          setIsMemorySidebarOpen(false);
        }
      }, 100);
    }, 150);

    return () => clearTimeout(initTimer);
  }, [searchParams, setSearchParams]);

  // Show loading until both are ready
  if (!sessionId || !isInitialized || !isLayoutReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Initializing chat...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="flex h-screen overflow-hidden relative">
        {/* Main Chat Area */}

        <div className="flex-1 flex flex-col min-w-0 w-full"> {/* Re-added w-full */}
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-card text-foreground"> {/* Ensured bg-card and text-foreground */}
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-lg font-semibold gradient-text">Echo Verse AI Flow</h1>
                <p className="text-sm text-muted-foreground">Multi-model AI conversations with persistent memory</p>
              </div>
            </div>
          </div>
          
          {/* Chat Interface */}
          <ChatInterface sessionId={sessionId} />
        </div>

        {/* Desktop Memory Sidebar - Only show on desktop */}
        <div className={`hidden md:block transition-all duration-300 ease-in-out border-l border-border/50 ${
          isMemorySidebarOpen ? 'w-80' : 'w-0'
        } overflow-hidden bg-background`}>
          {isMemorySidebarOpen && (
            <div className="w-80 h-full">
              <MemorySidebar />
            </div>
          )}
        </div>

        {/* Desktop Floating Memory Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMemorySidebarOpen(!isMemorySidebarOpen)}
          className={`hidden md:flex fixed z-50 items-center gap-2 shadow-lg border-2 bg-background/95 backdrop-blur-sm hover:bg-background transition-all duration-300 ${
            isMemorySidebarOpen ? 'right-[336px]' : 'right-6'
          }`}
          style={{ 
            top: '60%', 
            transform: 'translateY(-50%)'
          }}
          title={isMemorySidebarOpen ? 'Hide Memory' : 'Show Memory'}
        >
          <Brain className="w-4 h-4" />
          <span className="text-sm font-medium">
            {isMemorySidebarOpen ? 'Hide' : 'Memory'}
          </span>
        </Button>

        {/* Mobile Memory Toggle - Bottom Right */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMemorySidebarOpen(!isMemorySidebarOpen)}
          className="md:hidden fixed bottom-20 right-4 z-50 w-12 h-12 rounded-full shadow-lg border-2 bg-background/95 backdrop-blur-sm hover:bg-background transition-all duration-300"
          title={isMemorySidebarOpen ? 'Hide Memory' : 'Show Memory'}
        >
          <Brain className="w-5 h-5" />
        </Button>

        {/* Mobile Memory Sidebar Overlay */}
        {isMemorySidebarOpen && (
          <div 
            className="md:hidden fixed inset-0 bg-black/50 z-40" 
            onClick={() => setIsMemorySidebarOpen(false)} 
          />
        )}

        {/* Mobile Memory Sidebar */}
        <div className={`md:hidden fixed top-0 right-0 bottom-0 w-80 max-w-[90vw] bg-background border-l border-border/50 z-50 transition-transform duration-300 ease-in-out ${
          isMemorySidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          {isMemorySidebarOpen && (
            <div className="w-full h-full">
              <MemorySidebar />
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Chat;