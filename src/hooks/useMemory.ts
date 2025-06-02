import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../lib/api';

export interface Memory {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export const useMemory = () => {
  const [memories, setMemories] = useState<Memory[]>([]);
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

  const loadMemories = useCallback(async () => {
    if (!session?.access_token) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/memory`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch memories');
      }
      
      const data = await response.json();
      setMemories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error loading memories:', err);
    } finally {
      setIsLoading(false);
    }
  }, [session?.access_token]);

  const createMemory = async (content: string) => {
    if (!session?.access_token) {
      setError('Not authenticated');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/memory`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ content })
      });

      if (!response.ok) {
        throw new Error('Failed to create memory');
      }

      const data = await response.json();
      const newMemory = Array.isArray(data) ? data[0] : data;
      setMemories(prev => [newMemory, ...prev]);
      return newMemory;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error creating memory:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteMemory = async (id: string) => {
    if (!session?.access_token) {
      setError('Not authenticated');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/memory/${id}`, {
        method: 'DELETE',
        headers: getDeleteHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to delete memory');
      }

      setMemories(prev => prev.filter(memory => memory.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error deleting memory:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMemories();
  }, [loadMemories]);

  return {
    memories,
    isLoading,
    error,
    loadMemories,
    createMemory,
    deleteMemory
  };
};