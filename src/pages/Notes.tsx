
import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, Plus, Tag, Trash2, Loader2, Edit } from 'lucide-react';
import { useNotes } from '@/hooks/useNotes';
import { useToast } from '@/components/ui/use-toast';

const Notes = () => {
  const { notes, isLoading, createNote, deleteNote } = useNotes();
  const { toast } = useToast();
  
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    tags: ''
  });

  const handleCreateNote = async () => {
    if (!newNote.content.trim()) {
      toast({
        title: "Error",
        description: "Note content cannot be empty.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);

    try {
      // Format note content with title and tags
      let content = newNote.content;
      if (newNote.title.trim()) {
        content = `**${newNote.title.trim()}**\n\n${content}`;
      }
      if (newNote.tags.trim()) {
        content += `\n\n*Tags: ${newNote.tags.trim()}*`;
      }

      const result = await createNote(content);
      
      if (result) {
        toast({
          title: "Note created",
          description: "Your note has been saved successfully.",
        });
        
        setNewNote({ title: '', content: '', tags: '' });
        setIsCreating(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create note. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (confirm("Are you sure you want to delete this note? This action cannot be undone.")) {
      try {
        const success = await deleteNote(id);
        if (success) {
          toast({
            title: "Note deleted",
            description: "Note has been removed successfully.",
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete note. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  // Parse note content to extract title and tags
  const parseNoteContent = (content: string) => {
    const lines = content.split('\n');
    let title = '';
    let mainContent = content;
    let tags: string[] = [];

    // Extract title if it starts with **
    if (lines[0]?.startsWith('**') && lines[0]?.endsWith('**')) {
      title = lines[0].slice(2, -2);
      mainContent = lines.slice(2).join('\n');
    }

    // Extract tags
    const tagsMatch = content.match(/\*Tags:\s*(.+)\*/);
    if (tagsMatch) {
      tags = tagsMatch[1].split(',').map(t => t.trim()).filter(Boolean);
      mainContent = mainContent.replace(/\n\n\*Tags:.*\*/, '');
    }

    return { title, mainContent: mainContent.trim(), tags };
  };

  return (
    <Layout>
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border/50 bg-card/30 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-semibold">Notes</h1>
            </div>
          </div>
          
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                New Note
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Note</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Title (optional)</label>
                  <Input
                    placeholder="Note title..."
                    value={newNote.title}
                    onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Content *</label>
                  <Textarea
                    placeholder="Write your note here..."
                    value={newNote.content}
                    onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                    rows={6}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Tags (optional)</label>
                  <Input
                    placeholder="Tags (comma separated)"
                    value={newNote.tags}
                    onChange={(e) => setNewNote(prev => ({ ...prev, tags: e.target.value }))}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={handleCreateNote} className="flex-1" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Note'
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
                  <span>Loading notes...</span>
                </div>
              </div>
            ) : notes.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">No notes yet</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Create your first note to get started
                </p>
                <Dialog open={isCreating} onOpenChange={setIsCreating}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Note
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Create New Note</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Title (optional)</label>
                        <Input
                          placeholder="Note title..."
                          value={newNote.title}
                          onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">Content *</label>
                        <Textarea
                          placeholder="Write your note here..."
                          value={newNote.content}
                          onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                          rows={6}
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">Tags (optional)</label>
                        <Input
                          placeholder="Tags (comma separated)"
                          value={newNote.tags}
                          onChange={(e) => setNewNote(prev => ({ ...prev, tags: e.target.value }))}
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <Button onClick={handleCreateNote} className="flex-1" disabled={isSaving}>
                          {isSaving ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            'Create Note'
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
              notes.map((note) => {
                const parsed = parseNoteContent(note.content);
                return (
                  <Card key={note.id} className="glass-card hover:bg-card/70 transition-colors group">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base">
                          {parsed.title || 'Untitled Note'}
                        </CardTitle>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteNote(note.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      {parsed.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {parsed.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-primary/20 text-primary rounded-md text-xs"
                            >
                              <Tag className="w-3 h-3" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {parsed.mainContent}
                      </p>
                      <div className="text-xs text-muted-foreground mt-4">
                        Created {new Date(note.created_at).toLocaleDateString()}
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

export default Notes;
