import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../lib/api';

export interface Note {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export const useNotes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
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

  const loadNotes = useCallback(async () => {
    if (!session?.access_token) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/notes`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch notes');
      }
      
      const data = await response.json();
      setNotes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error loading notes:', err);
    } finally {
      setIsLoading(false);
    }
  }, [session?.access_token]);

  const createNote = async (content: string) => {
    if (!session?.access_token) {
      setError('Not authenticated');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/notes`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ content })
      });

      if (!response.ok) {
        throw new Error('Failed to create note');
      }

      const data = await response.json();
      const newNote = Array.isArray(data) ? data[0] : data;
      setNotes(prev => [newNote, ...prev]);
      return newNote;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error creating note:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteNote = async (id: string) => {
    if (!session?.access_token) {
      setError('Not authenticated');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/notes/${id}`, {
        method: 'DELETE',
        headers: getDeleteHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to delete note');
      }

      setNotes(prev => prev.filter(note => note.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error deleting note:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  return {
    notes,
    isLoading,
    error,
    loadNotes,
    createNote,
    deleteNote
  };
};