
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Activity, Clock, TrendingUp, Zap, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { API_URL } from '@/lib/api';
import { format, parseISO } from 'date-fns';

// Types for API Analytics data
interface ApiInfo {
  id: string;
  name: string;
  type: string;
}

interface AnalyticsSummary {
  total_requests: number;
  total_tokens: number;
  prompt_tokens: number;
  completion_tokens: number;
  avg_response_time_ms?: number;
}

interface HourlyUsageItem {
  hour: string; // YYYY-MM-DDTHH:00:00
  requests: number;
  tokens: number;
}

interface RecentActivityLogItem {
  id: string;
  created_at: string;
  request_type: string;
  model_used?: string;
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  response_time_ms?: number;
  status_code?: number;
}

interface ApiAnalyticsData {
  apiInfo: ApiInfo;
  summary: AnalyticsSummary;
  hourlyUsage: Record<string, HourlyUsageItem>; // Object with hour keys
  recentActivity: RecentActivityLogItem[]; // Last 100
}

const ApiAnalytics = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { session } = useAuth();
  const { toast } = useToast();
  
  const [analyticsData, setAnalyticsData] = useState<ApiAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchApiAnalytics = async () => {
      if (!session?.access_token || !id) {
        setIsLoading(false);
        setError("Missing authentication or API ID.");
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Use the special internal-chat endpoint if id is "internal-chat"
        const endpoint = id === 'internal-chat'
          ? `${API_URL}/api/usage/analytics/internal-chat`
          : `${API_URL}/api/usage/analytics/${id}`;
          
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch API analytics data');
        }
        
        const data = await response.json();
        console.log('API analytics data received:', data); // Debug log
        setAnalyticsData(data as ApiAnalyticsData);
      } catch (err: any) {
        console.error("Error fetching API analytics data:", err);
        setError(err.message || 'An unexpected error occurred.');
        toast({
          title: "Error",
          description: "Failed to load API analytics data.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchApiAnalytics();
  }, [session, id, toast]);

  // Convert hourlyUsage object to array for rendering
  const hourlyUsageArray = analyticsData ? Object.entries(analyticsData.hourlyUsage).map(([hour, data]) => ({
    hour,
    requests: data.requests,
    tokens: data.tokens
  })).sort((a, b) => a.hour.localeCompare(b.hour)) : [];

  if (isLoading) {
    return (
      <Layout>
        <div className="flex-1 flex flex-col bg-background text-foreground">
          <div className="flex items-center justify-between p-6 border-b border-border bg-card">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <Button variant="ghost" onClick={() => navigate('/usage')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Usage
              </Button>
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                <h1 className="text-xl font-semibold">API Analytics</h1>
              </div>
            </div>
          </div>
          
          <div className="flex-1 p-6 space-y-6">
            {/* Loading Skeletons */}
            <Skeleton className="h-48 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
            </div>
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex-1 flex flex-col bg-background text-foreground">
          <div className="flex items-center justify-between p-6 border-b border-border bg-card">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <Button variant="ghost" onClick={() => navigate('/usage')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Usage
              </Button>
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                <h1 className="text-xl font-semibold">
                  {id === 'internal-chat' ? 'Internal Chat Analytics' : 'API Analytics'}
                </h1>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <Card className="bg-destructive/10 border-destructive text-destructive-foreground">
              <CardHeader>
                <CardTitle>Error Loading Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{error}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  if (!analyticsData) {
    return null;
  }

  const { apiInfo, summary, recentActivity } = analyticsData;
  const maxHourlyRequests = Math.max(...hourlyUsageArray.map(h => h.requests), 1);

  return (
    <Layout>
      <div className="flex-1 flex flex-col bg-background text-foreground">
        <div className="flex items-center justify-between p-6 border-b border-border bg-card">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <Button variant="ghost" onClick={() => navigate('/usage')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Usage
            </Button>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-semibold">API Analytics</h1>
            </div>
          </div>
        </div>
        
        <div className="flex-1 p-6 space-y-6">
          {/* API Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{apiInfo.name}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">{apiInfo.type}</Badge>
                  <Badge variant="default">Active</Badge>
                </div>
              </div>
              <CardDescription>
                {id === 'internal-chat'
                  ? 'Detailed analytics for internal chat usage within the platform'
                  : 'Detailed analytics for this API key'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted rounded">
                  <Activity className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">Total Requests</p>
                  <p className="text-2xl font-bold">{(summary.total_requests || 0).toLocaleString()}</p>
                </div>
                <div className="text-center p-4 bg-muted rounded">
                  <BarChart3 className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">Total Tokens</p>
                  <p className="text-2xl font-bold">{(summary.total_tokens || 0).toLocaleString()}</p>
                </div>
                <div className="text-center p-4 bg-muted rounded">
                  <TrendingUp className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">Prompt Tokens</p>
                  <p className="text-2xl font-bold">{(summary.prompt_tokens || 0).toLocaleString()}</p>
                </div>
                <div className="text-center p-4 bg-muted rounded">
                  <Zap className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">Completion Tokens</p>
                  <p className="text-2xl font-bold">{(summary.completion_tokens || 0).toLocaleString()}</p>
                </div>
              </div>
              {summary.avg_response_time_ms && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-muted-foreground">Average Response Time</p>
                  <p className="text-lg font-semibold">{(summary.avg_response_time_ms || 0).toFixed(2)} ms</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Hourly Usage Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Hourly Usage (Last 24 Hours)
              </CardTitle>
              <CardDescription>Requests and token usage over the last 24 hours</CardDescription>
            </CardHeader>
            <CardContent>
              {hourlyUsageArray.length > 0 ? (
                <div className="h-64 flex items-end justify-between bg-muted p-4 rounded">
                  {hourlyUsageArray.map((usage, index) => (
                    <div key={usage.hour} className="flex flex-col items-center">
                      <div
                        className="bg-primary w-6 rounded-t transition-all hover:bg-primary/80"
                        style={{ height: `${(usage.requests / maxHourlyRequests) * 200}px`, minHeight: '4px' }}
                        title={`${usage.requests} requests, ${usage.tokens} tokens`}
                      ></div>
                      <p className="text-xs mt-2">{format(parseISO(usage.hour), 'HH:mm')}</p>
                      <p className="text-xs text-muted-foreground">{usage.requests}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <p>No usage data available for the last 24 hours</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                {id === 'internal-chat'
                  ? 'Latest internal chat messages and interactions (up to 100 entries)'
                  : 'Latest API calls for this key (up to 100 entries)'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Endpoint</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead className="text-right">Prompt Tokens</TableHead>
                      <TableHead className="text-right">Completion Tokens</TableHead>
                      <TableHead className="text-right">Total Tokens</TableHead>
                      <TableHead className="text-right">Response Time</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentActivity.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{format(parseISO(log.created_at), "MMM d, HH:mm:ss")}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="truncate max-w-xs">
                            {log.request_type}
                          </Badge>
                        </TableCell>
                        <TableCell>{log.model_used || 'N/A'}</TableCell>
                        <TableCell className="text-right">{log.prompt_tokens?.toLocaleString() || 'N/A'}</TableCell>
                        <TableCell className="text-right">{log.completion_tokens?.toLocaleString() || 'N/A'}</TableCell>
                        <TableCell className="text-right">{log.total_tokens?.toLocaleString() || 'N/A'}</TableCell>
                        <TableCell className="text-right">
                          {log.response_time_ms ? `${log.response_time_ms}ms` : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={log.status_code === 200 || !log.status_code ? 'default' : 'destructive'}>
                            {log.status_code || 'N/A'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-muted-foreground mb-2">No Activity Yet</h3>
                  <p className="text-sm text-muted-foreground">
                    {id === 'internal-chat'
                      ? 'No internal chat messages have been recorded yet.'
                      : 'This API key hasn\'t been used yet.'
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default ApiAnalytics;
