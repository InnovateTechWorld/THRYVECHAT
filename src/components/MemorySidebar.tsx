
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Brain, Plus, Edit, Trash2, Tag, Loader2, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMemory } from '@/hooks/useMemory';
import { useToast } from '@/hooks/use-toast';

const MEMORY_CATEGORIES = [
  { id: 'goal', label: 'Goals', color: 'bg-blue-500' },
  { id: 'preference', label: 'Preferences', color: 'bg-green-500' },
  { id: 'fact', label: 'Facts', color: 'bg-purple-500' },
  { id: 'project', label: 'Projects', color: 'bg-orange-500' },
];

export const MemorySidebar = () => {
  const { memories, isLoading, createMemory, deleteMemory: deleteMemoryAPI } = useMemory();
  const { toast } = useToast();


  const [isAddingMemory, setIsAddingMemory] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [newMemory, setNewMemory] = useState({
    content: '',
    tags: '',
    category: 'fact' as const,
    isPrivate: false
  });


  // Auto-refresh memory silently (this will be called from ChatInterface)
  useEffect(() => {
    // This effect will be triggered when the memories array changes
    // providing a smooth experience without visible loading states
  }, [memories]);

  const addMemory = async () => {
    if (!newMemory.content.trim()) {
      toast({
        title: "Error",
        description: "Memory content cannot be empty.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);

    try {
      // Format the memory content with metadata for better API storage
      let content = newMemory.content;
      if (newMemory.tags.trim()) {
        content += `\n\nTags: ${newMemory.tags}`;
      }
      content += `\n\nCategory: ${newMemory.category}`;
      if (newMemory.isPrivate) {
        content += '\n\nPrivacy: Private';
      }

      const result = await createMemory(content);
      
      if (result) {
        toast({
          title: "Memory added",
          description: "Memory has been saved to your context.",
        });
        
        setNewMemory({ content: '', tags: '', category: 'fact', isPrivate: false });
        setIsAddingMemory(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save memory. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    try {
      const success = await deleteMemoryAPI(id);
      if (success) {
        toast({
          title: "Memory deleted",
          description: "Memory has been removed from your context.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete memory. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Parse memory content to extract tags and category (basic parsing)
  const parseMemoryContent = (content: string) => {
    const lines = content.split('\n');
    const mainContent = lines[0];
    
    let tags: string[] = [];
    let category = 'fact';
    let isPrivate = false;

    // Extract metadata from content
    const tagsMatch = content.match(/Tags:\s*(.+)/);
    if (tagsMatch) {
      tags = tagsMatch[1].split(',').map(t => t.trim()).filter(Boolean);
    }

    const categoryMatch = content.match(/Category:\s*(\w+)/);
    if (categoryMatch) {
      category = categoryMatch[1];
    }

    if (content.includes('Privacy: Private')) {
      isPrivate = true;
    }

    return { mainContent, tags, category, isPrivate };
  };

  const getCategoryInfo = (category: string) => {
    return MEMORY_CATEGORIES.find(c => c.id === category) || MEMORY_CATEGORIES[0];
  };

  return (
    <div className="w-full h-full bg-card/50 border-l border-border/50 flex flex-col overflow-hidden"> {/* Added overflow-hidden */}
      {/* Header with collapse toggle */}
      <div className="p-3 md:p-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 h-auto"
            >
              <ChevronDown className={cn("w-4 h-4 transition-transform", !isExpanded && "-rotate-90")} />
            </Button>
            <Brain className="w-5 h-5 text-primary flex-shrink-0" />
            <h2 className="font-semibold truncate">Memory</h2>
          </div>
          
          <Dialog open={isAddingMemory} onOpenChange={setIsAddingMemory}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="flex-shrink-0">
                <Plus className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Memory</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Textarea
                  placeholder="What should I remember about you?"
                  value={newMemory.content}
                  onChange={(e) => setNewMemory(prev => ({ ...prev, content: e.target.value }))}
                  rows={3}
                  className="resize-none"
                />
                
                <Input
                  placeholder="Tags (comma separated)"
                  value={newMemory.tags}
                  onChange={(e) => setNewMemory(prev => ({ ...prev, tags: e.target.value }))}
                />
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <select
                    className="px-3 py-2 bg-background border border-border rounded-md text-sm flex-1"
                    value={newMemory.category}
                    onChange={(e) => setNewMemory(prev => ({ ...prev, category: e.target.value as any }))}
                  >
                    {MEMORY_CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                  
                  <label className="flex items-center gap-2 text-sm whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={newMemory.isPrivate}
                      onChange={(e) => setNewMemory(prev => ({ ...prev, isPrivate: e.target.checked }))}
                      className="rounded"
                    />
                    Private
                  </label>
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={addMemory} className="flex-1" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Add Memory'
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsAddingMemory(false)}
                    className="flex-1"
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        <p className="text-xs text-muted-foreground mt-2">
          {isLoading ? 'Loading...' : `${memories.length} memories • Context active`}
        </p>
      </div>

      {/* Collapsible Content */}
      <div className={cn(
        "flex-1 overflow-hidden transition-all duration-300 ease-in-out",
        isExpanded ? "opacity-100 h-auto" : "opacity-0 h-0" /* Changed h-0 to h-auto when expanded */
      )}>
        {isExpanded && (
          <ScrollArea className="h-full p-3 md:p-4">
            <div className="space-y-3">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : memories.length === 0 ? (
                <div className="text-center py-8">
                  <Brain className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No memories yet</p>
                  <p className="text-xs text-muted-foreground">Add your first memory to get started</p>
                </div>
              ) : (
                memories.map((memory) => {
                  const parsed = parseMemoryContent(memory.content);
                  const categoryInfo = getCategoryInfo(parsed.category);
                  
                  return (
                    <Card key={memory.id} className="glass-card hover:bg-card/70 transition-all duration-200 border-border/30">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={cn("w-2 h-2 rounded-full flex-shrink-0", categoryInfo.color)} />
                            <span className="text-xs font-medium text-muted-foreground truncate">
                              {categoryInfo.label}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {parsed.isPrivate && (
                              <Badge variant="outline" className="text-xs px-1 py-0">
                                Private
                              </Badge>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteMemory(memory.id)}
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <p className="text-sm text-foreground leading-relaxed mb-2 break-words">
                          {parsed.mainContent}
                        </p>
                        
                        {parsed.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {parsed.tags.map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs px-2 py-0">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        <div className="text-xs text-muted-foreground">
                          {new Date(memory.created_at).toLocaleDateString()}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </ScrollArea>
        )}
      </div>
      
      {/* Footer - only show when expanded */}
      {isExpanded && (
        <div className="p-3 md:p-4 border-t border-border/50 flex-shrink-0">
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>Memory Usage:</span>
              <span>{memories.length}/100</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-1">
              <div
                className="bg-primary h-1 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((memories.length / 100) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
  
};
