import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Send, Bot, User, Zap, Edit2, Loader2, Search, Check, ChevronsUpDown, Copy  } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AddToNotesButton } from '@/components/AddToNotesButton';
import { ExportAsApiButton } from '@/components/ExportAsApiButton';
import { FormattedMessage } from '@/components/FormattedMessage';
import { useChat, Message } from '@/hooks/useChat';
import { useModels, getModelDisplayInfo } from '@/hooks/useModels';
import { useMemory } from '@/hooks/useMemory';
import { useToast } from '@/components/ui/use-toast';
import { formatMessage, generateMessageId } from '@/lib/formatting';
import { useChatSessions } from '@/hooks/useChat'; // Add this import



interface ChatInterfaceProps {
  sessionId?: string;
}

export const ChatInterface = ({ sessionId = 'default' }: ChatInterfaceProps) => {
  const [sessionTitle, setSessionTitle] = useState('New Chat Session');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [isModelSelectOpen, setIsModelSelectOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [lastMessageId, setLastMessageId] = useState<string | null>(null);
    const [isInterfaceReady, setIsInterfaceReady] = useState(false);






  // Use our custom hooks
  const { messages, isLoading, error, sendMessage } = useChat(sessionId);
  const { models, isLoading: modelsLoading } = useModels();
  const { loadMemories, isLoading: memoriesLoading } = useMemory(); // Add isLoading from memory hook
  const { sessions, updateSessionTitle } = useChatSessions(); // Add this


  // Set default model when models load
  useEffect(() => {
    if (models.length > 0 && !selectedModel) {
      setSelectedModel(models[0].id);
    }
  }, [models, selectedModel]);
  

  useEffect(() => {
    if (sessionId && sessions.length > 0) {
      const currentSession = sessions.find(session => session.id === sessionId);
      if (currentSession && currentSession.name) {
        setSessionTitle(currentSession.name);
      }
    }
  }, [sessionId, sessions]);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Show error toast when there's an error
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive"
      });
    }
  }, [error, toast]);

  useEffect(() => {
  if (messages.length > 0) {
    const lastMessage = messages[messages.length - 1];
    
    // Check if this is a new assistant message we haven't seen before
    if (lastMessage.role === 'assistant' && 
        lastMessage.id !== lastMessageId && 
        !isLoading) {
      
      console.log('New assistant message detected:', lastMessage.id);
      setLastMessageId(lastMessage.id);
      
      // Refresh memories after assistant responds
      setTimeout(() => {
        console.log('Refreshing memories...');
        loadMemories().catch(console.error);
      }, 1500);
    }
  }
}, [messages, isLoading, lastMessageId]);


  const handleSend = async () => {
    if (!input.trim() || !selectedModel || isLoading) return;

    const messageContent = input;
    setInput('');

    try {
      await sendMessage(messageContent, selectedModel);
      // Silently refresh memory after sending message
      // setTimeout(() => {
      //   loadMemories();
      // }, 1000); // Small delay to allow backend processing
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopyMessage = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      toast({
        title: "Message copied",
        description: "Message content copied to clipboard",
      });
      // Reset copy state after 2 seconds
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy message to clipboard",
        variant: "destructive"
      });
    }
  };


  // Get selected model display info
  const getSelectedModelInfo = () => {
    const model = models.find(m => m.id === selectedModel);
    return model ? model : null;
  };

  const handleTitleSave = async () => {
    setIsEditingTitle(false);
    
    // Update the session title in the backend
    if (sessionId && sessionId !== 'default') {
      try {
        await updateSessionTitle(sessionId, sessionTitle);
        console.log('Session title updated:', sessionTitle);
      } catch (error) {
        console.error('Failed to update session title:', error);
        toast({
          title: "Error",
          description: "Failed to update session title",
          variant: "destructive"
        });
      }
    }
  };

  const handleTitleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    }
    if (e.key === 'Escape') {
      setIsEditingTitle(false);
    };

    

  };

  return (
    <div className="flex flex-col h-full dvh-full">
      {/* Header */}
      <div className="border-b border-border/50 p-2 md:p-4 bg-card/50 backdrop-blur-sm flex-shrink-0 safe-top">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="flex items-center gap-2 min-w-0">
              <Bot className="w-5 h-5 text-primary flex-shrink-0" />
              {isEditingTitle ? (
                <Input
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  onBlur={handleTitleSave}
                  onKeyPress={handleTitleKeyPress}
                  className="h-8 text-base font-semibold border-none p-0 focus-visible:ring-0 min-w-0"
                  autoFocus
                />
              ) : (
                <div className="flex items-center gap-2 min-w-0">
                  <h1 className="font-semibold cursor-pointer truncate" onClick={() => setIsEditingTitle(true)}>
                    {sessionTitle}
                  </h1>
                  <Edit2
                    className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-primary flex-shrink-0"
                    onClick={() => setIsEditingTitle(true)}
                  />
                </div>
              )}
            </div>
            <Badge variant="outline" className="text-xs flex-shrink-0">
              Context Active
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 md:gap-3">
            <div className="hidden md:block">
              <ExportAsApiButton sessionId={sessionId} messages={messages} type="session" />
            </div>
            
            {/* Model Selector with Search */}
            <Popover open={isModelSelectOpen} onOpenChange={setIsModelSelectOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={isModelSelectOpen}
                  className="w-32 md:w-48 justify-between"
                  disabled={modelsLoading}
                >
                  {selectedModel ? (
                    <div className="flex items-center gap-2 truncate">
                      <div className={cn("w-2 h-2 rounded-full", getModelDisplayInfo(selectedModel).color)} />
                      <span className="truncate">
                        {getSelectedModelInfo()?.name || getModelDisplayInfo(selectedModel).modelName}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">
                      {modelsLoading ? "Loading..." : "Select model"}
                    </span>
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 md:w-80 p-0">
                <Command>
                  <CommandInput placeholder="Search models..." />
                  <CommandEmpty>No models found.</CommandEmpty>
                  <CommandList>
                    <CommandGroup>
                      {models.map((model) => {
                        const displayInfo = getModelDisplayInfo(model.id);
                        return (
                          <CommandItem
                            key={model.id}
                            onSelect={() => {
                              setSelectedModel(model.id);
                              setIsModelSelectOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedModel === model.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <div className={cn("w-2 h-2 rounded-full", displayInfo.color)} />
                              <div className="min-w-0">
                                <div className="font-medium truncate">{model.name}</div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {model.description}
                                </div>
                              </div>
                            </div>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-2 md:p-4 overflow-y-auto scrollbar-hidden">
        <div className="space-y-4 max-w-4xl mx-auto">
          {messages.map((message) => {
            // Convert to formatted message
            const formattedMessage = formatMessage(
              message.id,
              message.content,
              message.role as 'user' | 'assistant' | 'system',
              new Date(message.created_at)
            );

            return (
              <div
                key={message.id}
                className={cn(
                  "flex gap-2 md:gap-3 chat-bubble group",
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-3 h-3 md:w-4 md:h-4 text-primary" />
                  </div>
                )}
                
                <div
                  className={cn(
                    "max-w-[85%] sm:max-w-[75%] md:max-w-[70%] rounded-lg px-3 md:px-4 py-2 md:py-3 overflow-hidden", /* Added overflow-hidden */
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground ml-8 md:ml-12'
                      : 'bg-card border border-border/50'
                  )}
                >
                  {message.role === 'assistant' && message.model_id && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        getModelDisplayInfo(message.model_id).color
                      )} />
                      <span className="text-xs text-muted-foreground truncate">
                        {models.find(m => m.id === message.model_id)?.name || getModelDisplayInfo(message.model_id).modelName}
                      </span>
                    </div>
                  )}
                  
                  {/* Use FormattedMessage component for better formatting */}
                  <FormattedMessage
                    message={formattedMessage}
                    showTimestamp={false}
                    showRole={false}
                    className="formatted-message-content text-sm md:text-base break-words" /* Added break-words */
                  />
                  
                  <div className="flex items-center justify-between mt-2 md:mt-3">
                    <div className="text-xs text-muted-foreground">
                      {new Date(message.created_at).toLocaleTimeString()}
                    </div>
                    
                   {message.role === 'assistant' && (
  <>
    {/* Copy button */}
    <Button
      size="sm"
      variant="ghost"
      onClick={() => handleCopyMessage(message.content, message.id)}
      className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-muted border border-transparent hover:border-border rounded-md"
      title="Copy message"
    >
      {copiedMessageId === message.id ? (
        <Check className="h-3.5 w-3.5 text-green-600" />
      ) : (
        <Copy className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
      )}
    </Button>
    
    <AddToNotesButton
      content={message.content}
      messageId={message.id}
    />
  </>

                    )}
                  </div>
                </div>

                {message.role === 'user' && (
                  <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-3 h-3 md:w-4 md:h-4" />
                  </div>
                )}
              </div>
            );
          })}
          
          {isLoading && (
            <div className="flex gap-2 md:gap-3 chat-bubble">
              <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="w-3 h-3 md:w-4 md:h-4 text-primary" />
              </div>
              <div className="bg-card border border-border/50 rounded-lg px-3 md:px-4 py-2 md:py-3 max-w-[85%] sm:max-w-[75%] md:max-w-[70%]">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-xs md:text-sm text-muted-foreground">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Dynamic Input */}
      <div className="border-t border-border/50 p-2 md:p-4 bg-card/50 backdrop-blur-sm flex-shrink-0 safe-bottom mobile-input-container">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2 md:gap-3 items-end">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message AI..."
                className="min-h-[44px] max-h-[200px] pr-12 py-2 md:py-3 bg-background border-border/50 focus:border-primary/50 resize-none rounded-xl transition-all duration-200 text-sm md:text-base overflow-hidden touch-manipulation" /* Added touch-manipulation */
                disabled={isLoading}
                rows={1}
                style={{
                  height: 'auto',
                  lineHeight: '1.5'
                }}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading || !selectedModel}
                size="sm"
                className="absolute right-2 bottom-2 h-8 w-8 p-0 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-2 px-1">
            <span className="truncate flex-1 mr-2">
              {selectedModel ? (
                <span className="flex items-center gap-1">
                  <div className={cn("w-2 h-2 rounded-full", getModelDisplayInfo(selectedModel).color)} />
                  {getSelectedModelInfo()?.name || getModelDisplayInfo(selectedModel).modelName}
                </span>
              ) : (
                'Select a model to start chatting'
              )}
            </span>
            <span className="hidden md:inline text-[10px] md:text-xs">
              {input.trim() ? 'Enter to send • Shift+Enter for new line' : 'Press Enter to send'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
