
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, Bot, Trash2, Download, Loader2, MessageSquare } from 'lucide-react';
import { NewSessionButton } from '@/components/NewSessionButton';
import { useChatSessions } from '@/hooks/useChat';
import { getModelDisplayInfo } from '@/hooks/useModels';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

const Sessions = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { sessions, isLoading, deleteSession } = useChatSessions();

  const handleDeleteSession = async (sessionId: string, sessionName: string) => {
    if (confirm(`Are you sure you want to delete "${sessionName}"? This action cannot be undone.`)) {
      try {
        await deleteSession(sessionId);
        toast({
          title: "Session deleted",
          description: "Chat session has been removed.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete session. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const handleOpenSession = (sessionId: string) => {
    navigate(`/chat?session=${sessionId}`);
  };

  const handleExportSession = (sessionId: string) => {
    // TODO: Implement session export functionality
    toast({
      title: "Export feature",
      description: "Session export will be available soon.",
    });
  };

  return (
    <Layout>
      <div className="flex-1 flex flex-col bg-background text-foreground"> {/* Added bg-background, text-foreground */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-card"> {/* Changed bg-white to bg-card */}
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-semibold">Sessions</h1>
            </div>
          </div>
          <NewSessionButton />
        </div>
        
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-4 max-w-4xl">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Loading sessions...</span>
                </div>
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">No chat sessions yet</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Start your first conversation to see it here
                </p>
                <NewSessionButton />
              </div>
            ) : (
              sessions.map((session) => (
                <Card
                  key={session.id}
                  className="border border-border hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleOpenSession(session.id)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base hover:text-primary transition-colors">
                        {session.name}
                      </CardTitle>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportSession(session.id);
                          }}
                          className="hover:bg-accent"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSession(session.id, session.name);
                          }}
                          className="hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{session.message_count} messages</span>
                      <span>Updated {new Date(session.updated_at).toLocaleDateString()}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      Created {new Date(session.created_at).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </Layout>
  );
};

export default Sessions;
