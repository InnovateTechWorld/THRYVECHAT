import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { API_URL } from '@/lib/api';

export const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session, user } = useAuth();
  
  const {
    currentStep,
    totalSteps,
    setCurrentStep,
    completeOnboarding,
    skipOnboarding,
    isNewUser
  } = useOnboarding();

  // Form states
  const [memoryContent, setMemoryContent] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data states
  const [subscription, setSubscription] = useState<any>(null);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(false);
  const [hasAutoActivated, setHasAutoActivated] = useState(false);

  // Use existing hooks instead of custom API calls
  const {
    subscription: paymentSubscription,
    isSubscribing,
    createSubscription,
    plans
  } = usePayment();

  // Auth headers helper
  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${session?.access_token}`,
    'Content-Type': 'application/json'
  });


const handleNext = async () => {
  console.log('🔍 handleNext called, currentStep:', currentStep);
  
  try {
    if (currentStep === 1) {
      // Memory/Notes step
      await handleMemoryNotesSubmit();
      setCurrentStep(currentStep + 1);
    } else if (currentStep === 2) {
      // For subscription step, handle navigation in one place
      if (subscription || (isNewUser && await activateFreePlan())) {
        console.log('🔍 Step 2 - Navigating to model selection');
        window.location.href = '/onboarding/model-selection';
      } else {
        toast({
          title: "Subscription Required",
          description: "Please select a subscription plan to continue.",
          variant: "destructive"
        });
      }
    } else {
      setCurrentStep(currentStep + 1);
    }
  } catch (error) {
    console.error('❌ Error in handleNext:', error);
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

  // Auto-activate free plan for new users using the proper payment system
  const activateFreePlan = React.useCallback(async () => {
    if (hasAutoActivated) {
      console.log('🔍 Free plan already activated, skipping...');
      return;
    }

    setIsLoadingSubscription(true);
    setHasAutoActivated(true);
    
    try {
      console.log('🆓 Auto-activating free plan for new user...');
      
      // Find the free plan from available plans
      const freePlan = plans?.find(plan =>
        plan.price === 0 || plan.name.toLowerCase().includes('free')
      );
      
      if (!freePlan) {
        console.error('❌ No free plan found');
        return false;
      }
      
      console.log('🆓 Found free plan, activating...', freePlan);
      
      // Use the existing createSubscription function
      let success = false;
      await new Promise<void>((resolve) => {
        createSubscription({ planId: freePlan.id }, {
          onSuccess: (data) => {
            console.log('✅ Free plan activated successfully:', data);
            toast({
              title: "Welcome!",
              description: "Free plan activated! Redirecting to model selection...",
            });
            success = true;
            resolve();
          },
          onError: (error) => {
            console.error('❌ Error activating free plan:', error);
            resolve();
          }
        });
      });
      
      return success;
      
    } catch (error) {
      console.error('❌ Error activating free plan:', error);
      return false;
    } finally {
      setIsLoadingSubscription(false);
    }
  }, [hasAutoActivated, plans, createSubscription, toast, setHasAutoActivated, setIsLoadingSubscription]);

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

  // Auto-activate free plan when user reaches step 2
  React.useEffect(() => {
    if (currentStep === 2 && isNewUser && plans?.length > 0 && !hasAutoActivated) {
      console.log('🔍 New user reached step 2, activating free plan...');
      handleNext();
    }
  }, [currentStep, isNewUser, plans, hasAutoActivated]);

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
        return <SubscriptionStep />;
      default:
        return <WelcomeStep />;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 0: return 'Welcome to Echo Verse AI';
      case 1: return 'Add Your First Memory & Note';
      case 2: return 'Choose Your Plan';
      default: return 'Getting Started';
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return true;
      case 1: return true; // Allow proceeding even without content
      case 2: return true; // Allow proceeding to check subscription
      default: return true;
    }
  };

  // Adjust totalSteps to 3 since we're removing the inline model selection step
  const adjustedTotalSteps = 3;
  const progress = ((currentStep + 1) / adjustedTotalSteps) * 100;

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
            Step {currentStep + 1} of {adjustedTotalSteps}
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
                ) : currentStep === adjustedTotalSteps - 1 ? (
                  <>
                    Next: Select Model
                    <ArrowRight className="w-4 h-4 ml-2" />
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

const SubscriptionStep: React.FC = () => {
  const { isSubscribing } = usePayment();
  const { isNewUser } = useOnboarding();
  
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
          {isSubscribing ? 'Activating Your Plan...' : isNewUser ? 'Activating Free Plan...' : 'Choose Your Plan'}
        </h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          {isSubscribing ? (
            'Please wait while we activate your subscription plan.'
          ) : isNewUser ? (
            <>
              Setting up your <strong className="text-green-600">free plan</strong> automatically.
              You will be redirected to model selection automatically.
            </>
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
      ) : isNewUser ? (
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Setting up your free plan...</p>
          <p className="text-xs text-muted-foreground mt-2">
            This should redirect automatically. If not, click "Next: Select Model" above.
          </p>
        </div>
      ) : (
        <SubscriptionPlans onPlanSelect={() => {}} />
      )}
    </div>
  );
};