import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

export const NewSessionButton = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleNewSession = () => {
    // Generate a new session ID
    const newSessionId = uuidv4();
    
    toast({
      title: "New session created",
      description: "Starting a fresh conversation.",
    });
    
    // Navigate to the chat interface with the new session ID
    navigate(`/chat?session=${newSessionId}`);
  };

  return (
    <Button onClick={handleNewSession} className="bg-primary hover:bg-primary/90">
      <MessageSquare className="w-4 h-4 mr-2" />
      New Session
    </Button>
  );
};
