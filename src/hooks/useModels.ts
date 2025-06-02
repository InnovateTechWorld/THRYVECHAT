import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../lib/api';

export interface AIModel {
  id: string;
  name: string;
  description: string;
  pricing: {
    prompt: string;
    completion: string;
  };
  context_length: number;
}

export const useModels = () => {
  const [models, setModels] = useState<AIModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuth();

  const loadModels = useCallback(async () => {
    if (!session?.access_token) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/models`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch models');
      }
      
      const data = await response.json();
      setModels(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error loading models:', err);
    } finally {
      setIsLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  return {
    models,
    isLoading,
    error,
    loadModels
  };
};

// Helper function to get model display info
export const getModelDisplayInfo = (modelId: string) => {
  // Extract provider and model name from ID like "openai/gpt-4"
  const [provider, model] = modelId.split('/');
  
  // Color mapping for different providers
  const providerColors: Record<string, string> = {
    'openai': 'bg-green-500',
    'anthropic': 'bg-orange-500', 
    'google': 'bg-blue-500',
    'meta': 'bg-purple-500',
    'mistral': 'bg-red-500'
  };

  return {
    provider: provider || 'Unknown',
    modelName: model || modelId,
    color: providerColors[provider] || 'bg-gray-500'
  };
};