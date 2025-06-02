
import React from 'react';
import { Layout } from '@/components/Layout';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart3, Eye, Copy, Trash2, Loader2, TrendingUp, Activity, CheckCircle } from 'lucide-react';
import { useDashboard, useUsageLogs } from '@/hooks/useDashboard';
import { useExportedApis } from '@/hooks/useExportedApis';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

const Usage = () => {
  const { stats, isLoading: statsLoading } = useDashboard();
  const { logs, isLoading: logsLoading } = useUsageLogs();
  const { apis, regenerateApiKey, deleteApi } = useExportedApis();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleViewAnalytics = (apiId: string) => {
    navigate(`/api-analytics/${apiId}`);
  };

  const handleCopyApiKey = async (apiId: string, apiName: string) => {
    try {
      const newKey = await regenerateApiKey(apiId);
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
    if (confirm(`Are you sure you want to delete "${apiName}"? This will stop all API access.`)) {
      try {
        const success = await deleteApi(apiId);
        if (success) {
          toast({
            title: "API Deleted",
            description: `${apiName} has been deleted and access revoked.`,
          });
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

  // Calculate display values with fallbacks
  const displayStats = {
    totalRequests: stats?.total_requests || 0,
    activeApis: stats?.active_apis || apis.filter(api => api.is_active).length,
    successRate: stats?.success_rate || 98.5,
    requestsGrowth: stats?.monthly_growth?.requests || 0,
    apisGrowth: stats?.monthly_growth?.apis || 0,
    successRateGrowth: stats?.monthly_growth?.success_rate || 0
  };

  return (
    <Layout>
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border bg-white">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-semibold">API Usage</h1>
            </div>
          </div>
        </div>
        
        <ScrollArea className="flex-1 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="border border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Total Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-lg">Loading...</span>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">{displayStats.totalRequests.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {displayStats.requestsGrowth > 0 ? '+' : ''}{displayStats.requestsGrowth}% from last month
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
            
            <Card className="border border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Active APIs
                </CardTitle>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-lg">Loading...</span>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">{displayStats.activeApis}</div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {displayStats.apisGrowth > 0 ? '+' : ''}{displayStats.apisGrowth} created this month
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
            
            <Card className="border border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Success Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-lg">Loading...</span>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">{displayStats.successRate.toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {displayStats.successRateGrowth > 0 ? '+' : ''}{displayStats.successRateGrowth.toFixed(1)}% from last month
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border border-border">
            <CardHeader>
              <CardTitle>API Endpoints</CardTitle>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Loading API usage data...</span>
                  </div>
                </div>
              ) : apis.length === 0 ? (
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-muted-foreground mb-2">No APIs created yet</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Create your first exported API to start tracking usage
                  </p>
                  <Button onClick={() => navigate('/exports')}>
                    Create API
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Base Model</TableHead>
                      <TableHead>Rate Limit</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apis.map((api) => (
                      <TableRow key={api.id}>
                        <TableCell className="font-medium">{api.name}</TableCell>
                        <TableCell className="capitalize">{api.export_type}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{api.base_model}</Badge>
                        </TableCell>
                        <TableCell>{api.rate_limit}/min</TableCell>
                        <TableCell>{new Date(api.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant={api.is_active ? 'default' : 'secondary'}>
                            {api.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewAnalytics(api.id)}
                              title="View Analytics"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCopyApiKey(api.id, api.name)}
                              title="Regenerate & Copy API Key"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteApi(api.id, api.name)}
                              title="Delete API"
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
        </ScrollArea>
      </div>
    </Layout>
  );
};

export default Usage;
