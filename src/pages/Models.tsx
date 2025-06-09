import React, { useState, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Zap, DollarSign, FileText, Search } from 'lucide-react';
import { useModels, getModelDisplayInfo } from '@/hooks/useModels';
import { cn } from '@/lib/utils';

const Models = () => {
  const { models, isLoading, error } = useModels();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter models based on search query
  const filteredModels = useMemo(() => {
    if (!searchQuery.trim()) return models;
    
    const query = searchQuery.toLowerCase();
    return models.filter(model =>
      model.name.toLowerCase().includes(query) ||
      model.description.toLowerCase().includes(query) ||
      getModelDisplayInfo(model.id).provider.toLowerCase().includes(query) ||
      getModelDisplayInfo(model.id).modelName.toLowerCase().includes(query)
    );
  }, [models, searchQuery]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Loading AI models...</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-destructive">Error Loading Models</h2>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex h-screen">
        <div className="flex-1 flex flex-col">
          <div className="flex flex-col md:flex-row md:items-center gap-4 p-3 md:p-4 border-b border-border/50 bg-card/30 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <div>
                <h1 className="text-lg font-semibold gradient-text">AI Models</h1>
                <p className="text-sm text-muted-foreground">Available AI models for your conversations</p>
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search models..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <ScrollArea className="flex-1 p-6">
            <div className="max-w-6xl mx-auto">
              {/* Search Results Info */}
              {searchQuery && (
                <div className="text-sm text-muted-foreground mb-4">
                  {filteredModels.length} model{filteredModels.length !== 1 ? 's' : ''} found
                  {searchQuery && ` for "${searchQuery}"`}
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 md:gap-6">
                {filteredModels.map((model) => {
                  const displayInfo = getModelDisplayInfo(model.id);
                  return (
                    <Card key={model.id} className="hover:shadow-lg transition-all duration-200 hover:border-primary/20 min-h-[280px] touch-manipulation">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="flex items-center gap-2 text-base leading-tight">
                            <div className={cn("w-3 h-3 rounded-full flex-shrink-0", displayInfo.color)} />
                            <span className="break-words">{model.name}</span>
                          </CardTitle>
                          <Badge variant="outline" className="text-xs flex-shrink-0 whitespace-nowrap">
                            {displayInfo.provider}
                          </Badge>
                        </div>
                        <CardDescription className="text-sm leading-relaxed min-h-[2.5rem]">
                          {model.description}
                        </CardDescription>
                      </CardHeader>
                      
                      <CardContent className="space-y-4 pt-0">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Context</span>
                          </div>
                          <span className="font-medium">
                            {model.context_length.toLocaleString()}
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <DollarSign className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Pricing</span>
                          </div>
                          <div className="pl-4 md:pl-6 space-y-2 text-xs">
                            <div className="flex justify-between">
                              <span>Input:</span>
                              <span className="font-mono">${model.pricing.prompt}/1K</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Output:</span>
                              <span className="font-mono">${model.pricing.completion}/1K</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* UPDATED: Better model ID display */}
                        <div className="pt-2 border-t">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Zap className="w-3 h-3 flex-shrink-0" />
                              <span className="font-medium">Model ID:</span>
                            </div>
                            <div className="bg-muted/50 rounded p-2 text-[11px] md:text-xs font-mono break-all leading-relaxed">
                              {model.id}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              
              {filteredModels.length === 0 && models.length > 0 && (
                <div className="text-center py-12">
                  <h3 className="text-lg font-semibold text-muted-foreground">No models found</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Try adjusting your search terms or clear the search to see all models.
                  </p>
                  {searchQuery && (
                    <Button
                      variant="outline"
                      onClick={() => setSearchQuery('')}
                      className="mt-4"
                    >
                      Clear Search
                    </Button>
                  )}
                </div>
              )}
              
              {models.length === 0 && (
                <div className="text-center py-12">
                  <h3 className="text-lg font-semibold text-muted-foreground">No Models Available</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    No AI models are currently available. Please check your configuration.
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </Layout>
  );
};

export default Models;