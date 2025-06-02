import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../lib/api';

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  model_id?: string;
  file_urls?: string[];
  created_at: string;
}

export interface ChatSession {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export const useChat = (sessionId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuth();

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${session?.access_token}`,
    'Content-Type': 'application/json'
  });

  const getDeleteHeaders = () => ({
  'Authorization': `Bearer ${session?.access_token}`
});

  // Load chat history
  const loadHistory = useCallback(async () => {
    if (!session?.access_token || !sessionId) return;
    
    try {
      const response = await fetch(`${API_URL}/chat/history/${sessionId}`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (err) {
      console.error('Error loading chat history:', err);
    }
  }, [sessionId, session?.access_token]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const sendMessage = async (content: string, model: string, fileUrls?: string[]) => {
    if (!session?.access_token) {
      setError('Not authenticated');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/chat/message`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          sessionId,
          model,
          content,
          file_urls: fileUrls
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      // Add user message immediately
      const userMessage: Message = {
        id: Date.now().toString(),
        content,
        role: 'user',
        model_id: model,
        file_urls: fileUrls,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, userMessage]);

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      let assistantMessage = '';
      const assistantMessageId = (Date.now() + 1).toString();

      // Add initial assistant message
      const initialAssistantMessage: Message = {
        id: assistantMessageId,
        content: '',
        role: 'assistant',
        model_id: model,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, initialAssistantMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              setIsLoading(false);
              return;
            }
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                assistantMessage += parsed.content;
                setMessages(prev => 
                  prev.map(msg => 
                    msg.id === assistantMessageId 
                      ? { ...msg, content: assistantMessage }
                      : msg
                  )
                );
              }
            } catch (e) {
              // Ignore parsing errors for non-JSON lines
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error sending message:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    loadHistory
  };
};

export const useChatSessions = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { session } = useAuth();

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${session?.access_token}`,
    'Content-Type': 'application/json'
  });

  const getDeleteHeaders = () => ({
  'Authorization': `Bearer ${session?.access_token}`
});

  const loadSessions = useCallback(async () => {
    if (!session?.access_token) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/chat/sessions`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      }
    } catch (err) {
      console.error('Error loading sessions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [session?.access_token]);

  const updateSessionTitle = async (sessionId: string, name: string) => {
    if (!session?.access_token) return;

    try {
      const response = await fetch(`${API_URL}/chat/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name })
      });

      if (response.ok) {
        setSessions(prev => 
          prev.map(s => s.id === sessionId ? { ...s, name } : s)
        );
      }
    } catch (err) {
      console.error('Error updating session title:', err);
    }
  };

  const deleteSession = async (sessionId: string) => {
    if (!session?.access_token) return;

    try {
      const response = await fetch(`${API_URL}/chat/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: getDeleteHeaders()
      });

      if (response.ok) {
        setSessions(prev => prev.filter(s => s.id !== sessionId));
      }
    } catch (err) {
      console.error('Error deleting session:', err);
    }
  };

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  return {
    sessions,
    isLoading,
    loadSessions,
    updateSessionTitle,
    deleteSession
  };
};