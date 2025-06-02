
import React from 'react';
import { Layout } from '@/components/Layout';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LinkIcon, Shield, Trash2, ExternalLink, Loader2, Globe } from 'lucide-react';
import { useConnectedApps } from '@/hooks/useDashboard';
import { useToast } from '@/components/ui/use-toast';

const Connected = () => {
  const { apps, isLoading, revokeApp } = useConnectedApps();
  const { toast } = useToast();

  const handleRevokeAccess = async (appId: string, appName: string) => {
    if (confirm(`Are you sure you want to revoke access for "${appName}"? This will stop the app from accessing your data.`)) {
      try {
        const success = await revokeApp(appId);
        if (success) {
          toast({
            title: "Access revoked",
            description: `${appName} no longer has access to your data.`,
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to revoke app access. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const handleViewApp = (appId: string, appName: string) => {
    // This would typically open the app's details or external URL
    toast({
      title: "App Details",
      description: `Opening details for ${appName}`,
    });
  };

  // Helper function to get app icon
  const getAppIcon = (appName: string) => {
    const name = appName.toLowerCase();
    if (name.includes('portfolio') || name.includes('website')) return '🚀';
    if (name.includes('writing') || name.includes('editor')) return '✍️';
    if (name.includes('analytics') || name.includes('dashboard')) return '📊';
    if (name.includes('mobile') || name.includes('app')) return '📱';
    if (name.includes('api') || name.includes('webhook')) return '🔌';
    return '🔗';
  };

  // Helper function to parse permissions
  const getPermissions = (app: any) => {
    const permissions = [];
    if (app.permissions) {
      return app.permissions;
    }
    
    // Fallback: derive permissions from export type and settings
    if (app.api_id) {
      permissions.push('API Access');
    }
    
    // Add more permission parsing logic based on your API structure
    return permissions.length > 0 ? permissions : ['Basic Access'];
  };

  return (
    <Layout>
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border bg-white">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-semibold">Connected Apps</h1>
            </div>
          </div>
        </div>
        
        <ScrollArea className="flex-1 p-6">
          <div className="mb-6">
            <Card className="border border-border bg-blue-50 dark:bg-blue-950/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">Your data is secure</p>
                    <p className="text-xs text-muted-foreground">
                      You can revoke access to any app at any time. Apps only see what you explicitly allow.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4 max-w-4xl">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Loading connected apps...</span>
                </div>
              </div>
            ) : apps.length === 0 ? (
              <div className="text-center py-12">
                <Globe className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">No connected apps</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  When you create exported APIs, apps that use them will appear here.
                </p>
                <Button onClick={() => window.location.href = '/exports'}>
                  Create API
                </Button>
              </div>
            ) : (
              apps.map((app) => (
                <Card key={app.id} className="border border-border hover:shadow-md transition-shadow group">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{getAppIcon(app.name)}</div>
                        <div>
                          <CardTitle className="text-base">{app.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            Connected {new Date(app.connected_at).toLocaleDateString()}
                          </p>
                          {app.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {app.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={app.is_active ? 'default' : 'secondary'} className="text-xs">
                          {app.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewApp(app.id, app.name)}
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          View App
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRevokeAccess(app.id, app.name)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Revoke
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium mb-2">Permissions:</p>
                        <div className="flex flex-wrap gap-1">
                          {getPermissions(app).map((permission, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {permission}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Last accessed: {new Date(app.last_accessed).toLocaleDateString()}</span>
                        {app.api_id && (
                          <span>API ID: {app.api_id.slice(0, 8)}...</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </Layout>
  );
};

export default Connected;
