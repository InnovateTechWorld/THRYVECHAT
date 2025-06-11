import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Settings as SettingsIcon, User, Bell, Shield, Palette, Loader2, Save, Sun, Moon, Laptop, Bot, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useSystemPrompt } from '@/hooks/useDashboard';
import { useModels, getModelDisplayInfo } from '@/hooks/useModels';
import { useDefaultModel } from '@/hooks/useDefaultModel';
import { useToast } from '@/components/ui/use-toast';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { cn } from '@/lib/utils';

const Settings = () => {
  const { user, signOut } = useAuth();
  const { theme, setTheme, effectiveTheme } = useTheme();
  const { prompt, updatePrompt, isLoading: promptLoading } = useSystemPrompt();
  const { models, isLoading: modelsLoading } = useModels();
  const { 
    defaultModel, 
    isLoading: defaultModelLoading,
    setDefaultModel,
    removeDefaultModel,
    isSettingDefault,
    isRemovingDefault
  } = useDefaultModel();
  const { toast } = useToast();

  const [profile, setProfile] = useState({
    name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || '',
    email: user?.email || '',
    avatar: user?.user_metadata?.avatar_url || ''
  });

  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    lowBalance: true,
    apiAlerts: true
  });

  const [localSystemPrompt, setLocalSystemPrompt] = useState(prompt);
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Update local prompt when the hook loads data
  React.useEffect(() => {
    setLocalSystemPrompt(prompt);
  }, [prompt]);

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    
    // Simulate profile save - in real app this would call Supabase user update
    try {
      // TODO: Implement actual profile update with Supabase
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveSystemPrompt = async () => {
    if (!localSystemPrompt.trim()) {
      toast({
        title: "Error",
        description: "System prompt cannot be empty.",
        variant: "destructive"
      });
      return;
    }

    setIsSavingPrompt(true);
    
    try {
      const success = await updatePrompt(localSystemPrompt);
      
      if (success) {
        toast({
          title: "System prompt updated",
          description: "Your custom system prompt has been saved and will be used in all conversations.",
        });
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save system prompt. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSavingPrompt(false);
    }
  };

  const handleSetDefaultModel = async (modelId: string) => {
    try {
      setDefaultModel(modelId, {
        onSuccess: () => {
          toast({
            title: "Default model updated",
            description: `${models.find(m => m.id === modelId)?.name || modelId} is now your default model.`,
          });
        },
        onError: (error: Error) => {
          toast({
            title: "Error",
            description: error.message || "Failed to set default model. Please try again.",
            variant: "destructive"
          });
        }
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to set default model. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleRemoveDefaultModel = async () => {
    try {
      removeDefaultModel(undefined, {
        onSuccess: () => {
          toast({
            title: "Default model removed",
            description: "Default model has been removed. The system will use the fallback model.",
          });
        },
        onError: (error: Error) => {
          toast({
            title: "Error",
            description: error.message || "Failed to remove default model. Please try again.",
            variant: "destructive"
          });
        }
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove default model. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSignOut = async () => {
    if (confirm("Are you sure you want to sign out?")) {
      try {
        await signOut();
        toast({
          title: "Signed out",
          description: "You have been signed out successfully.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to sign out. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const currentDefaultModel = models.find(m => m.id === defaultModel);

  return (
    <Layout>
      <div className="flex-1 flex flex-col bg-background text-foreground">
        <div className="flex items-center justify-between p-6 border-b border-border bg-card">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-semibold">Settings</h1>
            </div>
          </div>
        </div>
        
        <ScrollArea className="flex-1 p-6">
          <div className="max-w-2xl space-y-6">
            {/* Profile Settings */}
            <Card className="border border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    placeholder="Your display name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Email is managed through your authentication provider
                  </p>
                </div>
                <Button onClick={handleSaveProfile} disabled={isSavingProfile}>
                  {isSavingProfile ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Profile
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Default Model Settings */}
            <Card className="border border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-4 h-4" />
                  Default AI Model
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Preferred Model</label>
                  <p className="text-xs text-muted-foreground mb-3">
                    This model will be automatically selected for new conversations and when no specific model is chosen.
                  </p>
                  
                  {modelsLoading || defaultModelLoading ? (
                    <div className="flex items-center gap-2 p-3 border rounded-md">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Loading models...</span>
                    </div>
                  ) : (
                    <>
                      <Select
                        value={defaultModel || ""}
                        onValueChange={handleSetDefaultModel}
                        disabled={isSettingDefault}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a default model">
                            {currentDefaultModel ? (
                              <div className="flex items-center gap-2">
                                <div className={cn("w-2 h-2 rounded-full", getModelDisplayInfo(currentDefaultModel.id).color)} />
                                <span>{currentDefaultModel.name}</span>
                                {getModelDisplayInfo(currentDefaultModel.id).isFree && (
                                  <Badge variant="secondary" className="text-xs">FREE</Badge>
                                )}
                              </div>
                            ) : (
                              "No default model set"
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {models.map((model) => {
                            const displayInfo = getModelDisplayInfo(model.id);
                            return (
                              <SelectItem key={model.id} value={model.id}>
                                <div className="flex items-center gap-2 w-full">
                                  <div className={cn("w-2 h-2 rounded-full", displayInfo.color)} />
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate flex items-center gap-2">
                                      {model.name}
                                      {displayInfo.isFree && (
                                        <Badge variant="secondary" className="text-xs">FREE</Badge>
                                      )}
                                    </div>
                                    <div className="text-xs text-muted-foreground truncate">
                                      {model.id}
                                    </div>
                                  </div>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      
                      {defaultModel && (
                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRemoveDefaultModel}
                            disabled={isRemovingDefault}
                          >
                            {isRemovingDefault ? (
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            ) : (
                              <Trash2 className="w-3 h-3 mr-1" />
                            )}
                            Remove Default
                          </Button>
                          <span className="text-xs text-muted-foreground">
                            Will fallback to system default (Mistral Devstral Small)
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
                
                {currentDefaultModel && (
                  <div className="p-3 bg-muted/50 rounded-md">
                    <div className="text-sm font-medium mb-1">Current Default Model</div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className={cn("w-2 h-2 rounded-full", getModelDisplayInfo(currentDefaultModel.id).color)} />
                      <span>{currentDefaultModel.name}</span>
                      {getModelDisplayInfo(currentDefaultModel.id).isFree && (
                        <Badge variant="secondary" className="text-xs">FREE</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      ID: {currentDefaultModel.id}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Theme Settings */}
            <Card className="border border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Appearance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={theme}
                  onValueChange={(value) => setTheme(value as 'light' | 'dark' | 'system')}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                >
                  <Label
                    htmlFor="light-theme"
                    className={`flex flex-col items-center justify-center rounded-md border-2 p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer ${
                      theme === 'light' ? 'border-primary bg-primary/10' : 'border-muted'
                    }`}
                  >
                    <RadioGroupItem value="light" id="light-theme" className="sr-only" />
                    <Sun className="w-8 h-8 mb-2" />
                    Light
                  </Label>
                  <Label
                    htmlFor="dark-theme"
                    className={`flex flex-col items-center justify-center rounded-md border-2 p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer ${
                      theme === 'dark' ? 'border-primary bg-primary/10' : 'border-muted'
                    }`}
                  >
                    <RadioGroupItem value="dark" id="dark-theme" className="sr-only" />
                    <Moon className="w-8 h-8 mb-2" />
                    Dark
                  </Label>
                  <Label
                    htmlFor="system-theme"
                    className={`flex flex-col items-center justify-center rounded-md border-2 p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer ${
                      theme === 'system' ? 'border-primary bg-primary/10' : 'border-muted'
                    }`}
                  >
                    <RadioGroupItem value="system" id="system-theme" className="sr-only" />
                    <Laptop className="w-8 h-8 mb-2" />
                    System
                  </Label>
                </RadioGroup>
                <p className="text-xs text-muted-foreground mt-2">
                  Current effective theme: <span className="font-semibold">{effectiveTheme}</span>
                </p>
              </CardContent>
            </Card>

            {/* System Prompt */}
            <Card className="border border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  System Prompt
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Custom System Prompt</label>
                  {promptLoading && !localSystemPrompt ? (
                    <div className="flex items-center gap-2 p-3 border rounded-md">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Loading system prompt...</span>
                    </div>
                  ) : (
                    <Textarea
                      placeholder="Enter your custom system prompt..."
                      value={localSystemPrompt}
                      onChange={(e) => setLocalSystemPrompt(e.target.value)}
                      rows={4}
                    />
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    This prompt will be sent to all AI models as context for your conversations.
                  </p>
                </div>
                <Button onClick={handleSaveSystemPrompt} disabled={isSavingPrompt}>
                  {isSavingPrompt ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save System Prompt
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card className="border border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive email updates</p>
                  </div>
                  <Switch
                    checked={notifications.email}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Push Notifications</p>
                    <p className="text-sm text-muted-foreground">Browser notifications</p>
                  </div>
                  <Switch
                    checked={notifications.push}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, push: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Low Balance Alerts</p>
                    <p className="text-sm text-muted-foreground">Alert when tokens are low</p>
                  </div>
                  <Switch
                    checked={notifications.lowBalance}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, lowBalance: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">API Alerts</p>
                    <p className="text-sm text-muted-foreground">Notifications for API issues</p>
                  </div>
                  <Switch
                    checked={notifications.apiAlerts}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, apiAlerts: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Security */}
            <Card className="border border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Security & Account
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Account Actions</p>
                  <p className="text-xs text-muted-foreground">
                    Password and security settings are managed through your authentication provider.
                  </p>
                </div>
                <Button onClick={handleSignOut} variant="outline" className="w-full">
                  Sign Out
                </Button>
                <Button variant="destructive" className="w-full" disabled>
                  Delete Account (Contact Support)
                </Button>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </div>
    </Layout>
  );
};

export default Settings;
