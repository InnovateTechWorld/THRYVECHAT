import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../lib/api';

export interface ExportedAPI {
  id: string;
  name: string;
  description: string;
  export_type: 'context' | 'session';
  base_model: string;
  allowed_models: string[];
  rate_limit: number;
  is_active: boolean;
  api_key_preview: string;
  created_at: string;
  chat_sessions?: any;
  session_id?: string;
  include_memories?: boolean;  // NEW
  include_notes?: boolean;     // NEW
}

export interface CreateExportedAPIRequest {
  name: string;
  description: string;
  export_type: 'context' | 'session';
  session_id?: string;
  base_model: string;
  allowed_models: string[];
  rate_limit: number;
  expires_at?: string;
  include_memories?: boolean;  // NEW
  include_notes?: boolean;     // NEW
}

export interface UsageStats {
  summary: {
    total_requests: number;
    total_tokens: number;
    total_prompt_tokens: number;
    total_completion_tokens: number;
    models_used: string[];
    request_types: string[];
  };
  usage: Array<{
    id: string;
    model_used: string;
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    request_type: string;
    created_at: string;
  }>;
}

export const useExportedApis = () => {
  const [apis, setApis] = useState<ExportedAPI[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuth();

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${session?.access_token}`,
    'Content-Type': 'application/json'
  });

  const loadApis = useCallback(async () => {
    if (!session?.access_token) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/api/admin/exported-apis`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch exported APIs');
      }
      
      const data = await response.json();
      setApis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error loading exported APIs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [session?.access_token]);

  const createApi = async (request: CreateExportedAPIRequest) => {
    if (!session?.access_token) {
      setError('Not authenticated');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/admin/exported-apis`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error('Failed to create exported API');
      }

      const data = await response.json();
      setApis(prev => [data, ...prev]);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error creating exported API:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateApi = async (id: string, updates: Partial<CreateExportedAPIRequest>) => {
    if (!session?.access_token) {
      setError('Not authenticated');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/admin/exported-apis/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error('Failed to update exported API');
      }

      const data = await response.json();
      setApis(prev => prev.map(api => api.id === id ? { ...api, ...data } : api));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error updating exported API:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteApi = async (apiId: string): Promise<boolean> => {
    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    try {
      const response = await fetch(`${API_URL}/api/admin/exported-apis/${apiId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}` // Use session token
        }
      });

      if (!response.ok) {
        // Log the error for debugging
        const errorText = await response.text();
        console.error('Delete API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        
        if (response.status === 401) {
          throw new Error('Authentication failed');
        } else if (response.status === 403) {
          throw new Error('Permission denied');
        } else if (response.status === 404) {
          throw new Error('API not found');
        } else {
          throw new Error(`Delete failed: ${response.status} ${response.statusText}`);
        }
      }

      // Refresh the APIs list after successful deletion
      await loadApis();
      return true;
    } catch (error) {
      console.error('Error deleting API:', error);
      throw error;
    }
  };

  const regenerateApiKey = async (id: string) => {
    if (!session?.access_token) {
      setError('Not authenticated');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/admin/exported-apis/${id}/regenerate-key`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate API key');
      }

      const data = await response.json();
      // Note: The new API key is only returned once for security
      return data.api_key;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error regenerating API key:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getUsageStats = async (id: string, startDate?: string, endDate?: string, limit?: number) => {
    if (!session?.access_token) {
      setError('Not authenticated');
      return null;
    }

    setError(null);

    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (limit) params.append('limit', limit.toString());

      const response = await fetch(
        `${API_URL}/api/admin/exported-apis/${id}/usage?${params.toString()}`,
        {
          headers: getAuthHeaders()
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch usage statistics');
      }

      const data: UsageStats = await response.json();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching usage stats:', err);
      return null;
    }
  };

  useEffect(() => {
    loadApis();
  }, [loadApis]);

  return {
    apis,
    isLoading,
    error,
    loadApis,
    createApi,
    updateApi,
    deleteApi,
    regenerateApiKey,
    getUsageStats
  };
};

// Helper function for quick API creation
export const useQuickExport = () => {
  const { session } = useAuth();

  const createContextAPI = async (modelsToExpose: string[], includeMemories = false, includeNotes = false, name?: string,
    description?: string ) => {
    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    if (!modelsToExpose || modelsToExpose.length === 0) {
      throw new Error('At least one model must be selected');
    }

    try {
      const response = await fetch(`${API_URL}/export/context`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          modelsToExpose,
          include_memories: includeMemories,
          include_notes: includeNotes,
          name: name || 'Exported Context API',
          description: description || 'API for accessing exported context data'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('API Error Response:', errorData);
        throw new Error(`Failed to create context API: ${errorData.error || errorData.message || response.statusText}`);
      }

      const data = await response.json();
      
      return {
        id: data.id,
        apiKey: data.apiKey,
        apiUrl: `${API_URL}/api/exported/context/${data.apiKey}/chat/completions`,
        type: data.type
      };
    } catch (err) {
      console.error('Error creating context API:', err);
      throw err; // Re-throw to handle in UI
    }
  };

  const createSessionAPI = async (sessionId: string, modelsToExpose: string[], includeMemories = false, includeNotes = false,name?: string,
    description?: string) => {
    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    if (!sessionId) {
      throw new Error('Session ID is required');
    }
    
    if (!modelsToExpose || modelsToExpose.length === 0) {
      throw new Error('At least one model must be selected');
    }

    try {
      // Use the /export/session/current endpoint with sessionId in body
      const response = await fetch(`${API_URL}/export/session/current`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          modelsToExpose,
          include_memories: includeMemories,
          include_notes: includeNotes,
          name: name,
          description: description 
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('API Error Response:', errorData);
        throw new Error(`Failed to create session API: ${errorData.error || errorData.message || response.statusText}`);
      }

      const data = await response.json();
      
      return {
        id: data.id,
        apiKey: data.apiKey,
        apiUrl: `${API_URL}/api/exported/session/${data.apiKey}/chat/completions`,
        type: data.type,
        sessionId: data.sessionId
      };
    } catch (err) {
      console.error('Error creating session API:', err);
      throw err; // Re-throw to handle in UI
    }
  };

  const createSessionAPIById = async (sessionId: string, modelsToExpose: string[]) => {
    if (!session?.access_token) return null;

    try {
      // Alternative endpoint using session ID in URL path
      const response = await fetch(`${API_URL}/export/session/${sessionId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ modelsToExpose })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || 'Failed to create session API');
      }

      return await response.json();
    } catch (err) {
      console.error('Error creating session API by ID:', err);
      throw err; // Re-throw to handle in UI
    }
  };

  return {
    createContextAPI,
    createSessionAPI,
    createSessionAPIById
  };
};