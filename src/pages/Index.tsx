
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, MessageSquare } from 'lucide-react';
import { useChatSessions } from '@/hooks/useChat';
import { cn } from '@/lib/utils';

const Index = () => {
  const navigate = useNavigate();
  const { sessions, isLoading } = useChatSessions();

  const handleOpenSession = (sessionId: string) => {
    navigate(`/chat?session=${sessionId}`);
  };

  const handleChatBoxClick = () => {
    navigate('/chat');
  };

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground p-4">
        <h1 className="text-4xl font-semibold mb-8 animate-fade-in">What can I help with?</h1>
        
        <div className="w-full max-w-2xl mb-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 animate-fade-in">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Loading sessions...</span>
              </div>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12 animate-fade-in">
              <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">No chat sessions yet</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Start your first conversation to see it here
              </p>
            </div>
          ) : (
            <ScrollArea className="h-48 w-full animate-slide-in-from-bottom">
              <div className="space-y-3 px-2">
                {sessions.map((session) => (
                  <Card
                    key={session.id}
                    className="border border-border hover:shadow-md transition-shadow cursor-pointer glass-card"
                    onClick={() => handleOpenSession(session.id)}
                  >
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="text-base line-clamp-1 hover:text-primary transition-colors">
                        {session.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2 px-4 text-xs text-muted-foreground flex justify-between items-center">
                      <span>{session.message_count} messages</span>
                      <span>Updated {new Date(session.updated_at).toLocaleDateString()}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <div className="w-full max-w-2xl px-4">
          <div
            className="relative flex items-center bg-card/80 border border-border/50 rounded-xl shadow-lg animate-scale-in cursor-pointer"
            onClick={handleChatBoxClick}
          >
            <div className="flex-1 p-4 text-lg text-muted-foreground">
              Ask anything
            </div>
            <div className="flex items-center pr-4 space-x-2">
              {/* Icons removed as per user request for simplified entry page */}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
