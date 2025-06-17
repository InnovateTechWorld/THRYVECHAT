import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CheckCircle, Loader2, Search } from 'lucide-react';
import { useModels, getModelDisplayInfo } from '@/hooks/useModels';
import { useDefaultModel } from '@/hooks/useDefaultModel';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

const OnboardingModelSelection = () => {
  const navigate = useNavigate();
  const { completeOnboarding } = useOnboarding();
  const { toast } = useToast();
  const { models, isLoading: modelsLoading } = useModels();
  const { setDefaultModel, isSettingDefault } = useDefaultModel();
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Find the free model immediately when models load
  React.useEffect(() => {
    if (models.length > 0 && !selectedModelId) {
      const freeModel = models.find(m => m.id === 'mistralai/devstral-small:free') 
        || models.find(m => getModelDisplayInfo(m.id).isFree)
        || models[0];
        
      if (freeModel) {
        console.log('🤖 Found initial model:', freeModel.id);
        setSelectedModelId(freeModel.id);
      }
    }
  }, [models]);

  const handleSaveAndComplete = async () => {
    if (!selectedModelId) {
      toast({
        title: "Error",
        description: "Please select a model first",
        variant: "destructive"
      });
      return;
    }

    try {
      await new Promise((resolve, reject) => {
        setDefaultModel(selectedModelId, {
          onSuccess: () => {
            console.log('✅ Model set successfully:', selectedModelId);
            resolve(true);
          },
          onError: (error) => {
            console.error('❌ Failed to set model:', error);
            reject(error);
          }
        });
      });

      toast({
        title: "Success!",
        description: "Your default model has been set."
      });

      // Complete onboarding and redirect
      completeOnboarding();
      navigate('/chat');

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to set default model. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSkip = () => {
    completeOnboarding();
    navigate('/chat');
  };

  if (modelsLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>Loading models...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex-1 flex flex-col p-6">
        <div className="max-w-2xl mx-auto w-full">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Select Your AI Model</h1>
            <p className="text-muted-foreground">
              Choose a model to use for your conversations.
            </p>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="mb-4 relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search models..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
                />
              </div>

              <div className="max-h-[400px] overflow-y-auto pr-2">
                <RadioGroup
                  value={selectedModelId}
                  onValueChange={setSelectedModelId}
                  className="space-y-2"
                >
                  {models
                    .filter(model => 
                      model.name.toLowerCase().includes(searchTerm) ||
                      model.id.toLowerCase().includes(searchTerm)
                    )
                    .map((model) => {
                      const info = getModelDisplayInfo(model.id);
                      return (
                        <Label
                          key={model.id}
                          className={cn(
                            "flex items-center gap-4 p-3 border rounded-lg cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors",
                            selectedModelId === model.id && "border-primary bg-primary/5",
                            "data-[state=checked]:border-primary"
                          )}
                        >
                          <RadioGroupItem value={model.id} id={model.id} />
                          <div className="flex items-center gap-2 flex-1">
                            <div className={cn("w-2 h-2 rounded-full", info.color)} />
                            <span className="font-medium">{model.name}</span>
                            {info.isFree && (
                              <Badge variant="secondary" className="text-xs">FREE</Badge>
                            )}
                          </div>
                          {selectedModelId === model.id && (
                            <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                          )}
                        </Label>
                      );
                    })}
                </RadioGroup>
              </div>

              <div className="flex justify-between mt-8 pt-4 border-t">
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  disabled={isSettingDefault}
                >
                  Skip for now
                </Button>
                <Button 
                  onClick={handleSaveAndComplete}
                  disabled={!selectedModelId || isSettingDefault}
                >
                  {isSettingDefault ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Setting model...
                    </>
                  ) : (
                    'Continue to Chat'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default OnboardingModelSelection;