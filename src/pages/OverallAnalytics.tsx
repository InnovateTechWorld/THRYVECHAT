import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BarChart3, Activity, TrendingUp, Zap, Calendar, ArrowLeft, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { API_URL } from '@/lib/api';
import { format, parseISO } from 'date-fns';

// Types for Overall Analytics data
interface OverallSummary {
  total_requests: number;
  total_tokens: number;
  prompt_tokens: number;
  completion_tokens: number;
}

interface ModelUsageItem {
  requests: number;
  tokens: number;
  prompt_tokens: number;
  completion_tokens: number;
}

interface DailyUsageItem {
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

interface OverallAnalyticsData {
  summary: OverallSummary;
  modelUsage: Record<string, ModelUsageItem>; // Object with model names as keys
  dailyUsage: Record<string, DailyUsageItem>; // Object with dates (YYYY-MM-DD) as keys for last 30 days
  recentActivity: RecentActivityLogItem[]; // Last 50
}

// Types for internal chat analytics
interface InternalChatSummary {
  total_requests: number;
  total_tokens: number;
  prompt_tokens: number;
  completion_tokens: number;
  avg_response_time_ms?: number;
}

interface InternalChatAnalytics {
  apiInfo: {
    id: string;
    name: string;
    type: string;
  };
  summary: InternalChatSummary;
  hourlyUsage: Record<string, { requests: number; tokens: number }>;
  recentActivity: RecentActivityLogItem[];
}

const OverallAnalytics = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { toast } = useToast();
  
  const [analyticsData, setAnalyticsData] = useState<OverallAnalyticsData | null>(null);
  const [internalChatData, setInternalChatData] = useState<InternalChatAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllAnalytics = async () => {
      if (!session?.access_token) {
        setIsLoading(false);
        setError("User not authenticated.");
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch both overall analytics and internal chat analytics in parallel
        const [overallResponse, internalChatResponse] = await Promise.all([
          fetch(`${API_URL}/api/usage/analytics`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            }
          }),
          fetch(`${API_URL}/api/usage/analytics/internal-chat`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            }
          })
        ]);

        if (!overallResponse.ok) {
          throw new Error('Failed to fetch overall analytics data');
        }
        
        const overallData = await overallResponse.json();
        console.log('Overall analytics data received:', overallData); // Debug log
        setAnalyticsData(overallData as OverallAnalyticsData);

        // Internal chat response might fail if no data exists, so handle gracefully
        if (internalChatResponse.ok) {
          const internalChatData = await internalChatResponse.json();
          console.log('Internal chat analytics data received:', internalChatData); // Debug log
          setInternalChatData(internalChatData as InternalChatAnalytics);
        } else {
          console.log('No internal chat analytics data available or failed to fetch');
          setInternalChatData(null);
        }
      } catch (err: any) {
        console.error("Error fetching analytics data:", err);
        setError(err.message || 'An unexpected error occurred.');
        toast({
          title: "Error",
          description: "Failed to load analytics data.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllAnalytics();
  }, [session, toast]);

  // Convert objects to arrays for rendering
  const modelUsageArray = analyticsData ? Object.entries(analyticsData.modelUsage).map(([model, data]) => ({
    model,
    ...data
  })).sort((a, b) => b.requests - a.requests) : [];

  const dailyUsageArray = analyticsData ? Object.entries(analyticsData.dailyUsage).map(([date, data]) => ({
    date,
    ...data
  })).sort((a, b) => a.date.localeCompare(b.date)) : [];

  const maxDailyRequests = Math.max(...dailyUsageArray.map(d => d.requests), 1);

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
                <BarChart3 className="w-5 h-5 text-primary" />
                <h1 className="text-xl font-semibold">Overall Analytics</h1>
              </div>
            </div>
          </div>
          
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6">
              {/* Loading Skeletons */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
              </div>
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-96 w-full" />
            </div>
          </ScrollArea>
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
                <BarChart3 className="w-5 h-5 text-primary" />
                <h1 className="text-xl font-semibold">Overall Analytics</h1>
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

  const { summary, recentActivity } = analyticsData;

  // Combine API analytics and internal chat analytics for totals
  const combinedSummary = {
    total_requests: (summary.total_requests || 0) + (internalChatData?.summary.total_requests || 0),
    total_tokens: (summary.total_tokens || 0) + (internalChatData?.summary.total_tokens || 0),
    prompt_tokens: (summary.prompt_tokens || 0) + (internalChatData?.summary.prompt_tokens || 0),
    completion_tokens: (summary.completion_tokens || 0) + (internalChatData?.summary.completion_tokens || 0),
  };

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
              <BarChart3 className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-semibold">Overall Analytics</h1>
            </div>
          </div>
        </div>
        
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="border border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Total Requests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{combinedSummary.total_requests.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">API calls + internal chat messages</p>
                </CardContent>
              </Card>
              
              <Card className="border border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Total Tokens
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{combinedSummary.total_tokens.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">API + internal chat token consumption</p>
                </CardContent>
              </Card>
              
              <Card className="border border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Prompt Tokens
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{combinedSummary.prompt_tokens.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">Input tokens (API + internal chat)</p>
                </CardContent>
              </Card>
              
              <Card className="border border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Completion Tokens
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{combinedSummary.completion_tokens.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">Output tokens (API + internal chat)</p>
                </CardContent>
              </Card>
            </div>

            {/* Internal Chat Analytics Section */}
            {internalChatData && (
              <Card className="border border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    Internal Chat Analytics
                  </CardTitle>
                  <CardDescription>
                    Detailed breakdown of internal chat usage within the platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center p-3 bg-muted rounded">
                      <Activity className="w-5 h-5 mx-auto mb-2 text-primary" />
                      <p className="text-sm text-muted-foreground">Chat Messages</p>
                      <p className="text-xl font-bold">{(internalChatData.summary.total_requests || 0).toLocaleString()}</p>
                    </div>
                    <div className="text-center p-3 bg-muted rounded">
                      <BarChart3 className="w-5 h-5 mx-auto mb-2 text-primary" />
                      <p className="text-sm text-muted-foreground">Total Tokens</p>
                      <p className="text-xl font-bold">{(internalChatData.summary.total_tokens || 0).toLocaleString()}</p>
                    </div>
                    <div className="text-center p-3 bg-muted rounded">
                      <TrendingUp className="w-5 h-5 mx-auto mb-2 text-primary" />
                      <p className="text-sm text-muted-foreground">Prompt Tokens</p>
                      <p className="text-xl font-bold">{(internalChatData.summary.prompt_tokens || 0).toLocaleString()}</p>
                    </div>
                    <div className="text-center p-3 bg-muted rounded">
                      <Zap className="w-5 h-5 mx-auto mb-2 text-primary" />
                      <p className="text-sm text-muted-foreground">Completion Tokens</p>
                      <p className="text-xl font-bold">{(internalChatData.summary.completion_tokens || 0).toLocaleString()}</p>
                    </div>
                  </div>
                  {internalChatData.summary.avg_response_time_ms && (
                    <div className="text-center mb-4">
                      <p className="text-sm text-muted-foreground">Average Response Time</p>
                      <p className="text-lg font-semibold">{internalChatData.summary.avg_response_time_ms.toFixed(2)} ms</p>
                    </div>
                  )}
                  <div className="flex justify-center">
                    <Button variant="outline" onClick={() => navigate('/api-analytics/internal-chat')}>
                      <Activity className="w-4 h-4 mr-2" />
                      View Detailed Internal Chat Analytics
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Model Usage Chart */}
            <Card className="border border-border">
              <CardHeader>
                <CardTitle>Usage by Model</CardTitle>
                <CardDescription>Request and token distribution across different AI models</CardDescription>
              </CardHeader>
              <CardContent>
                {modelUsageArray.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Model</TableHead>
                        <TableHead className="text-right">Requests</TableHead>
                        <TableHead className="text-right">Total Tokens</TableHead>
                        <TableHead className="text-right">Prompt Tokens</TableHead>
                        <TableHead className="text-right">Completion Tokens</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {modelUsageArray.map((model) => (
                        <TableRow key={model.model}>
                          <TableCell className="font-medium">
                            <Badge variant="outline">{model.model}</Badge>
                          </TableCell>
                          <TableCell className="text-right">{(model.requests || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-right">{(model.tokens || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-right">{(model.prompt_tokens || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-right">{(model.completion_tokens || 0).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No model usage data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Daily Usage Chart */}
            <Card className="border border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Daily Usage (Last 30 Days)
                </CardTitle>
                <CardDescription>Request patterns over the past month</CardDescription>
              </CardHeader>
              <CardContent>
                {dailyUsageArray.length > 0 ? (
                  <div className="h-64 flex items-end justify-between bg-muted p-4 rounded overflow-x-auto">
                    {dailyUsageArray.map((usage, index) => (
                      <div key={usage.date} className="flex flex-col items-center mx-1">
                        <div
                          className="bg-primary rounded-t transition-all hover:bg-primary/80 min-w-[12px]"
                          style={{ 
                            height: `${(usage.requests / maxDailyRequests) * 200}px`, 
                            minHeight: '4px',
                            width: '12px'
                          }}
                          title={`${format(parseISO(usage.date), 'MMM d')}: ${usage.requests} requests, ${usage.tokens} tokens`}
                        ></div>
                        <p className="text-xs mt-2 whitespace-nowrap">{format(parseISO(usage.date), 'MM/dd')}</p>
                        <p className="text-xs text-muted-foreground">{usage.requests}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    <p>No daily usage data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="border border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Latest API calls across all your keys (last 50 entries)</CardDescription>
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
                      Your API keys haven't been used yet.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </div>
    </Layout>
  );
};

export default OverallAnalytics;