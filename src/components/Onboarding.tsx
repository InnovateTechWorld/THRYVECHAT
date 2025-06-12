import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle, 
  Sparkles, 
  Brain, 
  NotebookPen,
  Crown,
  Zap,
  Users,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { SubscriptionPlans } from './SubscriptionPlans';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { usePayment } from '@/hooks/usePayment';
import { useModels, getModelDisplayInfo } from '@/hooks/useModels';
import { useDefaultModel } from '@/hooks/useDefaultModel';
import { API_URL } from '@/lib/api';
import { cn } from '@/lib/utils';

export const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session, user } = useAuth();
  
  const { 
    currentStep, 
    totalSteps, 
    setCurrentStep, 
    completeOnboarding,
    skipOnboarding 
  } = useOnboarding();

  // Form states
  const [memoryContent, setMemoryContent] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data states
  const [subscription, setSubscription] = useState<any>(null);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(false);
  const [subscriptionJustActivated, setSubscriptionJustActivated] = useState(false);

  // Use existing hooks instead of custom API calls
  const { models, isLoading: isLoadingModels } = useModels();
  const { subscription: paymentSubscription, isSubscribing } = usePayment();
  const { setDefaultModel, isSettingDefault } = useDefaultModel();

  // Auth headers helper
  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${session?.access_token}`,
    'Content-Type': 'application/json'
  });

  const handleNext = async () => {
    if (currentStep < totalSteps - 1) {
      if (currentStep === 1) {
        // Memory/Notes step
        await handleMemoryNotesSubmit();
      } else if (currentStep === 2) {
        // Subscription step - load subscription status
        await loadSubscriptionStatus();
        setCurrentStep(currentStep + 1);
      } else if (currentStep === 3) {
        // Model selection step
        await handleModelSelection();
      } else {
        setCurrentStep(currentStep + 1);
      }
    } else {
      // Final step
      completeOnboarding();
      navigate('/chat');
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const loadSubscriptionStatus = async () => {
    setIsLoadingSubscription(true);
    try {
      const response = await fetch(`${API_URL}/api/payment/dashboard-complete`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setSubscription(data?.data?.subscription);
        console.log('📊 Subscription loaded:', data?.data?.subscription);
      } else {
        console.warn('⚠️ Could not load subscription status');
      }
    } catch (error) {
      console.error('❌ Error loading subscription:', error);
    } finally {
      setIsLoadingSubscription(false);
    }
  };


  // Handler for when subscription plan is successfully selected
  const handleSubscriptionSuccess = async () => {
    console.log('🎉 Subscription plan activated successfully!');
    
    setSubscriptionJustActivated(true);
    
    // Show success message
    toast({
      title: "Plan Activated!",
      description: "Your subscription has been activated successfully. You can now select AI models.",
    });

    // Refresh subscription status
    await loadSubscriptionStatus();
    
    // Auto-advance to next step after a brief delay to show the success message
    setTimeout(() => {
      console.log('➡️ Auto-advancing to model selection step');
      setCurrentStep(currentStep + 1);
    }, 1500);
  };

  const handleMemoryNotesSubmit = async () => {
    setIsSubmitting(true);
    try {
      const promises = [];
      
      if (memoryContent.trim()) {
        console.log('📝 Creating memory...');
        const memoryPromise = fetch(`${API_URL}/memory`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ content: memoryContent })
        });
        promises.push(memoryPromise);
      }
      
      if (noteContent.trim()) {
        console.log('📋 Creating note...');
        const notePromise = fetch(`${API_URL}/notes`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ content: noteContent })
        });
        promises.push(notePromise);
      }

      if (promises.length > 0) {
        const results = await Promise.all(promises);
        
        // Check if all requests were successful
        const allSuccessful = results.every(response => response.ok);
        
        if (allSuccessful) {
          console.log('✅ Memory/Notes saved successfully');
          toast({
            title: "Success!",
            description: "Your memory and notes have been saved.",
          });
        } else {
          throw new Error('Some requests failed');
        }
      } else {
        console.log('ℹ️ No memory or notes to save, proceeding...');
      }
      
      setCurrentStep(currentStep + 1);
    } catch (error) {
      console.error('❌ Failed to save memory/notes:', error);
      toast({
        title: "Error",
        description: `Failed to save your information: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModelSelection = async () => {
    if (!selectedModel) {
      toast({
        title: "Please select a model",
        description: "You need to choose a default AI model to continue.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('🤖 Setting default model:', selectedModel);
      
      const response = await fetch(`${API_URL}/default-model`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ model_id: selectedModel })
      });

      if (response.ok) {
        toast({
          title: "Success!",
          description: "Your default model has been set.",
        });
        setCurrentStep(currentStep + 1);
      } else {
        throw new Error('Failed to set default model');
      }
    } catch (error) {
      console.error('❌ Failed to set default model:', error);
      toast({
        title: "Error",
        description: `Failed to set default model: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Models are now loaded automatically by useModels hook - no manual loading needed

  // Watch for subscription activation and auto-advance
  React.useEffect(() => {
    if (currentStep === 2 && paymentSubscription && paymentSubscription.status === 'active' && !subscriptionJustActivated) {
      console.log('🎉 Subscription detected as active, triggering success handler');
      handleSubscriptionSuccess();
    }
  }, [paymentSubscription, currentStep, subscriptionJustActivated]);

  const canProceedToModels = (paymentSubscription && paymentSubscription.status === 'active') ||
                            (subscription && subscription.status === 'active');

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <WelcomeStep />;
      case 1:
        return (
          <MemoryNotesStep
            memoryContent={memoryContent}
            setMemoryContent={setMemoryContent}
            noteContent={noteContent}
            setNoteContent={setNoteContent}
          />
        );
      case 2:
        return <SubscriptionStep onPlanSelect={handleSubscriptionSuccess} />;
      case 3:
        return (
          <ModelSelectionStep
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            models={models}
            isLoadingModels={isLoadingModels}
            canProceed={canProceedToModels}
            isLoadingSubscription={isLoadingSubscription}
          />
        );
      default:
        return <WelcomeStep />;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 0: return 'Welcome to Echo Verse AI';
      case 1: return 'Add Your First Memory & Note';
      case 2: return 'Choose Your Plan';
      case 3: return 'Select Your Default Model';
      default: return 'Getting Started';
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return true;
      case 1: return true; // Allow proceeding even without content
      case 2: return true; // Allow proceeding to check subscription
      case 3: return selectedModel && canProceedToModels;
      default: return true;
    }
  };

  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold gradient-text">Getting Started</h1>
          </div>
          <Progress value={progress} className="w-full max-w-md mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Step {currentStep + 1} of {totalSteps}
          </p>
        </div>

        <Card className="w-full shadow-xl border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-semibold">
              {getStepTitle()}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {renderStep()}
            
            <div className="flex justify-between items-center pt-6 border-t">
              <div className="flex gap-2">
                {currentStep > 0 && (
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    disabled={isSubmitting}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  onClick={skipOnboarding}
                  className="text-muted-foreground hover:text-foreground"
                  disabled={isSubmitting}
                >
                  Skip Setup
                </Button>
              </div>

              <Button
                onClick={handleNext}
                disabled={!canProceed() || isSubmitting || isSubscribing}
                className="min-w-[120px]"
              >
                {(isSubmitting || isSubscribing) ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isSubscribing ? 'Activating Plan...' : 'Processing...'}
                  </>
                ) : currentStep === totalSteps - 1 ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Complete
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const WelcomeStep: React.FC = () => (
  <div className="text-center space-y-6">
    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
      <Sparkles className="w-10 h-10 text-primary" />
    </div>
    
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">Welcome to Echo Verse AI!</h3>
      <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
        Let's get you set up with everything you need to have amazing AI conversations. 
        This quick setup will help you personalize your experience.
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
      <div className="text-center p-4 rounded-lg bg-muted/50">
        <Brain className="w-8 h-8 text-blue-500 mx-auto mb-2" />
        <h4 className="font-medium mb-1">Memories</h4>
        <p className="text-xs text-muted-foreground">Save important information for AI to remember</p>
      </div>
      <div className="text-center p-4 rounded-lg bg-muted/50">
        <Crown className="w-8 h-8 text-purple-500 mx-auto mb-2" />
        <h4 className="font-medium mb-1">Subscription</h4>
        <p className="text-xs text-muted-foreground">Choose the perfect plan for your needs</p>
      </div>
      <div className="text-center p-4 rounded-lg bg-muted/50">
        <Zap className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
        <h4 className="font-medium mb-1">AI Models</h4>
        <p className="text-xs text-muted-foreground">Select your preferred AI model</p>
      </div>
    </div>
  </div>
);

interface MemoryNotesStepProps {
  memoryContent: string;
  setMemoryContent: (content: string) => void;
  noteContent: string;
  setNoteContent: (content: string) => void;
}

const MemoryNotesStep: React.FC<MemoryNotesStepProps> = ({
  memoryContent,
  setMemoryContent,
  noteContent,
  setNoteContent,
}) => (
  <div className="space-y-6">
    <div className="text-center">
      <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <Brain className="w-8 h-8 text-blue-500" />
      </div>
      <h3 className="text-xl font-semibold mb-2">Add Your First Memory & Note</h3>
      <p className="text-muted-foreground max-w-md mx-auto">
        Memories help the AI remember important information about you across conversations. 
        Notes are for quick references and reminders.
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-blue-500" />
          <h4 className="font-medium">Memory</h4>
          <Badge variant="secondary" className="text-xs">Optional</Badge>
        </div>
        <Textarea
          placeholder="e.g., I'm a software developer who enjoys working with React and TypeScript..."
          value={memoryContent}
          onChange={(e) => setMemoryContent(e.target.value)}
          className="min-h-[100px] resize-none"
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground">
          {memoryContent.length}/500 characters
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <NotebookPen className="w-5 h-5 text-green-500" />
          <h4 className="font-medium">Note</h4>
          <Badge variant="secondary" className="text-xs">Optional</Badge>
        </div>
        <Textarea
          placeholder="e.g., Currently working on a React project, need help with state management..."
          value={noteContent}
          onChange={(e) => setNoteContent(e.target.value)}
          className="min-h-[100px] resize-none"
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground">
          {noteContent.length}/500 characters
        </p>
      </div>
    </div>

    {(!memoryContent.trim() && !noteContent.trim()) && (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          You can skip this step and add memories/notes later, but they help personalize your AI experience.
        </AlertDescription>
      </Alert>
    )}
  </div>
);

interface SubscriptionStepProps {
  onPlanSelect: () => void;
}

const SubscriptionStep: React.FC<SubscriptionStepProps> = ({ onPlanSelect }) => {
  const { isSubscribing } = usePayment();
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          {isSubscribing ? (
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          ) : (
            <Crown className="w-8 h-8 text-purple-500" />
          )}
        </div>
        <h3 className="text-xl font-semibold mb-2">
          {isSubscribing ? 'Activating Your Plan...' : 'Choose Your Plan'}
        </h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          {isSubscribing ? (
            'Please wait while we activate your subscription plan.'
          ) : (
            <>
              Select a subscription plan to unlock AI models and features.
              <strong className="text-foreground"> You must have an active plan to select AI models.</strong>
            </>
          )}
        </p>
      </div>

      {isSubscribing ? (
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Processing your subscription...</p>
        </div>
      ) : (
        <SubscriptionPlans onPlanSelect={onPlanSelect} />
      )}
    </div>
  );
};

interface ModelSelectionStepProps {
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  models: any[];
  isLoadingModels: boolean;
  canProceed: boolean;
  isLoadingSubscription: boolean;
}

const ModelSelectionStep: React.FC<ModelSelectionStepProps> = ({
  selectedModel,
  setSelectedModel,
  models,
  isLoadingModels,
  canProceed,
  isLoadingSubscription,
}) => {
  if (isLoadingSubscription) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Checking subscription status...</p>
      </div>
    );
  }

  if (!canProceed) {
    return (
      <div className="text-center space-y-6">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">Active Subscription Required</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            You need an active subscription plan to select AI models. 
            Please go back and choose a plan first.
          </p>
        </div>
      </div>
    );
  }

  if (isLoadingModels) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading available models...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Zap className="w-8 h-8 text-yellow-500" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Select Your Default Model</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Choose your preferred AI model for conversations. You can always change this later in settings.
        </p>
      </div>

      {/* Show selected model if one is chosen */}
      {selectedModel && Array.isArray(models) && models.length > 0 && (
        <div className="max-w-md mx-auto">
          <div className="text-sm text-muted-foreground mb-2">Selected Model:</div>
          <Card className="border-primary bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className={cn("w-2 h-2 rounded-full", getModelDisplayInfo(selectedModel).color)} />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm truncate">
                      {models.find(m => m.id === selectedModel)?.name || getModelDisplayInfo(selectedModel).modelName}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{selectedModel}</span>
                      {getModelDisplayInfo(selectedModel).isFree && (
                        <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">FREE</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Model search and selection */}
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-0">
            <Command className="rounded-lg border-0">
              <CommandInput placeholder="Search models..." className="border-0" />
              <CommandEmpty>No models found.</CommandEmpty>
              <CommandList className="max-h-[300px]">
                <CommandGroup>
                  {Array.isArray(models) && models.map((model) => {
                    const displayInfo = getModelDisplayInfo(model.id);
                    const isSelected = selectedModel === model.id;
                    
                    return (
                      <CommandItem
                        key={model.id}
                        onSelect={() => setSelectedModel(model.id)}
                        className={cn(
                          "cursor-pointer",
                          isSelected && "bg-primary/10"
                        )}
                      >
                        <CheckCircle
                          className={cn(
                            "mr-3 h-4 w-4",
                            isSelected ? "opacity-100 text-primary" : "opacity-0"
                          )}
                        />
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={cn("w-2 h-2 rounded-full", displayInfo.color)} />
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm truncate flex items-center gap-2">
                              {model.name}
                              {displayInfo.isFree && (
                                <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">FREE</Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {model.id}
                            </div>
                            {model.pricing && (
                              <div className="text-xs text-muted-foreground mt-1">
                                ${model.pricing.prompt || 0}/1K tokens • {model.context_length?.toLocaleString() || 'N/A'} context
                              </div>
                            )}
                          </div>
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </CardContent>
        </Card>
      </div>

      {(!Array.isArray(models) || models.length === 0) && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No models available. Please contact support.</p>
        </div>
      )}
    </div>
  );
};