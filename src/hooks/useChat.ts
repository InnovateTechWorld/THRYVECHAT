import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDefaultModel } from './useDefaultModel';
import { getDefaultFreeModel } from './useModels';
import { useToast } from '@/hooks/use-toast';

// Constants for optimized caching
const MESSAGE_CACHE_TIME = 1000 * 60 * 60; // 1 hour for messages
const MESSAGE_STALE_TIME = 1000 * 60 * 10; // 10 minutes
const SESSION_CACHE_TIME = 1000 * 60 * 30; // 30 minutes for sessions
const SESSION_STALE_TIME = 1000 * 60 * 5; // 5 minutes
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  model_id?: string;
  file_urls?: string[];
  created_at: string;
  isStreaming?: boolean;
  error?: boolean;
}

export interface ChatSession {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

interface SendMessageParams {
  content: string;
  model?: string;
  fileUrls?: string[];
}

interface CreateSessionParams {
  name?: string;
}

export const useChat = (sessionId: string) => {
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [selectedModelForUpgrade, setSelectedModelForUpgrade] = useState<string>('');
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const { defaultModel } = useDefaultModel();
  const { toast } = useToast();

  const getAuthHeaders = useCallback(() => ({
    'Authorization': `Bearer ${session?.access_token}`,
    'Content-Type': 'application/json'
  }), [session?.access_token]);

  // Helper to get effective default model
  const getEffectiveDefaultModel = useCallback(() => {
    return defaultModel || getDefaultFreeModel();
  }, [defaultModel]);

  // Optimized chat history query with session-specific caching
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['chat', sessionId] as const,
    queryFn: async (): Promise<Message[]> => {
      if (!session?.access_token || !sessionId) return [];
      
      const response = await fetch(`${API_URL}/chat/history/${sessionId}`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          // New session, no messages yet
          return [];
        }
        throw new Error(`Failed to load chat history: ${response.status}`);
      }
      
      return response.json();
    },
    gcTime: MESSAGE_CACHE_TIME,
    staleTime: MESSAGE_STALE_TIME,
    retry: (failureCount: number) => {
      if (failureCount < MAX_RETRIES) {
        setTimeout(() => {}, RETRY_DELAY * Math.pow(2, failureCount));
        return true;
      }
      return false;
    },
    enabled: !!session?.access_token && !!sessionId,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true
  });

  // Optimized send message mutation with streaming support
  const { mutate: sendMessage, isPending: isSending } = useMutation({
    mutationFn: async ({ content, model, fileUrls }: SendMessageParams) => {
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      // Use default model if none provided
      const effectiveModel = model || getEffectiveDefaultModel();
      
      setIsStreaming(true);
      setError(null);

      // Generate unique IDs for optimistic updates
      const userMessageId = `user_${Date.now()}`;
      const assistantMessageId = `assistant_${Date.now() + 1}`;

      // Add optimistic user message immediately
      const userMessage: Message = {
        id: userMessageId,
        content,
        role: 'user',
        model_id: effectiveModel,
        file_urls: fileUrls,
        created_at: new Date().toISOString()
      };

      queryClient.setQueryData<Message[]>(['chat', sessionId], (old = []) => [
        ...old,
        userMessage
      ]);

      // Add optimistic assistant message with streaming state
      const assistantMessage: Message = {
        id: assistantMessageId,
        content: '',
        role: 'assistant',
        model_id: effectiveModel,
        created_at: new Date().toISOString(),
        isStreaming: true
      };

      queryClient.setQueryData<Message[]>(['chat', sessionId], (old = []) => [
        ...old,
        assistantMessage
      ]);

      try {
        const response = await fetch(`${API_URL}/chat/message`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ 
            sessionId, 
            model: effectiveModel, 
            content, 
            file_urls: fileUrls 
          })
        });

        if (response.status === 401 || response.status === 402) {
          // Update assistant message to show subscription required
          queryClient.setQueryData<Message[]>(['chat', sessionId], (old = []) =>
            old.map(msg =>
              msg.id === assistantMessageId
                ? {
                    ...msg,
                    content: `${effectiveModel} requires a subscription plan. Please upgrade to continue.`,
                    isStreaming: false,
                    error: true
                  }
                : msg
            )
          );

          setSelectedModelForUpgrade(effectiveModel);
          setShowUpgradeDialog(true);
          
          // Return early to avoid throwing error
          return {
            content: `${effectiveModel} requires a subscription plan. Please upgrade to continue.`
          };
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: Failed to send message`);
        }

        // Handle streaming response
        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        let assistantContent = '';
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '[DONE]') {
                setIsStreaming(false);
                queryClient.setQueryData<Message[]>(['chat', sessionId], (old = []) =>
                  old.map(msg =>
                    msg.id === assistantMessageId
                      ? { ...msg, isStreaming: false }
                      : msg
                  )
                );
                continue;
              }

              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  assistantContent += parsed.content;
                  
                  // Update assistant message content in real-time
                  queryClient.setQueryData<Message[]>(['chat', sessionId], (old = []) =>
                    old.map(msg =>
                      msg.id === assistantMessageId
                        ? { ...msg, content: assistantContent }
                        : msg
                    )
                  );
                }
              } catch (parseError) {
                console.warn('Failed to parse streaming data:', data);
              }
            }
          }
        }

        // Update sessions cache to reflect new message count
        queryClient.invalidateQueries({ queryKey: ['sessions'] });
        
        return { content: assistantContent };
      } catch (streamError) {
        setIsStreaming(false);
        
        // Mark assistant message as error
        queryClient.setQueryData<Message[]>(['chat', sessionId], (old = []) =>
          old.map(msg =>
            msg.id === assistantMessageId
              ? { 
                  ...msg, 
                  content: 'Failed to generate response. Please try again.', 
                  error: true,
                  isStreaming: false 
                }
              : msg
          )
        );
        
        throw streamError;
      }
    },
    retry: false,
    onError: (error: Error) => {
      // Only show error for non-subscription issues
      if (!error.message.includes('requires a subscription')) {
        setError(error.message);
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      }
      setIsStreaming(false);
    },
    onSuccess: () => {
      setError(null);
      setIsStreaming(false);
    }
  });

  // Retry failed message
  const retryMessage = useCallback((messageId: string) => {
    const currentMessages = queryClient.getQueryData<Message[]>(['chat', sessionId]) || [];
    const failedMessage = currentMessages.find(msg => msg.id === messageId);
    
    if (failedMessage && failedMessage.role === 'assistant' && failedMessage.error) {
      // Find the previous user message
      const messageIndex = currentMessages.findIndex(msg => msg.id === messageId);
      const userMessage = currentMessages[messageIndex - 1];
      
      if (userMessage && userMessage.role === 'user') {
        // Remove the failed assistant message
        queryClient.setQueryData<Message[]>(['chat', sessionId], (old = []) =>
          old.filter(msg => msg.id !== messageId)
        );
        
        // Retry sending the message
        sendMessage({
          content: userMessage.content,
          model: userMessage.model_id,
          fileUrls: userMessage.file_urls
        });
      }
    }
  }, [sendMessage, sessionId, queryClient]);

  const send = useCallback((content: string, model?: string, fileUrls?: string[]) => {
    if (!content.trim()) return;
    sendMessage({ content: content.trim(), model, fileUrls });
  }, [sendMessage]);

  return {
    messages,
    isLoading: isLoading || isSending,
    isStreaming,
    error,
    sendMessage: send,
    retryMessage,
    getEffectiveDefaultModel,
    showUpgradeDialog,
    setShowUpgradeDialog,
    selectedModelForUpgrade
  };
};

export const useChatSessions = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const getAuthHeaders = useCallback(() => ({
    'Authorization': `Bearer ${session?.access_token}`,
    'Content-Type': 'application/json'
  }), [session?.access_token]);

  // Optimized sessions query with smart caching
  const { data: sessions = [], isLoading, refetch } = useQuery({
    queryKey: ['sessions'] as const,
    queryFn: async (): Promise<ChatSession[]> => {
      if (!session?.access_token) return [];

      const response = await fetch(`${API_URL}/chat/sessions`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) throw new Error('Failed to load sessions');
      return response.json();
    },
    gcTime: SESSION_CACHE_TIME,
    staleTime: SESSION_STALE_TIME,
    retry: (failureCount: number) => {
      if (failureCount < MAX_RETRIES) {
        setTimeout(() => {}, RETRY_DELAY * Math.pow(2, failureCount));
        return true;
      }
      return false;
    },
    enabled: !!session?.access_token,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true
  });

  // Create new session
  const { mutate: createSession } = useMutation({
    mutationFn: async ({ name }: CreateSessionParams = {}) => {
      if (!session?.access_token) throw new Error('Not authenticated');

      const response = await fetch(`${API_URL}/chat/sessions`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: name || `New Chat ${new Date().toLocaleString()}`
        })
      });

      if (!response.ok) throw new Error('Failed to create session');
      return response.json();
    },
    onSuccess: (newSession) => {
      // Add new session to cache
      queryClient.setQueryData<ChatSession[]>(['sessions'], (old = []) => [
        newSession,
        ...old
      ]);
    },
    retry: (failureCount: number) => failureCount < MAX_RETRIES
  });

  // Update session title
  const { mutate: updateSessionTitle } = useMutation({
    mutationFn: async ({ sessionId, name }: { sessionId: string; name: string }) => {
      if (!session?.access_token) throw new Error('Not authenticated');

      const response = await fetch(`${API_URL}/chat/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name })
      });

      if (!response.ok) throw new Error('Failed to update session title');
      return { sessionId, name };
    },
    onSuccess: ({ sessionId, name }) => {
      // Update session in cache
      queryClient.setQueryData<ChatSession[]>(['sessions'], (old = []) =>
        old.map(s => s.id === sessionId ? { ...s, name, updated_at: new Date().toISOString() } : s)
      );
    },
    retry: (failureCount: number) => failureCount < MAX_RETRIES
  });

  // Delete session
  const { mutate: deleteSession } = useMutation({
    mutationFn: async (sessionId: string) => {
      if (!session?.access_token) throw new Error('Not authenticated');

      const response = await fetch(`${API_URL}/chat/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) throw new Error('Failed to delete session');
      return sessionId;
    },
    onSuccess: (sessionId) => {
      // Remove session from cache
      queryClient.setQueryData<ChatSession[]>(['sessions'], (old = []) =>
        old.filter(s => s.id !== sessionId)
      );
      
      // Also clear the chat data for this session
      queryClient.removeQueries({
        queryKey: ['chat', sessionId]
      });
    },
    retry: (failureCount: number) => failureCount < MAX_RETRIES
  });

  return {
    sessions,
    isLoading,
    refetch,
    createSession,
    updateSessionTitle,
    deleteSession
  };
};