import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../lib/api';
import { useQuery } from '@tanstack/react-query';
import { useDefaultModel } from './useDefaultModel';

// Constants for caching
const CACHE_TIME = 1000 * 60 * 60 * 2; // 2 hours for models (they don't change often)
const STALE_TIME = 1000 * 60 * 30; // 30 minutes
const MAX_RETRIES = 3;

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
  const { session } = useAuth();
  const { defaultModel } = useDefaultModel();

  const getAuthHeaders = useCallback(() => ({
    'Authorization': `Bearer ${session?.access_token}`,
    'Content-Type': 'application/json'
  }), [session?.access_token]);

  // Fetch models with React Query caching
  const { 
    data: models = [], 
    isLoading, 
    error,
    refetch 
  } = useQuery<AIModel[]>({
    queryKey: ['models'] as const,
    queryFn: async () => {
      if (!session?.access_token) return [];
      
      const response = await fetch(`${API_URL}/models`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch models`);
      }
      
      const data = await response.json();
      return data.data || [];
    },
    gcTime: CACHE_TIME,
    staleTime: STALE_TIME,
    retry: (failureCount: number) => failureCount < MAX_RETRIES,
    enabled: !!session?.access_token,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true
  });

  // Get the default model or fallback
  const getEffectiveDefaultModel = useCallback(() => {
    if (defaultModel && models.find(m => m.id === defaultModel)) {
      return defaultModel;
    }
    
    // Fallback to first free model or first model
    const freeModel = models.find(model => {
      const info = getModelDisplayInfo(model.id);
      return info.isFree || parseFloat(model.pricing.prompt) === 0;
    });
    
    return freeModel?.id || models[0]?.id || 'mistralai/devstral-small:free';
  }, [defaultModel, models]);

  return {
    models,
    isLoading,
    error: error ? (error as Error).message : null,
    refetch,
    defaultModel,
    getEffectiveDefaultModel
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
    'mistral': 'bg-red-500',
    'cohere': 'bg-pink-500',
    'together': 'bg-indigo-500'
  };

  // Pretty names for providers
  const providerNames: Record<string, string> = {
    'openai': 'OpenAI',
    'anthropic': 'Anthropic',
    'google': 'Google',
    'meta': 'Meta',
    'mistral': 'Mistral',
    'cohere': 'Cohere',
    'together': 'Together'
  };

  return {
    provider: providerNames[provider] || provider || 'Unknown',
    modelName: model || modelId,
    color: providerColors[provider] || 'bg-gray-500',
    isFree: modelId.includes('devstral-small') || 
            modelId.includes('free') || 
            modelId.includes('llama-3.1-8b') ||
            modelId.includes('mixtral-8x7b-instruct')
  };
};

// Helper to get the default free model
export const getDefaultFreeModel = () => 'mistral/devstral-small';

// Helper to get available free models
export const getFreeModels = (models: AIModel[]) => {
  return models.filter(model => {
    const info = getModelDisplayInfo(model.id);
    return info.isFree || 
           model.pricing.prompt === '0' || 
           parseFloat(model.pricing.prompt) === 0;
  });
};

// Helper to validate if a model exists
export const validateModel = (modelId: string, models: AIModel[]) => {
  return models.some(model => model.id === modelId);
};