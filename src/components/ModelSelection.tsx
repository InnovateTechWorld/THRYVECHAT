import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Bot, Loader2, Trash2 } from 'lucide-react';
import { useModels, getModelDisplayInfo } from '@/hooks/useModels';
import { useDefaultModel } from '@/hooks/useDefaultModel';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface ModelSelectionProps {
  title?: string;
  description?: string;
  onModelSet?: (modelId: string) => void;
  showRemoveOption?: boolean;
  autoSelectFree?: boolean;
}

export const ModelSelection: React.FC<ModelSelectionProps> = ({
  title = "Select Your Default Model",
  description = "This model will be automatically selected for new conversations and when no specific model is chosen.",
  onModelSet,
  showRemoveOption = false,
  autoSelectFree = false
}) => {
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
  const [hasAutoSelected, setHasAutoSelected] = React.useState(false);

  // EXACT SAME FUNCTION AS SETTINGS PAGE
  const handleSetDefaultModel = async (modelId: string) => {
    console.log('🔍 ModelSelection: Setting default model:', modelId);
    try {
      setDefaultModel(modelId, {
        onSuccess: () => {
          console.log('✅ ModelSelection: Default model set successfully');
          toast({
            title: "Default model updated",
            description: `${models.find(m => m.id === modelId)?.name || modelId} is now your default model.`,
          });
          if (onModelSet) {
            console.log('🔍 ModelSelection: Calling onModelSet callback');
            onModelSet(modelId);
          }
        },
        onError: (error: Error) => {
          console.error('❌ ModelSelection: Failed to set default model:', error);
          toast({
            title: "Error",
            description: error.message || "Failed to set default model. Please try again.",
            variant: "destructive"
          });
        }
      });
    } catch (error) {
      console.error('❌ ModelSelection: Error in handleSetDefaultModel:', error);
      toast({
        title: "Error",
        description: "Failed to set default model. Please try again.",
        variant: "destructive"
      });
    }
  };

  // SIMPLIFIED Auto-select logic - triggers immediately when conditions are met
  React.useEffect(() => {
    console.log('🔍 ModelSelection useEffect:', {
      autoSelectFree,
      hasAutoSelected,
      modelsLength: models.length,
      defaultModel,
      modelsLoading
    });

    if (autoSelectFree && !hasAutoSelected && models.length > 0 && !modelsLoading) {
      console.log('🤖 ModelSelection: Starting auto-selection...');
      setHasAutoSelected(true);
      
      // Try to find mistralai/devstral-small:free first
      let modelToSelect = models.find(model => model.id === 'mistralai/devstral-small:free');
      
      // If not found, try to find any free model
      if (!modelToSelect) {
        modelToSelect = models.find(model => {
          const info = getModelDisplayInfo(model.id);
          return info.isFree || parseFloat(model.pricing?.prompt || '0') === 0;
        });
      }
      
      // If still not found, use first available model
      if (!modelToSelect && models[0]) {
        modelToSelect = models[0];
      }
      
      if (modelToSelect) {
        console.log('🤖 ModelSelection: Auto-selecting model:', modelToSelect.id);
        // Use setTimeout to ensure the component is fully rendered
        setTimeout(() => {
          handleSetDefaultModel(modelToSelect.id);
        }, 100);
      } else {
        console.error('❌ ModelSelection: No models available for auto-selection');
      }
    }
  }, [autoSelectFree, hasAutoSelected, models, modelsLoading]);

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

  const currentDefaultModel = models.find(m => m.id === defaultModel);

  if (modelsLoading || defaultModelLoading) {
    return (
      <Card className="border border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-4 h-4" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 p-3 border rounded-md">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Loading models...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (models.length === 0) {
    return (
      <Card className="border border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-4 h-4" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 border rounded-md text-center">
            <span className="text-sm text-muted-foreground">No models available. Please contact support.</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-4 h-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">Preferred Model</label>
          <p className="text-xs text-muted-foreground mb-3">
            {description}
          </p>
          
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
          
          {showRemoveOption && defaultModel && (
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

        {autoSelectFree && hasAutoSelected && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md">
            <div className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Auto-Selection Active
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-300">
              A free model has been automatically selected for you. You can change it anytime.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};