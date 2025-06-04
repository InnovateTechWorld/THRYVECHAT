
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
import { Brain, Edit, Trash2, Plus, Loader2 } from 'lucide-react';
import { useMemory } from '@/hooks/useMemory';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

const Memory = () => {
  const { memories, isLoading, createMemory, deleteMemory } = useMemory();
  const { toast } = useToast();
  
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newMemory, setNewMemory] = useState({
    content: '',
    tags: '',
    category: 'fact' as const,
    isPrivate: false
  });

  const getCategoryColor = (category: string) => {
    const colors = {
      project: 'bg-orange-500',
      preference: 'bg-green-500',
      goal: 'bg-blue-500',
      fact: 'bg-purple-500'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-500';
  };

  const handleCreateMemory = async () => {
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
      // Format the memory content with metadata
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
        setIsCreating(false);
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
    if (confirm("Are you sure you want to delete this memory? This action cannot be undone.")) {
      try {
        const success = await deleteMemory(id);
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

  return (
    <Layout>
      <div className="flex-1 flex flex-col bg-background text-foreground"> {/* Added bg-background, text-foreground */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-card"> {/* Changed bg-white to bg-card */}
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-semibold">Memory</h1>
            </div>
          </div>
          
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Add Memory
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add Memory</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">What should I remember? *</label>
                  <Textarea
                    placeholder="What should I remember about you?"
                    value={newMemory.content}
                    onChange={(e) => setNewMemory(prev => ({ ...prev, content: e.target.value }))}
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Tags (optional)</label>
                  <Input
                    placeholder="Tags (comma separated)"
                    value={newMemory.tags}
                    onChange={(e) => setNewMemory(prev => ({ ...prev, tags: e.target.value }))}
                  />
                </div>
                
                <div className="flex items-center gap-4">
                  <div>
                    <label className="text-sm font-medium">Category</label>
                    <select
                      className="mt-1 px-3 py-2 bg-background border border-border rounded-md text-sm w-full"
                      value={newMemory.category}
                      onChange={(e) => setNewMemory(prev => ({ ...prev, category: e.target.value as any }))}
                    >
                      <option value="fact">Facts</option>
                      <option value="preference">Preferences</option>
                      <option value="goal">Goals</option>
                      <option value="project">Projects</option>
                    </select>
                  </div>
                  
                  <label className="flex items-center gap-2 text-sm mt-6">
                    <input
                      type="checkbox"
                      checked={newMemory.isPrivate}
                      onChange={(e) => setNewMemory(prev => ({ ...prev, isPrivate: e.target.checked }))}
                    />
                    Private
                  </label>
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={handleCreateMemory} className="flex-1" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      'Add Memory'
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreating(false)}
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
        
        <ScrollArea className="flex-1 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              <div className="col-span-full flex items-center justify-center py-12">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Loading memories...</span>
                </div>
              </div>
            ) : memories.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Brain className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">No memories yet</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Add your first memory to help AI understand you better
                </p>
                <Dialog open={isCreating} onOpenChange={setIsCreating}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Memory
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Add Memory</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">What should I remember? *</label>
                        <Textarea
                          placeholder="What should I remember about you?"
                          value={newMemory.content}
                          onChange={(e) => setNewMemory(prev => ({ ...prev, content: e.target.value }))}
                          rows={3}
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">Tags (optional)</label>
                        <Input
                          placeholder="Tags (comma separated)"
                          value={newMemory.tags}
                          onChange={(e) => setNewMemory(prev => ({ ...prev, tags: e.target.value }))}
                        />
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div>
                          <label className="text-sm font-medium">Category</label>
                          <select
                            className="mt-1 px-3 py-2 bg-background border border-border rounded-md text-sm w-full"
                            value={newMemory.category}
                            onChange={(e) => setNewMemory(prev => ({ ...prev, category: e.target.value as any }))}
                          >
                            <option value="fact">Facts</option>
                            <option value="preference">Preferences</option>
                            <option value="goal">Goals</option>
                            <option value="project">Projects</option>
                          </select>
                        </div>
                        
                        <label className="flex items-center gap-2 text-sm mt-6">
                          <input
                            type="checkbox"
                            checked={newMemory.isPrivate}
                            onChange={(e) => setNewMemory(prev => ({ ...prev, isPrivate: e.target.checked }))}
                          />
                          Private
                        </label>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button onClick={handleCreateMemory} className="flex-1" disabled={isSaving}>
                          {isSaving ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Adding...
                            </>
                          ) : (
                            'Add Memory'
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setIsCreating(false)}
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
            ) : (
              memories.map((memory) => {
                const parsed = parseMemoryContent(memory.content);
                return (
                  <Card key={memory.id} className="border border-border hover:shadow-md transition-shadow group">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className={cn("w-2 h-2 rounded-full", getCategoryColor(parsed.category))} />
                          <span className="text-xs font-medium text-muted-foreground capitalize">
                            {parsed.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {parsed.isPrivate && (
                            <Badge variant="outline" className="text-xs px-1 py-0">
                              Private
                            </Badge>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleDeleteMemory(memory.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-foreground leading-relaxed mb-3">
                        {parsed.mainContent}
                      </p>
                      
                      {parsed.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
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
      </div>
    </Layout>
  );
};

export default Memory;
