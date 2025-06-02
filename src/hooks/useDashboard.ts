import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../lib/api';

export interface DashboardStats {
  total_requests: number;
  active_apis: number;
  success_rate: number;
  monthly_growth?: {
    requests: number;
    apis: number;
    success_rate: number;
  };
}

export interface ConnectedApp {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  permissions: string[];
  connected_at: string;
  last_accessed: string;
  is_active: boolean;
  api_id?: string;
}

export interface UsageLog {
  id: string;
  api_name: string;
  export_type: 'context' | 'session';
  base_model: string;
  requests: number;
  last_used: string;
  status: 'active' | 'inactive';
}

export const useDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuth();

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${session?.access_token}`,
    'Content-Type': 'application/json'
  });

  const loadStats = useCallback(async () => {
    if (!session?.access_token) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/dashboard/usage`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }
      
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error loading dashboard stats:', err);
    } finally {
      setIsLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    isLoading,
    error,
    loadStats
  };
};

export const useConnectedApps = () => {
  const [apps, setApps] = useState<ConnectedApp[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuth();

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${session?.access_token}`,
    'Content-Type': 'application/json'
  });

  const loadApps = useCallback(async () => {
    if (!session?.access_token) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/dashboard/apps`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch connected apps');
      }
      
      const data = await response.json();
      setApps(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error loading connected apps:', err);
    } finally {
      setIsLoading(false);
    }
  }, [session?.access_token]);

  const revokeApp = async (appId: string) => {
    if (!session?.access_token) {
      setError('Not authenticated');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/dashboard/apps/${appId}/revoke`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to revoke app access');
      }

      setApps(prev => prev.filter(app => app.id !== appId));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error revoking app:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadApps();
  }, [loadApps]);

  return {
    apps,
    isLoading,
    error,
    loadApps,
    revokeApp
  };
};

export const useUsageLogs = () => {
  const [logs, setLogs] = useState<UsageLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuth();

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${session?.access_token}`,
    'Content-Type': 'application/json'
  });

  const loadLogs = useCallback(async () => {
    if (!session?.access_token) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/dashboard/tokens`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch usage logs');
      }
      
      const data = await response.json();
      setLogs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error loading usage logs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  return {
    logs,
    isLoading,
    error,
    loadLogs
  };
};

// Hook for system prompt management
export const useSystemPrompt = () => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuth();

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${session?.access_token}`,
    'Content-Type': 'application/json'
  });

  const loadPrompt = useCallback(async () => {
    if (!session?.access_token) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/system-prompt`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setPrompt(data.prompt || '');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error loading system prompt:', err);
    } finally {
      setIsLoading(false);
    }
  }, [session?.access_token]);

  const updatePrompt = async (newPrompt: string) => {
    if (!session?.access_token) {
      setError('Not authenticated');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/system-prompt`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ prompt: newPrompt })
      });

      if (!response.ok) {
        throw new Error('Failed to update system prompt');
      }

      setPrompt(newPrompt);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error updating system prompt:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPrompt();
  }, [loadPrompt]);

  return {
    prompt,
    isLoading,
    error,
    updatePrompt,
    loadPrompt
  };
};