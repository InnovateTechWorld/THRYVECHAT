import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Send, Bot, User, Edit2, Loader2, Check, ChevronsUpDown, Copy, RefreshCw, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AddToNotesButton } from '@/components/AddToNotesButton';
import { ExportAsApiButton } from '@/components/ExportAsApiButton';
import { FormattedMessage } from '@/components/FormattedMessage';
import { useChat, useChatSessions } from '@/hooks/useChat';
import { useModels, getModelDisplayInfo } from '@/hooks/useModels';
import { useDefaultModel } from '@/hooks/useDefaultModel';
import { useMemory } from '@/hooks/useMemory';
import { useToast } from '@/components/ui/use-toast';
import { formatMessage } from '@/lib/formatting';

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

  // Use our cached hooks
  const { 
    messages, 
    isLoading, 
    isStreaming, 
    error, 
    sendMessage, 
    retryMessage,
    getEffectiveDefaultModel 
  } = useChat(sessionId);
  
  const { models, isLoading: modelsLoading } = useModels();
  const { defaultModel } = useDefaultModel();
  const { loadMemories } = useMemory();
  const { sessions, updateSessionTitle } = useChatSessions();

  // Set default model when models load or default model changes
  useEffect(() => {
    if (models.length > 0 && !selectedModel) {
      const effectiveDefault = getEffectiveDefaultModel();
      setSelectedModel(effectiveDefault);
    }
  }, [models, selectedModel, getEffectiveDefaultModel]);

  // Update selected model when default model changes
  useEffect(() => {
    if (defaultModel && models.find(m => m.id === defaultModel)) {
      setSelectedModel(defaultModel);
    }
  }, [defaultModel, models]);

  // Update session title from sessions cache
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

  // Refresh memories after assistant responds
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      
      if (lastMessage.role === 'assistant' && 
          lastMessage.id !== lastMessageId && 
          !isLoading && 
          !isStreaming &&
          !lastMessage.error) {
        
        setLastMessageId(lastMessage.id);
        
        // Refresh memories after assistant responds
        setTimeout(() => {
          loadMemories().catch(console.error);
        }, 1500);
      }
    }
  }, [messages, isLoading, isStreaming, lastMessageId, loadMemories]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const messageContent = input.trim();
    const modelToUse = selectedModel || getEffectiveDefaultModel();
    setInput('');

    try {
      sendMessage(messageContent, modelToUse);
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
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy message to clipboard",
        variant: "destructive"
      });
    }
  };

  const handleRetryMessage = (messageId: string) => {
    retryMessage(messageId);
  };

  // Get selected model display info
  const getSelectedModelInfo = () => {
    const model = models.find(m => m.id === selectedModel);
    return model ? model : null;
  };

  const handleTitleSave = async () => {
    setIsEditingTitle(false);
    
    if (sessionId && sessionId !== 'default') {
      try {
        updateSessionTitle({ sessionId, name: sessionTitle });
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
    }
  };

  // Enhanced loading indicator component
  const TypingIndicator = () => (
    <div className="flex gap-3 chat-bubble animate-in slide-in-from-bottom-2 duration-300">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center flex-shrink-0 mt-1">
        <Bot className="w-4 h-4 text-primary" />
      </div>
      <div className="bg-card border border-border/50 rounded-2xl px-4 py-3 max-w-[85%] sm:max-w-[75%] md:max-w-[70%] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"></div>
          </div>
          <span className="text-sm text-muted-foreground">
            {isStreaming ? 'AI is typing...' : 'AI is thinking...'}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full dvh-full">
      {/* Enhanced Header */}
      <div className="border-b border-border/50 p-3 md:p-4 bg-card/30 backdrop-blur-md flex-shrink-0 safe-top">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              {isEditingTitle ? (
                <Input
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  onBlur={handleTitleSave}
                  onKeyDown={handleTitleKeyPress}
                  className="h-8 text-base font-semibold border-none p-0 focus-visible:ring-0 min-w-0 bg-transparent"
                  autoFocus
                />
              ) : (
                <div className="flex items-center gap-2 min-w-0">
                  <h1 className="font-semibold cursor-pointer truncate text-sm md:text-base hover:text-primary transition-colors" onClick={() => setIsEditingTitle(true)}>
                    {sessionTitle}
                  </h1>
                  <Edit2
                    className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-primary flex-shrink-0 transition-colors"
                    onClick={() => setIsEditingTitle(true)}
                  />
                </div>
              )}
            </div>
            <Badge variant="outline" className="text-xs flex-shrink-0 hidden sm:flex">
              Context Active
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 md:gap-3">
            <div className="hidden lg:block">
              <ExportAsApiButton sessionId={sessionId} messages={messages} type="session" />
            </div>
            
            {/* Enhanced Model Selector - Clean Version */}
            <Popover open={isModelSelectOpen} onOpenChange={setIsModelSelectOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={isModelSelectOpen}
                  className="w-28 sm:w-32 md:w-48 justify-between text-xs md:text-sm h-8 md:h-9"
                  disabled={modelsLoading}
                >
                  {selectedModel ? (
                    <div className="flex items-center gap-2 truncate">
                      <div className={cn("w-2 h-2 rounded-full", getModelDisplayInfo(selectedModel).color)} />
                      <span className="truncate">
                        {getSelectedModelInfo()?.name || getModelDisplayInfo(selectedModel).modelName}
                      </span>
                      {getModelDisplayInfo(selectedModel).isFree && (
                        <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 hidden md:flex">FREE</Badge>
                      )}
                      {selectedModel === defaultModel && (
                        <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 hidden lg:flex">DEFAULT</Badge>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">
                      {modelsLoading ? "Loading..." : "Select model"}
                    </span>
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 md:w-80 p-0" align="end">
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
                              <div className="min-w-0 flex-1">
                                <div className="font-medium truncate flex items-center gap-2">
                                  {model.name}
                                  {displayInfo.isFree && (
                                    <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">FREE</Badge>
                                  )}
                                  {model.id === defaultModel && (
                                    <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">DEFAULT</Badge>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {model.id}
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

      {/* Enhanced Messages */}
      <ScrollArea className="flex-1 overflow-y-auto scrollbar-hidden">
        <div className="p-3 md:p-4 space-y-4 max-w-4xl mx-auto pb-4">
          {messages.map((message) => {
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
                  "flex gap-3 chat-bubble group animate-in slide-in-from-bottom-2 duration-300",
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}
                
                <div
                  className={cn(
                    "max-w-[85%] sm:max-w-[75%] md:max-w-[70%] rounded-2xl px-4 py-3 relative shadow-sm",
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground ml-8 md:ml-12'
                      : message.error
                      ? 'bg-destructive/10 border border-destructive/20'
                      : 'bg-card border border-border/50',
                    message.isStreaming && 'animate-pulse'
                  )}
                >
                  {message.role === 'assistant' && message.model_id && (
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/30">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        getModelDisplayInfo(message.model_id).color
                      )} />
                      <span className="text-xs text-muted-foreground truncate">
                        {models.find(m => m.id === message.model_id)?.name || getModelDisplayInfo(message.model_id).modelName}
                      </span>
                      {getModelDisplayInfo(message.model_id).isFree && (
                        <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">FREE</Badge>
                      )}
                      {message.model_id === defaultModel && (
                        <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">DEFAULT</Badge>
                      )}
                    </div>
                  )}
                  
                  {message.error && (
                    <div className="flex items-center gap-2 mb-2 text-destructive">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-xs">Failed to send message</span>
                    </div>
                  )}
                  
                  <FormattedMessage
                    message={formattedMessage}
                    showTimestamp={false}
                    showRole={false}
                    className="formatted-message-content text-sm md:text-base break-words"
                  />
                  
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/30">
                    <div className="text-xs text-muted-foreground">
                      {new Date(message.created_at).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                    
                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-1">
                        {message.error ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRetryMessage(message.id)}
                            className="h-7 w-7 p-0 hover:bg-primary/10 border border-transparent hover:border-primary/20 rounded-md"
                            title="Retry message"
                          >
                            <RefreshCw className="h-3.5 w-3.5 text-primary" />
                          </Button>
                        ) : (
                          <>
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
                    )}
                  </div>
                </div>

                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary/60 to-secondary/80 flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-4 h-4 text-secondary-foreground" />
                  </div>
                )}
              </div>
            );
          })}
          
          {(isLoading || isStreaming) && <TypingIndicator />}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Enhanced Input Area */}
      <div className="border-t border-border/50 p-3 md:p-4 bg-card/30 backdrop-blur-md flex-shrink-0 safe-bottom">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message AI..."
                className="min-h-[44px] max-h-[200px] pr-12 py-3 bg-background/80 backdrop-blur-sm border-border/50 focus:border-primary/50 resize-none rounded-2xl transition-all duration-200 text-sm md:text-base overflow-hidden touch-manipulation shadow-sm"
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
                className="absolute right-2 bottom-2 h-8 w-8 p-0 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 bg-primary hover:bg-primary/90"
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
                  {getModelDisplayInfo(selectedModel).isFree && (
                    <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3 ml-1">FREE</Badge>
                  )}
                  {selectedModel === defaultModel && (
                    <Badge variant="outline" className="text-[8px] px-1 py-0 h-3 ml-1">DEFAULT</Badge>
                  )}
                </span>
              ) : (
                'Select a model to start chatting'
              )}
            </span>
            <span className="hidden md:inline text-[10px] md:text-xs opacity-70">
              {input.trim() ? 'Enter to send • Shift+Enter for new line' : 'Press Enter to send'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
