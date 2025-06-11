import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Constants for caching
const CACHE_TIME = 1000 * 60 * 60 * 24; // 24 hours for default model
const STALE_TIME = 1000 * 60 * 30; // 30 minutes
const MAX_RETRIES = 3;

export interface DefaultModelResponse {
  model_id: string | null;
  created_at?: string;
  updated_at?: string;
}

export const useDefaultModel = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const getAuthHeaders = useCallback(() => ({
    'Authorization': `Bearer ${session?.access_token}`,
    'Content-Type': 'application/json'
  }), [session?.access_token]);

  // Get default model with caching
  const { 
    data: defaultModel, 
    isLoading, 
    error 
  } = useQuery<DefaultModelResponse>({
    queryKey: ['defaultModel'] as const,
    queryFn: async () => {
      if (!session?.access_token) {
        return { model_id: null };
      }

      const response = await fetch(`${API_URL}/default-model`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        if (response.status === 404) {
          // No default model set
          return { model_id: null };
        }
        throw new Error(`Failed to get default model: ${response.status}`);
      }

      return response.json();
    },
    gcTime: CACHE_TIME,
    staleTime: STALE_TIME,
    retry: (failureCount: number) => failureCount < MAX_RETRIES,
    enabled: !!session?.access_token,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true
  });

  // Set default model mutation
  const { mutate: setDefaultModel, isPending: isSettingDefault } = useMutation({
    mutationFn: async (modelId: string) => {
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_URL}/default-model`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ model_id: modelId })
      });

      if (!response.ok) {
        throw new Error(`Failed to set default model: ${response.status}`);
      }

      return response.json();
    },
    onSuccess: (data, modelId) => {
      // Update cache with new default model
      queryClient.setQueryData<DefaultModelResponse>(['defaultModel'], {
        model_id: modelId,
        updated_at: new Date().toISOString()
      });
    },
    retry: (failureCount: number) => failureCount < MAX_RETRIES
  });

  // Update default model mutation
  const { mutate: updateDefaultModel, isPending: isUpdatingDefault } = useMutation({
    mutationFn: async (modelId: string) => {
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_URL}/default-model`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ model_id: modelId })
      });

      if (!response.ok) {
        throw new Error(`Failed to update default model: ${response.status}`);
      }

      return response.json();
    },
    onSuccess: (data, modelId) => {
      // Update cache with new default model
      queryClient.setQueryData<DefaultModelResponse>(['defaultModel'], {
        model_id: modelId,
        updated_at: new Date().toISOString()
      });
    },
    retry: (failureCount: number) => failureCount < MAX_RETRIES
  });

  // Remove default model mutation
  const { mutate: removeDefaultModel, isPending: isRemovingDefault } = useMutation({
    mutationFn: async () => {
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_URL}/default-model`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to remove default model: ${response.status}`);
      }

      return response.json();
    },
    onSuccess: () => {
      // Update cache to remove default model
      queryClient.setQueryData<DefaultModelResponse>(['defaultModel'], {
        model_id: null,
        updated_at: new Date().toISOString()
      });
    },
    retry: (failureCount: number) => failureCount < MAX_RETRIES
  });

  // Helper to get current default model ID
  const getDefaultModelId = useCallback(() => {
    return defaultModel?.model_id || null;
  }, [defaultModel]);

  // Helper to check if a model is the default
  const isDefaultModel = useCallback((modelId: string) => {
    return defaultModel?.model_id === modelId;
  }, [defaultModel]);

  return {
    defaultModel: defaultModel?.model_id || null,
    defaultModelData: defaultModel,
    isLoading,
    isSettingDefault,
    isUpdatingDefault,
    isRemovingDefault,
    error: error ? (error as Error).message : null,
    setDefaultModel,
    updateDefaultModel,
    removeDefaultModel,
    getDefaultModelId,
    isDefaultModel
  };
};