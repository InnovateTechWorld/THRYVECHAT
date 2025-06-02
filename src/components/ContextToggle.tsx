import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Brain, NotebookPen, Settings, Loader2, Save, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useExportedApis } from '@/hooks/useExportedApis';

interface ContextToggleProps {
  apiId: string;
  currentMemories: boolean;
  currentNotes: boolean;
  onUpdate?: (updatedAPI: any) => void;
  memoryCount?: number;
  notesCount?: number;
}

export const ContextToggle = ({
  apiId,
  currentMemories,
  currentNotes,
  onUpdate,
  memoryCount = 0,
  notesCount = 0
}: ContextToggleProps) => {
  const [includeMemories, setIncludeMemories] = useState(currentMemories);
  const [includeNotes, setIncludeNotes] = useState(currentNotes);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const { toast } = useToast();
  const { updateApi } = useExportedApis();

  const hasChanges = includeMemories !== currentMemories || includeNotes !== currentNotes;
  const hasContextEnabled = includeMemories || includeNotes;

  const updateContextSettings = async () => {
    setIsUpdating(true);

    try {
      const success = await updateApi(apiId, {
        include_memories: includeMemories,
        include_notes: includeNotes
      });

      if (success) {
        toast({
          title: "Context settings updated",
          description: "API context settings have been successfully updated.",
        });
        
        // Call parent update callback if provided
        if (onUpdate) {
          onUpdate({
            include_memories: includeMemories,
            include_notes: includeNotes
          });
        }
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      console.error('Failed to update context settings:', error);
      
      // Reset to previous values on error
      setIncludeMemories(currentMemories);
      setIncludeNotes(currentNotes);
      
      toast({
        title: "Update failed",
        description: "Failed to update context settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const resetChanges = () => {
    setIncludeMemories(currentMemories);
    setIncludeNotes(currentNotes);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <CardTitle className="text-sm">Context Settings</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={hasContextEnabled ? "default" : "secondary"} className="text-xs">
              {hasContextEnabled ? "Enhanced" : "Basic"}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0"
            >
              <Settings className="w-3 h-3" />
            </Button>
          </div>
        </div>
        <CardDescription className="text-xs">
          Control what context this API includes in responses
        </CardDescription>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 space-y-4">
          {/* Memory Setting */}
          <div className="flex items-start space-x-3">
            <Checkbox
              id={`include-memories-${apiId}`}
              checked={includeMemories}
              onCheckedChange={(checked) => setIncludeMemories(checked === true)}
              disabled={isUpdating}
            />
            <div className="grid gap-1.5 leading-none flex-1">
              <Label
                htmlFor={`include-memories-${apiId}`}
                className="text-sm font-medium leading-none cursor-pointer"
              >
                Include Memories
              </Label>
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">
                  Include stored memories for better context
                </p>
                <Badge variant="outline" className="text-xs">
                  {memoryCount} items
                </Badge>
              </div>
            </div>
          </div>

          {/* Notes Setting */}
          <div className="flex items-start space-x-3">
            <Checkbox
              id={`include-notes-${apiId}`}
              checked={includeNotes}
              onCheckedChange={(checked) => setIncludeNotes(checked === true)}
              disabled={isUpdating}
            />
            <div className="grid gap-1.5 leading-none flex-1">
              <Label
                htmlFor={`include-notes-${apiId}`}
                className="text-sm font-medium leading-none cursor-pointer"
              >
                Include Notes
              </Label>
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">
                  Include personal notes for context
                </p>
                <Badge variant="outline" className="text-xs">
                  {notesCount} items
                </Badge>
              </div>
            </div>
          </div>

          {/* Token Warning */}
          {hasContextEnabled && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Including context will increase token usage and API response times.
              </AlertDescription>
            </Alert>
          )}

          {/* Current Status */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Current Status:</span>
              <div className="flex items-center gap-2">
                {includeMemories && (
                  <Badge variant="secondary" className="text-xs flex items-center gap-1">
                    <Brain className="w-3 h-3" />
                    Memories
                  </Badge>
                )}
                {includeNotes && (
                  <Badge variant="secondary" className="text-xs flex items-center gap-1">
                    <NotebookPen className="w-3 h-3" />
                    Notes
                  </Badge>
                )}
                {!hasContextEnabled && (
                  <Badge variant="outline" className="text-xs">
                    Basic Context Only
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {hasChanges && (
            <div className="flex gap-2 pt-2 border-t border-border/50">
              <Button
                size="sm"
                onClick={updateContextSettings}
                disabled={isUpdating}
                className="flex-1"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-3 h-3 mr-1" />
                    Save Changes
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={resetChanges}
                disabled={isUpdating}
                className="flex-1"
              >
                Reset
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};