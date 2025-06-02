import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Brain, NotebookPen, AlertTriangle, Info } from 'lucide-react';

interface ContextSettingsProps {
  includeMemories: boolean;
  includeNotes: boolean;
  onMemoriesChange: (include: boolean) => void;
  onNotesChange: (include: boolean) => void;
  memoryCount?: number;
  notesCount?: number;
  showTokenWarning?: boolean;
}

export const ContextSettings = ({
  includeMemories,
  includeNotes,
  onMemoriesChange,
  onNotesChange,
  memoryCount = 0,
  notesCount = 0,
  showTokenWarning = true
}: ContextSettingsProps) => {
  const [estimatedTokens, setEstimatedTokens] = useState(0);

  useEffect(() => {
    // Rough estimation: memories ~100 tokens each, notes ~50 tokens each
    let tokens = 0;
    if (includeMemories) tokens += memoryCount * 100;
    if (includeNotes) tokens += notesCount * 50;
    setEstimatedTokens(tokens);
  }, [includeMemories, includeNotes, memoryCount, notesCount]);

  const hasContextEnabled = includeMemories || includeNotes;

  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-4 bg-muted/30">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-4 h-4 text-primary" />
          <Label className="text-sm font-medium">Context Options</Label>
          <Badge variant="outline" className="text-xs">
            Privacy Controls
          </Badge>
        </div>
        
        <div className="space-y-4">
          {/* Memory Setting */}
          <div className="flex items-start space-x-3">
            <Checkbox
              id="include-memories"
              checked={includeMemories}
              onCheckedChange={(checked) => onMemoriesChange(checked === true)}
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="include-memories"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Include Memories
              </Label>
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">
                  Include your stored memories for better context awareness
                </p>
                <Badge variant="secondary" className="text-xs">
                  {memoryCount} items
                </Badge>
              </div>
            </div>
          </div>

          {/* Notes Setting */}
          <div className="flex items-start space-x-3">
            <Checkbox
              id="include-notes"
              checked={includeNotes}
              onCheckedChange={(checked) => onNotesChange(checked === true)}
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="include-notes"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Include Notes
              </Label>
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">
                  Include your personal notes for additional context
                </p>
                <Badge variant="secondary" className="text-xs">
                  {notesCount} items
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Context Status */}
        <div className="mt-4 pt-3 border-t border-border/50">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Context Status:
            </span>
            <span className={`font-medium ${hasContextEnabled ? 'text-green-600' : 'text-muted-foreground'}`}>
              {hasContextEnabled ? 'Enhanced' : 'Basic'}
            </span>
          </div>
        </div>
      </div>

      {/* Privacy Notice */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="text-xs">
          <strong>Privacy by Default:</strong> Context inclusion is optional and disabled by default. 
          Only enable if you want the API to have access to your personal memories and notes.
        </AlertDescription>
      </Alert>

      {/* Token Usage Warning */}
      {showTokenWarning && hasContextEnabled && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>Token Usage Impact:</strong> Including context will increase token consumption.
            Estimated additional tokens: ~{estimatedTokens.toLocaleString()} per request.
          </AlertDescription>
        </Alert>
      )}

      {/* Context Preview */}
      {hasContextEnabled && (
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium">Your API will include:</p>
          <ul className="space-y-1 ml-4">
            {includeMemories && (
              <li className="flex items-center gap-2">
                <Brain className="w-3 h-3" />
                {memoryCount} memories for contextual understanding
              </li>
            )}
            {includeNotes && (
              <li className="flex items-center gap-2">
                <NotebookPen className="w-3 h-3" />
                {notesCount} notes for personalized responses
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};