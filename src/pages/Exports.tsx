import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Download, Plus, Settings, Copy, Eye, Loader2, Trash2, RefreshCw, ExternalLink, CheckCircle, BarChart3, Brain, NotebookPen, Code } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useExportedApis, useQuickExport } from '@/hooks/useExportedApis';
import { useModels } from '@/hooks/useModels';
import { useChatSessions } from '@/hooks/useChat';
import { useMemory } from '@/hooks/useMemory';
import { useNotes } from '@/hooks/useNotes';
import { ContextSettings } from '@/components/ContextSettings';
import { ContextToggle } from '@/components/ContextToggle';
import { API_URL } from '@/lib/api';

interface ApiCreationResult {
  id: string;
  name: string;
  api_key: string;
  export_type: 'context' | 'session';
  base_model: string;
  allowed_models: string[];
  rate_limit: number;
  created_at: string;
  api_url?: string;
}

const Exports = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createdApi, setCreatedApi] = useState<ApiCreationResult | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showExamplesModal, setShowExamplesModal] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const { apis, isLoading, createApi, deleteApi, regenerateApiKey } = useExportedApis();
  const { models } = useModels();
  const { sessions } = useChatSessions();
  const { memories } = useMemory();
  const { notes } = useNotes();
  const { createContextAPI, createSessionAPI } = useQuickExport();

  const [newApi, setNewApi] = useState<{
    name: string;
    description: string;
    export_type: 'context' | 'session';
    session_id: string;
    base_model: string;
    allowed_models: string[];
    rate_limit: number;
    include_memories: boolean;
    include_notes: boolean;
  }>({
    name: '',
    description: '',
    export_type: 'context',
    session_id: '',
    base_model: '',
    allowed_models: [],
    rate_limit: 100,
    include_memories: false,
    include_notes: false
  });

  const handleCreateApi = async () => {
    if (!newApi.name.trim() || !newApi.base_model) {
      toast({
        title: "Error",
        description: "Name and base model are required.",
        variant: "destructive"
      });
      return;
    }

    if (newApi.export_type === 'session' && !newApi.session_id) {
      toast({
        title: "Error",
        description: "Session ID is required for session exports.",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);

    try {
      const result = await createApi({
        ...newApi,
        allowed_models: newApi.allowed_models.length > 0 ? newApi.allowed_models : [newApi.base_model],
        name: newApi.name.trim(),
        description: newApi.description.trim() || undefined
      });

      if (result) {
        const apiResult: ApiCreationResult = {
          ...result,
          api_url: `${API_URL}/api/exported/${result.export_type}/v1/chat/completions`
        };
        
        setCreatedApi(apiResult);
        setIsCreateModalOpen(false);
        setShowSuccessModal(true);

        if (result.api_key) {
          navigator.clipboard.writeText(result.api_key);
        }

        setNewApi({
          name: '',
          description: '',
          export_type: 'context',
          session_id: '',
          base_model: '',
          allowed_models: [],
          rate_limit: 100,
          include_memories: false,
          include_notes: false
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create API. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleQuickContextExport = async () => {
    setIsCreating(true);
    try {
      const selectedModels = models.slice(0, 3).map(m => m.id);
      const result = await createContextAPI(
        selectedModels,
        false,
        false,
        'Quick Context API',
        'Quickly generated API with default settings'
      );

      if (result) {
        const quickApiResult: ApiCreationResult = {
          id: result.id,
          name: 'Quick Context API',
          api_key: result.apiKey,
          export_type: 'context',
          base_model: selectedModels[0] || 'openai/gpt-3.5-turbo',
          allowed_models: selectedModels,
          rate_limit: 100,
          created_at: new Date().toISOString(),
          api_url: result.apiUrl
        };
        
        setCreatedApi(quickApiResult);
        setShowSuccessModal(true);
        
        navigator.clipboard.writeText(result.apiKey);
        toast({
          title: "Quick Context API Created",
          description: "API key copied to clipboard!",
        });
      } else {
        throw new Error('No result returned from API creation');
      }
    } catch (error) {
      console.error('Quick export error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      toast({
        title: "Error",
        description: `Failed to create quick export: ${errorMessage}`,
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: `${label} copied to clipboard.`,
    });
  };

  // Examples for created API (in success modal)
  const getUsageExample = () => {
    if (!createdApi) return '';
    
    return `curl -X POST "${createdApi.api_url}" \\
  -H "Authorization: Bearer ${createdApi.api_key}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${createdApi.base_model}",
    "messages": [
      {
        "role": "user",
        "content": "Hello! How can you help me?"
      }
    ],
    "stream": false,
    "temperature": 0.7,
    "max_tokens": 1000
  }'`;
  };

  const getJavaScriptExample = () => {
    if (!createdApi) return '';
    
    return `const response = await fetch('${createdApi.api_url}', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${createdApi.api_key}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: '${createdApi.base_model}',
    messages: [
      {
        role: 'user',
        content: 'Hello! How can you help me?'
      }
    ],
    stream: false,
    temperature: 0.7,
    max_tokens: 1000
  })
});

const data = await response.json();
console.log(data.choices[0].message.content);`;
  };

  const getPythonExample = () => {
    if (!createdApi) return '';
    
    return `import requests

url = "${createdApi.api_url}"
headers = {
    "Authorization": "Bearer ${createdApi.api_key}",
    "Content-Type": "application/json"
}

data = {
    "model": "${createdApi.base_model}",
    "messages": [
        {
            "role": "user",
            "content": "Hello! How can you help me?"
        }
    ],
    "stream": False,
    "temperature": 0.7,
    "max_tokens": 1000
}

response = requests.post(url, headers=headers, json=data)
result = response.json()
print(result["choices"][0]["message"]["content"])`;
  };

  // Examples for existing APIs (in examples modal)
  const getApiUsageExample = (api: any, type: 'curl' | 'javascript' | 'python') => {
    const apiUrl = `${API_URL}/api/exported/${api.export_type}/v1/chat/completions`;
    
    switch (type) {
      case 'curl':
        return `curl -X POST "${apiUrl}" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${api.base_model}",
    "messages": [
      {
        "role": "user",
        "content": "Hello! How can you help me?"
      }
    ],
    "stream": false,
    "temperature": 0.7,
    "max_tokens": 1000
  }'`;

      case 'javascript':
        return `const response = await fetch('${apiUrl}', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: '${api.base_model}',
    messages: [
      {
        role: 'user',
        content: 'Hello! How can you help me?'
      }
    ],
    stream: false,
    temperature: 0.7,
    max_tokens: 1000
  })
});

const data = await response.json();
console.log(data.choices[0].message.content);`;

      case 'python':
        return `import requests

url = "${apiUrl}"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}

data = {
    "model": "${api.base_model}",
    "messages": [
        {
            "role": "user",
            "content": "Hello! How can you help me?"
        }
    ],
    "stream": False,
    "temperature": 0.7,
    "max_tokens": 1000
}

response = requests.post(url, headers=headers, json=data)
result = response.json()
print(result["choices"][0]["message"]["content"])`;

      default:
        return '';
    }
  };

  const handleViewAnalytics = (exportId: string) => {
    navigate(`/api-analytics/${exportId}`);
  };

  const handleCopyApiKey = async (apiId: string) => {
    try {
      const newKey = await regenerateApiKey(apiId);
      if (newKey) {
        navigator.clipboard.writeText(newKey);
        toast({
          title: "New API Key Generated",
          description: "The new API key has been copied to your clipboard.",
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
    if (confirm(`Are you sure you want to delete "${apiName}"? This action cannot be undone.`)) {
      try {
        await deleteApi(apiId);
        toast({
          title: "API Deleted",
          description: `${apiName} has been deleted successfully.`,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete API';
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive"
        });
      }
    }
  };

  return (
    <Layout>
      <div className="flex-1 flex flex-col bg-background text-foreground">
        <div className="flex items-center justify-between p-6 border-b border-border bg-card">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <Download className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-semibold">Export APIs</h1>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleQuickContextExport}
              variant="outline"
              disabled={isCreating}
            >
              {isCreating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ExternalLink className="w-4 h-4 mr-2" />}
              Quick Export
            </Button>
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Create API
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Create Export API</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Name *</label>
                    <Input
                      placeholder="My Custom API"
                      value={newApi.name}
                      onChange={(e) => setNewApi(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      placeholder="API for my React app..."
                      value={newApi.description}
                      onChange={(e) => setNewApi(prev => ({ ...prev, description: e.target.value }))}
                      rows={2}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Export Type *</label>
                      <select
                        className="mt-1 w-full px-3 py-2 bg-background border border-border rounded-md text-sm"
                        value={newApi.export_type}
                        onChange={(e) => setNewApi(prev => ({ ...prev, export_type: e.target.value as 'context' | 'session' }))}
                      >
                        <option value="context">Context (includes memories & notes)</option>
                        <option value="session">Session (specific conversation)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Rate Limit (req/min)</label>
                      <Input
                        type="number"
                        placeholder="100"
                        value={newApi.rate_limit}
                        onChange={(e) => setNewApi(prev => ({ ...prev, rate_limit: parseInt(e.target.value) || 100 }))}
                      />
                    </div>
                  </div>
                  
                  {newApi.export_type === 'session' && (
                    <div>
                      <label className="text-sm font-medium">Session *</label>
                      <select
                        className="mt-1 w-full px-3 py-2 bg-background border border-border rounded-md text-sm"
                        value={newApi.session_id}
                        onChange={(e) => setNewApi(prev => ({ ...prev, session_id: e.target.value }))}
                      >
                        <option value="">Select a session...</option>
                        {sessions.map(session => (
                          <option key={session.id} value={session.id}>
                            {session.name} ({session.message_count} messages)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  <div>
                    <label className="text-sm font-medium">Base Model *</label>
                    <select
                      className="mt-1 w-full px-3 py-2 bg-background border border-border rounded-md text-sm"
                      value={newApi.base_model}
                      onChange={(e) => setNewApi(prev => ({ ...prev, base_model: e.target.value }))}
                    >
                      <option value="">Select base model...</option>
                      {models.map(model => (
                        <option key={model.id} value={model.id}>
                          {model.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <ContextSettings
                    includeMemories={newApi.include_memories}
                    includeNotes={newApi.include_notes}
                    onMemoriesChange={(include) => setNewApi(prev => ({ ...prev, include_memories: include }))}
                    onNotesChange={(include) => setNewApi(prev => ({ ...prev, include_notes: include }))}
                    memoryCount={memories?.length || 0}
                    notesCount={notes?.length || 0}
                    showTokenWarning={true}
                  />
                  
                  <div className="flex gap-2">
                    <Button onClick={handleCreateApi} className="flex-1" disabled={isCreating}>
                      {isCreating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create API'
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateModalOpen(false)}
                      className="flex-1"
                      disabled={isCreating}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-4 max-w-4xl">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Loading exported APIs...</span>
                </div>
              </div>
            ) : apis.length === 0 ? (
              <div className="text-center py-12">
                <Download className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">No exported APIs yet</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Create your first API to share your AI context with external apps
                </p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={handleQuickContextExport} variant="outline">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Quick Export
                  </Button>
                  <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Create API
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                </div>
              </div>
            ) : (
              apis.map((api) => (
                <Card key={api.id} className="border border-border hover:shadow-md transition-shadow group">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{api.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {api.base_model}
                        </Badge>
                        <Badge variant={api.is_active ? 'default' : 'secondary'} className="text-xs">
                          {api.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline" className="text-xs capitalize">
                          {api.export_type}
                        </Badge>
                        {api.include_memories && (
                          <Badge variant="secondary" className="text-xs flex items-center gap-1">
                            <Brain className="w-3 h-3" />
                            Memories
                          </Badge>
                        )}
                        {api.include_notes && (
                          <Badge variant="secondary" className="text-xs flex items-center gap-1">
                            <NotebookPen className="w-3 h-3" />
                            Notes
                          </Badge>
                        )}
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
                          onClick={() => setShowExamplesModal(api)}
                          title="View Usage Examples"
                        >
                          <Code className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopyApiKey(api.id)}
                          title="Regenerate & Copy API Key"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteApi(api.id, api.name)}
                          title="Delete API"
                          className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {api.description || 'No description provided'}
                    </p>
                    
                    <ContextToggle
                      apiId={api.id}
                      currentMemories={api.include_memories || false}
                      currentNotes={api.include_notes || false}
                      memoryCount={memories?.length || 0}
                      notesCount={notes?.length || 0}
                      onUpdate={(updatedAPI) => {
                        console.log('Context updated for API:', api.id, updatedAPI);
                      }}
                    />
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Rate limit: {api.rate_limit}/min</span>
                      <span>Models: {api.allowed_models.length}</span>
                      <span>Created {new Date(api.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      API Key: {api.api_key_preview}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Usage Examples Modal */}
        <Dialog open={!!showExamplesModal} onOpenChange={() => setShowExamplesModal(null)}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Code className="w-5 h-5" />
                Usage Examples - {showExamplesModal?.name}
              </DialogTitle>
            </DialogHeader>
            
            {showExamplesModal && (
              <div className="space-y-6">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">API Endpoint:</span>
                      <div className="flex gap-2 mt-1">
                        <Input
                          value={`${API_URL}/api/exported/${showExamplesModal.export_type}/v1/chat/completions`}
                          readOnly
                          className="font-mono text-xs"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(`${API_URL}/api/exported/${showExamplesModal.export_type}/v1/chat/completions`, 'API endpoint')}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Base Model:</span> {showExamplesModal.base_model}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <Badge variant="outline">cURL</Badge>
                      Command Line
                    </h3>
                    <Button
                      size="sm"
                      onClick={() => copyToClipboard(getApiUsageExample(showExamplesModal, 'curl'), 'cURL example')}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy cURL
                    </Button>
                  </div>
                  <Textarea
                    value={getApiUsageExample(showExamplesModal, 'curl')}
                    readOnly
                    className="font-mono text-xs bg-background"
                    rows={12}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <Badge variant="outline">JavaScript</Badge>
                      Node.js / Browser
                    </h3>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(getApiUsageExample(showExamplesModal, 'javascript'), 'JavaScript example')}
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy JS
                    </Button>
                  </div>
                  <Textarea
                    value={getApiUsageExample(showExamplesModal, 'javascript')}
                    readOnly
                    className="font-mono text-xs bg-background"
                    rows={10}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <Badge variant="outline">Python</Badge>
                      Python Requests
                    </h3>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(getApiUsageExample(showExamplesModal, 'python'), 'Python example')}
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy Python
                    </Button>
                  </div>
                  <Textarea
                    value={getApiUsageExample(showExamplesModal, 'python')}
                    readOnly
                    className="font-mono text-xs bg-background"
                    rows={10}
                  />
                </div>

                <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">Important Notes:</p>
                  <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                    <li>• Replace <code className="bg-yellow-100 dark:bg-yellow-900/50 px-1 rounded">YOUR_API_KEY</code> with your actual API key</li>
                    <li>• Your API key provides access to your {showExamplesModal.export_type === 'context' ? 'personal AI context' : 'conversation history'}</li>
                    <li>• This API follows OpenAI-compatible format for easy integration</li>
                    <li>• All requests are rate-limited to {showExamplesModal.rate_limit} requests per minute</li>
                    <li>• Models list available at: <code className="bg-yellow-100 dark:bg-yellow-900/50 px-1 rounded">{API_URL}/api/exported/v1/models</code></li>
                    <li>• For third-party integrations: if it doesn't work, remove "/chat/completions" from the URL as some tools add it automatically</li>
                    {showExamplesModal.export_type === 'context' && (
                      <li>• Context APIs include your memories, notes, and system prompt automatically</li>
                    )}
                  </ul>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => navigate(`/api-analytics/${showExamplesModal.id}`)}
                    variant="outline"
                    className="flex-1"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    View Analytics
                  </Button>
                  <Button
                    onClick={() => setShowExamplesModal(null)}
                    className="flex-1"
                  >
                    Done
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Success Modal */}
        <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                API Created Successfully!
              </DialogTitle>
            </DialogHeader>
            
            {createdApi && (
              <div className="space-y-6">
                <div className="p-4 border border-green-200 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <ExternalLink className="w-4 h-4" />
                    <span className="font-medium">{createdApi.name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your {createdApi.export_type} API is now live and ready to use. Save your API key securely!
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">API Endpoint</label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={createdApi.api_url || ''}
                        readOnly
                        className="font-mono text-xs"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(createdApi.api_url || '', 'API endpoint')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">API Key</label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={createdApi.api_key}
                        readOnly
                        className="font-mono text-xs"
                        type="password"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(createdApi.api_key, 'API key')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Configuration</label>
                  <div className="p-3 bg-muted rounded-lg mt-1">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Type:</span> {createdApi.export_type}
                      </div>
                      <div>
                        <span className="font-medium">Rate Limit:</span> {createdApi.rate_limit}/min
                      </div>
                      <div>
                        <span className="font-medium">Base Model:</span> {createdApi.base_model}
                      </div>
                      <div>
                        <span className="font-medium">Models:</span> {createdApi.allowed_models.length}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Available Models</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <Badge variant="secondary">base (default)</Badge>
                    {createdApi.allowed_models.map(modelId => (
                      <Badge key={modelId} variant="outline">{modelId}</Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">cURL Example</label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(getUsageExample(), 'cURL example')}
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <Textarea
                    value={getUsageExample()}
                    readOnly
                    className="font-mono text-xs"
                    rows={10}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">JavaScript Example</label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(getJavaScriptExample(), 'JavaScript example')}
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <Textarea
                    value={getJavaScriptExample()}
                    readOnly
                    className="font-mono text-xs"
                    rows={8}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">Python Example</label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(getPythonExample(), 'Python example')}
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <Textarea
                    value={getPythonExample()}
                    readOnly
                    className="font-mono text-xs"
                    rows={10}
                  />
                </div>

                <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">Important Notes:</p>
                  <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                    <li>• Your API key provides access to your {createdApi.export_type === 'context' ? 'personal AI context' : 'conversation history'}</li>
                    <li>• Store the API key securely - it won't be shown in full again</li>
                    <li>• This API follows OpenAI-compatible format for easy integration</li>
                    <li>• All requests are rate-limited to {createdApi.rate_limit} requests per minute</li>
                    <li>• Usage is tracked and can be monitored in the dashboard</li>
                    <li>• Models list available at: <code className="bg-yellow-100 dark:bg-yellow-900/50 px-1 rounded">{API_URL}/api/exported/v1/models</code></li>
                    <li>• For third-party integrations: if it doesn't work, remove "/chat/completions" from the URL as some tools add it automatically</li>
                    {createdApi.export_type === 'context' && (
                      <li>• Context APIs include your memories, notes, and system prompt automatically</li>
                    )}
                  </ul>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => navigate('/usage')}
                    variant="outline"
                    className="flex-1"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    View Analytics
                  </Button>
                  <Button
                    onClick={() => setShowSuccessModal(false)}
                    className="flex-1"
                  >
                    Done
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Exports;