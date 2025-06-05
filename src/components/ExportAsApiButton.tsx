
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Download, Copy, CheckCircle, Loader2, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuickExport } from '@/hooks/useExportedApis';
import { useModels } from '@/hooks/useModels';
import { useMemory } from '@/hooks/useMemory';
import { useNotes } from '@/hooks/useNotes';
import { ContextSettings } from '@/components/ContextSettings';
import { API_URL } from '@/lib/api';

interface ExportAsApiButtonProps {
  sessionId?: string;
  messages?: any[];
  type?: 'session' | 'context';
}

interface ExportResult {
  apiKey: string;
  apiUrl: string;
  id: string;
  type: 'session' | 'context';
  sessionId?: string;
}

export const ExportAsApiButton = ({ sessionId, messages, type = 'session' }: ExportAsApiButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [apiName, setApiName] = useState('');
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);
  const [isModelsExpanded, setIsModelsExpanded] = useState(true);
  const [apiDescription, setApiDescription] = useState(''); // ADD THIS


  // NEW: Context settings state
  const [includeMemories, setIncludeMemories] = useState(false);
  const [includeNotes, setIncludeNotes] = useState(false);
  
  const { toast } = useToast();
  const { createSessionAPI, createContextAPI } = useQuickExport();
  const { models } = useModels();
  const { memories } = useMemory();
  const { notes } = useNotes();

  const handleExport = async () => {
    if (!apiName.trim()) {
      toast({
        title: "Error",
        description: "API name is required.",
        variant: "destructive"
      });
      return;
    }

    if (selectedModels.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one model.",
        variant: "destructive"
      });
      return;
    }

    if (type === 'session' && (!sessionId || sessionId === 'default')) {
      toast({
        title: "Error",
        description: "Session ID is required for session export. Please start a conversation first.",
        variant: "destructive"
      });
      return;
    }

    // Additional validation for session ID format
    if (type === 'session' && sessionId && sessionId !== 'default') {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(sessionId)) {
        toast({
          title: "Error",
          description: "Invalid session ID format. Please start a new conversation.",
          variant: "destructive"
        });
        return;
      }
    }

    setIsExporting(true);

    try {
      let result;
      
      console.log('Starting export:', {
        type,
        sessionId,
        selectedModels,
        sessionIdType: typeof sessionId,
        sessionIdLength: sessionId?.length
      });
      
      if (type === 'session' && sessionId && sessionId !== 'default') {
        // For session export, use createSessionAPI with proper error handling
        console.log('Creating session API with:', {
          sessionId,
          modelsToExpose: selectedModels,
          includeMemories,
          includeNotes,
          sessionIdValid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sessionId)
        });
        result = await createSessionAPI(
          sessionId,
          selectedModels,
          includeMemories,
          includeNotes,
          apiName.trim(), // Pass the name
          apiDescription.trim() || undefined // Pass description if provided
        );
      } else {
        // For context export
        console.log('Creating context API with:', {
          modelsToExpose: selectedModels,
          includeMemories,
          includeNotes
        });
        result = await createContextAPI(
          selectedModels,
          includeMemories,
          includeNotes,
          apiName.trim(), // Pass the name
          apiDescription.trim() || undefined // Pass description if provided
        );
      }

      if (result) {
        console.log('Export successful:', result);
        setExportResult(result);
        
        // Copy API key to clipboard
        navigator.clipboard.writeText(result.apiKey);
        
        toast({
          title: "API exported successfully!",
          description: "API key has been copied to your clipboard. Save it securely!",
        });
      } else {
        throw new Error('Export returned no result');
      }
    } catch (error) {
      console.error('Export error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // More specific error handling
      let userMessage = errorMessage;
      if (errorMessage.includes('Session ID is required')) {
        userMessage = "Session ID is missing. Please select a valid conversation.";
      } else if (errorMessage.includes('Not authenticated')) {
        userMessage = "Authentication failed. Please sign in again.";
      } else if (errorMessage.includes('At least one model')) {
        userMessage = "Please select at least one AI model.";
      } else if (errorMessage.includes('400')) {
        userMessage = "Invalid request. Please check your selection and try again.";
      } else if (errorMessage.includes('401')) {
        userMessage = "Authentication failed. Please sign in again.";
      } else if (errorMessage.includes('403')) {
        userMessage = "Permission denied. Please check your account permissions.";
      }
      
      toast({
        title: "Export failed",
        description: userMessage,
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: `${label} copied to clipboard.`,
    });
  };

  const resetModal = () => {
    setExportResult(null);
    setApiName('');
    setApiDescription(''); // ADD THIS
    setSelectedModels([]);
    setIncludeMemories(false);
    setIncludeNotes(false);
    setIsModelsExpanded(true); // Reset to expanded
  };

  const toggleModel = (modelId: string) => {
    setSelectedModels(prev =>
      prev.includes(modelId)
        ? prev.filter(id => id !== modelId)
        : [...prev, modelId]
    );
  };

  const getUsageExample = () => {
  if (!exportResult) return '';
  
  return `curl -X POST "${exportResult.apiUrl}" \\
  -H "Authorization: Bearer ${exportResult.apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${selectedModels[0] || 'base'}",
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetModal();
    }}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="h-8 px-3 text-xs border-primary/50 hover:bg-primary/10"
        >
          <Download className="w-3 h-3 mr-1" />
          Export as API
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Export {type === 'session' ? 'Conversation' : 'Profile'} as API
          </DialogTitle>
        </DialogHeader>
        
        {!exportResult ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">API Name *</label>
              <Input
                placeholder={`My ${type === 'session' ? 'Chat' : 'Profile'} API`}
                value={apiName}
                onChange={(e) => setApiName(e.target.value)}
              />
            </div>
            
            {/* ADD THIS: Description field */}
            <div>
              <label className="text-sm font-medium">Description (Optional)</label>
              <Input
                placeholder="Describe what this API does..."
                value={apiDescription}
                onChange={(e) => setApiDescription(e.target.value)}
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Select Models *</label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsModelsExpanded(!isModelsExpanded)}
                  className="h-6 px-2 text-xs"
                >
                  {isModelsExpanded ? (
                    <>
                      <ChevronUp className="w-3 h-3 mr-1" />
                      Collapse
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3 mr-1" />
                      Expand ({selectedModels.length} selected)
                    </>
                  )}
                </Button>
              </div>
              
              {isModelsExpanded && (
                <div className="grid grid-cols-2 gap-2">
                  {models.map((model) => (
                    <div
                      key={model.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedModels.includes(model.id)
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => toggleModel(model.id)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{model.name}</span>
                        <input
                          type="checkbox"
                          checked={selectedModels.includes(model.id)}
                          onChange={() => {}} // Handled by div click
                          className="pointer-events-none"
                        />
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {model.id}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {!isModelsExpanded && selectedModels.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedModels.map(modelId => {
                    const model = models.find(m => m.id === modelId);
                    return (
                      <Badge key={modelId} variant="secondary" className="text-xs">
                        {model?.name || modelId}
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>

            
            {/* NEW: Context Settings */}
            <ContextSettings
              includeMemories={includeMemories}
              includeNotes={includeNotes}
              onMemoriesChange={setIncludeMemories}
              onNotesChange={setIncludeNotes}
              memoryCount={memories?.length || 0}
              notesCount={notes?.length || 0}
              showTokenWarning={true}
            />
            
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <p className="text-sm font-medium mb-2">This will create an API endpoint that includes:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                {type === 'session' ? (
                  <>
                    <li>• Full conversation history from this session</li>
                    {includeMemories && <li>• Your stored memories ({memories?.length || 0} items)</li>}
                    {includeNotes && <li>• Your personal notes ({notes?.length || 0} items)</li>}
                    <li>• Session-specific AI behavior</li>
                  </>
                ) : (
                  <>
                    <li>• Custom system prompt</li>
                    {includeMemories && <li>• Your complete memory profile ({memories?.length || 0} items)</li>}
                    {includeNotes && <li>• Your personal notes ({notes?.length || 0} items)</li>}
                  </>
                )}
                <li>• Selected AI model configurations</li>
                <li>• Rate limiting and usage tracking</li>
              </ul>
            </div>
            
            {type === 'session' && sessionId && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm">
                  <strong>Session:</strong> {sessionId.slice(0, 8)}...
                </p>
                <p className="text-sm text-muted-foreground">
                  {messages?.length || 0} messages will be included
                </p>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button
                onClick={handleExport}
                className="flex-1"
                disabled={!apiName.trim() || selectedModels.length === 0 || isExporting}
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  'Export API'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="flex-1"
                disabled={isExporting}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">API exported successfully!</span>
            </div>
            
            <div className="p-4 border border-green-200 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <ExternalLink className="w-4 h-4" />
                <span className="font-medium">Your API is ready!</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Save your API key securely - it won't be shown again for security reasons.
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium">API Endpoint</label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={exportResult.apiUrl}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(exportResult.apiUrl, 'API endpoint')}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium">API Key</label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={exportResult.apiKey}
                  readOnly
                  className="font-mono text-sm"
                  type="password"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(exportResult.apiKey, 'API key')}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium">Available Models</label>
              <div className="flex flex-wrap gap-1 mt-1">
                <Badge variant="secondary">base (default)</Badge>
                {selectedModels.map(modelId => (
                  <Badge key={modelId} variant="outline">{modelId}</Badge>
                ))}
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Example Usage</label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(getUsageExample(), 'Usage example')}
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copy
                </Button>
              </div>
              <Textarea
                value={getUsageExample()}
                readOnly
                className="font-mono text-xs"
                rows={12}
              />
            </div>
            
            <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 rounded-lg">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Important Notes:</p>
              <ul className="text-sm text-yellow-700 dark:text-yellow-300 mt-1 space-y-1">
                <li>• Store your API key securely - it provides access to your AI context</li>
                <li>• This API is rate-limited and usage is tracked</li>
                <li>• You can manage this API in the Exports section</li>
                <li>• The API follows OpenAI-compatible format for easy integration</li>
              </ul>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={() => window.open('/exports', '_blank')}
                variant="outline"
                className="flex-1"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Manage APIs
              </Button>
              <Button onClick={() => setIsOpen(false)} className="flex-1">
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
