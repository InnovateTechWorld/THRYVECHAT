
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Copy, Loader2, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuickExport } from '@/hooks/useExportedApis';
import { useModels } from '@/hooks/useModels';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ExportResult {
  apiKey: string;
  apiUrl: string;
  id: string;
  type: 'context';
}

export const ExportModal = ({ isOpen, onClose }: ExportModalProps) => {
  const [apiName, setApiName] = useState('');
  const [apiDescription, setApiDescription] = useState('');
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);
  const { toast } = useToast();
  const { createContextAPI } = useQuickExport();
  const { models } = useModels();

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

    setIsExporting(true);

    try {
      const result = await createContextAPI(
        selectedModels,
        false, // includeMemories - can be true if you want default memory inclusion
        false, // includeNotes - can be true if you want default notes inclusion
        apiName.trim(), // Pass the name
        apiDescription.trim() || undefined // Pass description if provided
      );

      if (result) {
        setExportResult(result);
        
        // Copy API key to clipboard
        navigator.clipboard.writeText(result.apiKey);
        
        toast({
          title: "Profile exported successfully!",
          description: "API key has been copied to your clipboard. Save it securely!",
        });
      } else {
        throw new Error('No result returned from API creation');
      }
    } catch (error) {
      console.error('Export modal error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      toast({
        title: "Export failed",
        description: `Failed to export profile API: ${errorMessage}`,
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const toggleModel = (modelId: string) => {
    setSelectedModels(prev =>
      prev.includes(modelId)
        ? prev.filter(id => id !== modelId)
        : [...prev, modelId]
    );
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
    setApiDescription('');
    setSelectedModels([]);
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
        "content": "Help me with my React project using my preferences"
      }
    ],
    "stream": false
  }'`;
  };

  const handleClose = () => {
    onClose();
    // Reset after a delay to allow modal animation
    setTimeout(resetModal, 300);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Export Profile as API</DialogTitle>
        </DialogHeader>
        
        {!exportResult ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">API Name *</label>
              <Input
                placeholder="My Profile API"
                value={apiName}
                onChange={(e) => setApiName(e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Description (Optional)</label>
              <Input
                placeholder="Describe what this API does..."
                value={apiDescription}
                onChange={(e) => setApiDescription(e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Select Models *</label>
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
                    {model.pricing && (
                      <div className="text-xs text-muted-foreground">
                        ${model.pricing.prompt}/${model.pricing.completion} per 1K tokens
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <p className="text-sm font-medium mb-2">Your Context API will include:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• All your personal memories and preferences</li>
                <li>• Your custom notes and knowledge base</li>
                <li>• Your personalized system prompt</li>
                <li>• Selected AI model configurations</li>
                <li>• Rate limiting and usage tracking</li>
              </ul>
            </div>
            
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
                  'Export Profile API'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleClose}
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
              <span className="font-medium">Profile API exported successfully!</span>
            </div>
            
            <div className="p-4 border border-green-200 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <ExternalLink className="w-4 h-4" />
                <span className="font-medium">Your Context API is ready!</span>
              </div>
              <p className="text-sm text-muted-foreground">
                This API provides access to your personalized AI assistant with all your context and preferences.
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
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Integration Notes:</p>
              <ul className="text-sm text-yellow-700 dark:text-yellow-300 mt-1 space-y-1">
                <li>• This API automatically includes your personal context in all conversations</li>
                <li>• Use model "base" for your default model, or specify any allowed model</li>
                <li>• The API follows OpenAI-compatible format for easy integration</li>
                <li>• All requests are rate-limited and tracked for usage analytics</li>
                <li>• For third-party integrations: if it doesn't work, remove "/chat/completions" from the URL as some tools add it automatically</li>
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
              <Button onClick={handleClose} className="flex-1">
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
