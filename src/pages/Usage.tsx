
import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton'; // Added Skeleton import
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart3, Eye, Copy, Trash2, Loader2, Activity, Briefcase, Users, Clock } from 'lucide-react';
import { useExportedApis } from '@/hooks/useExportedApis'; // Keep for regenerate/delete
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { API_URL } from '@/lib/api';
import { format, parseISO, formatDistanceToNow } from 'date-fns';

// Types for /dashboard/usage endpoint
interface DashboardOverview {
  total_requests: number;
  total_tokens: number;
  total_api_keys: number;
}

interface UsageByApiItem {
  apiId: string;
  apiName: string;
  exportType: string;
  totalRequests: number;
  totalTokens: number;
  lastUsed?: string; // ISO string or null
}

interface RecentActivityLogItem { // Simplified for this page, full type in OverallAnalytics
  id: string;
  created_at: string;
  request_type: string;
  model_used?: string;
  total_tokens?: number;
  status_code?: number;
}
interface DashboardUsageData {
  overview: DashboardOverview;
  usageByApi: UsageByApiItem[];
  recentActivity: RecentActivityLogItem[]; // Last 20
}


const Usage = () => {
  const [dashboardData, setDashboardData] = useState<DashboardUsageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Retain useExportedApis for key management functions (regenerate, delete)
  // and potentially for detailed API info if needed elsewhere or if dashboard/usage doesn't have all display fields.
  const { regenerateApiKey, deleteApi, apis: exportedApisList, isLoading: exportedApisLoading } = useExportedApis();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { session } = useAuth();

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!session?.access_token) {
        setIsLoading(false);
        setError("User not authenticated.");
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_URL}/dashboard/usage`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch dashboard usage data');
        }
        
        const data = await response.json();
        console.log('Dashboard usage data received:', data); // Debug log
        setDashboardData(data as DashboardUsageData);
      } catch (err: any) {
        console.error("Error fetching dashboard usage data:", err);
        setError(err.message || 'An unexpected error occurred.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [session]);


  const handleViewAnalytics = (apiId: string) => {
    navigate(`/api-analytics/${apiId}`);
  };

  const handleCopyApiKey = async (apiId: string, apiName: string) => {
    try {
      const newKey = await regenerateApiKey(apiId); // This function is from useExportedApis
      if (newKey) {
        navigator.clipboard.writeText(newKey);
        toast({
          title: "API Key Regenerated",
          description: `New API key for ${apiName} has been copied to clipboard.`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to regenerate API key.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteApi = async (apiId: string, apiName: string) => {
    if (window.confirm(`Are you sure you want to delete "${apiName}"? This will stop all API access.`)) {
      try {
        const success = await deleteApi(apiId); // This function is from useExportedApis
        if (success) {
          toast({
            title: "API Deleted",
            description: `${apiName} has been deleted and access revoked.`,
          });
          // Refresh data after delete
          const response = await fetch(`${API_URL}/dashboard/usage`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${session?.access_token}`,
              'Content-Type': 'application/json'
            }
          });
          if (response.ok) {
            const data = await response.json();
            setDashboardData(data as DashboardUsageData);
          }
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete API.",
          variant: "destructive"
        });
      }
    }
  };
  
  const loadingSkeletons = (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {[...Array(3)].map((_, i) => <Skeleton key={`sum-skel-${i}`} className="h-36" />)}
      </div>
      <Card className="border border-border">
        <CardHeader><Skeleton className="h-8 w-1/3" /></CardHeader>
        <CardContent><Skeleton className="h-40 w-full" /></CardContent>
      </Card>
      <Card className="border border-border mt-6">
        <CardHeader><Skeleton className="h-8 w-1/4" /></CardHeader>
        <CardContent><Skeleton className="h-60 w-full" /></CardContent>
      </Card>
    </>
  );

  if (isLoading || exportedApisLoading) {
    return (
      <Layout>
        <div className="flex-1 flex flex-col bg-background text-foreground">
          <div className="flex items-center justify-between p-6 border-b border-border bg-card">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" />
                <h1 className="text-xl font-semibold">API Key Management</h1>
              </div>
            </div>
          </div>
          <ScrollArea className="flex-1 p-6">{loadingSkeletons}</ScrollArea>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
         <div className="flex-1 flex flex-col bg-background text-foreground">
          <div className="flex items-center justify-between p-6 border-b border-border bg-card"> /* ... header ... */ </div>
          <div className="p-6">
            <Card className="bg-destructive/10 border-destructive text-destructive-foreground">
                <CardHeader><CardTitle>Error Loading Data</CardTitle></CardHeader>
                <CardContent><p>{error}</p></CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }
  
  const overview = dashboardData?.overview;
  const usageByApiList = dashboardData?.usageByApi || [];
  const recentActivityList = dashboardData?.recentActivity || [];

  return (
    <Layout>
      <div className="flex-1 flex flex-col bg-background text-foreground">
        <div className="flex items-center justify-between p-6 border-b border-border bg-card">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-semibold">API Key Management & Overview</h1>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/overall-analytics')}>
              <BarChart3 className="w-4 h-4 mr-2" />
              View Overall Analytics
            </Button>
            <Button onClick={() => navigate('/exports')}>Create New API Key</Button>
          </div>
        </div>
        
        <ScrollArea className="flex-1 p-6">
          {overview ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card className="border border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Total Requests (All Keys)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(overview.total_requests || 0).toLocaleString()}</div>
                </CardContent>
              </Card>
              <Card className="border border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Users className="w-4 h-4" /> {/* Changed Icon */}
                    Total Tokens (All Keys)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(overview.total_tokens || 0).toLocaleString()}</div>
                </CardContent>
              </Card>
              <Card className="border border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Number of API Keys
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(overview.total_api_keys || 0).toLocaleString()}</div>
                </CardContent>
              </Card>
            </div>
           ) : <Skeleton className="h-36 w-full mb-6" />}

          {/* Analytics CTA Card */}
          {overview && (
            <Card className="border border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Detailed Analytics Available
                </CardTitle>
                <CardDescription>
                  Get deeper insights into your API usage patterns, model performance, and trends.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => navigate('/overall-analytics')} className="w-full">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Comprehensive Analytics
                </Button>
              </CardContent>
            </Card>
          )}

          <Card className="border border-border">
            <CardHeader>
              <CardTitle>Your API Keys</CardTitle>
              <CardDescription>Manage your created API keys and see their individual usage.</CardDescription>
            </CardHeader>
            <CardContent>
              {usageByApiList.length === 0 && !isLoading ? (
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-muted-foreground mb-2">No API Keys created yet</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Create your first API key to start tracking usage.
                  </p>
                  <Button onClick={() => navigate('/exports')}>
                    Create API Key
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Total Requests</TableHead>
                      <TableHead className="text-right">Total Tokens</TableHead>
                      <TableHead>Last Used</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usageByApiList.map((apiKey) => (
                      <TableRow key={apiKey.apiId}>
                        <TableCell className="font-medium">{apiKey.apiName}</TableCell>
                        <TableCell className="capitalize">{apiKey.exportType}</TableCell>
                        <TableCell className="text-right">{(apiKey.totalRequests || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-right">{(apiKey.totalTokens || 0).toLocaleString()}</TableCell>
                        <TableCell>
                          {apiKey.lastUsed ? formatDistanceToNow(parseISO(apiKey.lastUsed), { addSuffix: true }) : 'Never'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewAnalytics(apiKey.apiId)}
                              title="View Detailed Analytics"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCopyApiKey(apiKey.apiId, apiKey.apiName)}
                              title="Regenerate & Copy API Key"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteApi(apiKey.apiId, apiKey.apiName)}
                              title="Delete API Key"
                              className="hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {recentActivityList.length > 0 && (
            <Card className="border border-border mt-6">
              <CardHeader>
                <CardTitle>Quick Recent Activity (Last 20)</CardTitle>
                <CardDescription>A brief log of recent API calls across your keys.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead><Clock className="inline w-4 h-4 mr-1" />Timestamp</TableHead>
                      <TableHead>Endpoint</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead className="text-right">Tokens</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentActivityList.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{format(parseISO(log.created_at), "MMM d, HH:mm")}</TableCell>
                        <TableCell><Badge variant="outline" className="truncate max-w-xs">{log.request_type}</Badge></TableCell>
                        <TableCell>{log.model_used || 'N/A'}</TableCell>
                        <TableCell className="text-right">{log.total_tokens?.toLocaleString() || 'N/A'}</TableCell>
                        <TableCell className="text-right">
                           <Badge variant={log.status_code === 200 || !log.status_code ? 'default' : 'destructive'}>
                              {log.status_code || 'N/A'}
                            </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </ScrollArea>
      </div>
    </Layout>
  );
};

export default Usage;
