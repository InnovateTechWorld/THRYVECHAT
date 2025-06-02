
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Plus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNotes } from '@/hooks/useNotes';

interface AddToNotesButtonProps {
  content: string;
  messageId: string;
}

export const AddToNotesButton = ({ content, messageId }: AddToNotesButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState(content);
  const [tags, setTags] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { createNote } = useNotes();

  const handleSave = async () => {
    if (!notes.trim()) {
      toast({
        title: "Error",
        description: "Note content cannot be empty.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);

    try {
      // Create a formatted note content with title and tags if provided
      let noteContent = notes;
      if (title.trim()) {
        noteContent = `**${title.trim()}**\n\n${notes}`;
      }
      if (tags.trim()) {
        noteContent += `\n\n*Tags: ${tags.trim()}*`;
      }

      const result = await createNote(noteContent);
      
      if (result) {
        toast({
          title: "Note saved",
          description: "Message has been added to your notes.",
        });
        
        setIsOpen(false);
        setTitle('');
        setNotes(content);
        setTags('');
      } else {
        throw new Error('Failed to create note');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save note. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          size="sm" 
          variant="ghost" 
          className="h-7 px-2 text-xs hover:bg-accent"
        >
          <FileText className="w-3 h-3 mr-1" />
          Add to Notes
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add to Notes</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Title</label>
            <Input
              placeholder="Note title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Content</label>
            <Textarea
              placeholder="Note content..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Tags</label>
            <Input
              placeholder="Tags (comma separated)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleSave} className="flex-1" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Note'
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
              disabled={isSaving}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
