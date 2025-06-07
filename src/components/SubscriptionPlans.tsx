import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Zap, Users, Brain, Database, Loader2 } from 'lucide-react';
import { usePayment, Plan } from '@/hooks/usePayment';
import { CurrencySelector } from './CurrencySelector';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionPlansProps {
  currentPlan?: string;
  onPlanSelect?: (plan: Plan) => void;
}

export const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({
  currentPlan,
  onPlanSelect
}) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const { getPlans, createSubscription, initiatePayment, calculateLocalAmount, isLoading } = usePayment();
  const { toast } = useToast();

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const plansData = await getPlans();
      setPlans(plansData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load subscription plans",
        variant: "destructive"
      });
    }
  };

  const handlePlanSelect = async (plan: Plan) => {
    if (plan.name === currentPlan) return;

    setIsProcessing(plan.id);

    try {
      const subscriptionResult = await createSubscription(plan.id);
      
      if (subscriptionResult.requiresPayment) {
        // Paid plan - initiate payment
        const localAmount = calculateLocalAmount(subscriptionResult.amount, selectedCurrency);
        await initiatePayment('subscription', localAmount, selectedCurrency, plan.id);
      } else {
        // Free plan - activated immediately
        toast({
          title: "Plan Activated!",
          description: `${plan.name} plan activated successfully`,
        });
        onPlanSelect?.(plan);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to select plan",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(null);
    }
  };

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'free': return <Users className="w-5 h-5" />;
      case 'pro': return <Zap className="w-5 h-5" />;
      case 'power': return <Crown className="w-5 h-5" />;
      default: return <Database className="w-5 h-5" />;
    }
  };

  const getPlanColor = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'free': return 'bg-gray-500';
      case 'pro': return 'bg-blue-500';
      case 'power': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const formatLimit = (limit: number) => {
    if (limit === -1) return 'Unlimited';
    return limit.toString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Loading plans...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Choose Your Plan</h2>
        <p className="text-muted-foreground">
          Select the perfect plan for your AI needs
        </p>
      </div>

      <div className="max-w-md mx-auto">
        <CurrencySelector
          selectedCurrency={selectedCurrency}
          onCurrencyChange={setSelectedCurrency}
          usdAmount={10}
          showPaymentMethods={false}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrentPlan = plan.name === currentPlan;
          const localPrice = calculateLocalAmount(plan.price, selectedCurrency);
          const currencySymbol = selectedCurrency === 'USD' ? '$' : 
            selectedCurrency === 'EUR' ? '€' : 
            selectedCurrency === 'GBP' ? '£' : 
            selectedCurrency === 'NGN' ? '₦' : '$';

          return (
            <Card 
              key={plan.id} 
              className={`relative transition-all duration-200 ${
                isCurrentPlan 
                  ? 'ring-2 ring-primary shadow-lg' 
                  : 'hover:shadow-md'
              } ${plan.name === 'Pro' ? 'border-blue-200 bg-blue-50/50 dark:bg-blue-950/20' : ''}`}
            >
              {plan.name === 'Pro' && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500">Most Popular</Badge>
                </div>
              )}

              <CardHeader className="text-center pb-2">
                <div className={`w-12 h-12 rounded-full ${getPlanColor(plan.name)} flex items-center justify-center text-white mx-auto mb-2`}>
                  {getPlanIcon(plan.name)}
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <div className="space-y-1">
                  <div className="text-3xl font-bold">
                    {plan.price === 0 ? 'Free' : `${currencySymbol}${localPrice}`}
                  </div>
                  {plan.price > 0 && (
                    <div className="text-sm text-muted-foreground">
                      per month ({currencySymbol}{plan.credits} credits included)
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm">
                      {plan.memory_limit} memories
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm">
                      {formatLimit(plan.session_api_limit)} session APIs
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm">
                      {formatLimit(plan.context_api_limit)} context APIs
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm">
                      {plan.free_models_only ? 'Free models only' : 'All AI models'}
                    </span>
                  </li>
                  {plan.credits > 0 && (
                    <li className="flex items-center gap-2">
                      <Brain className="w-4 h-4 text-blue-500" />
                      <span className="text-sm">
                        ${plan.credits} monthly credits
                      </span>
                    </li>
                  )}
                </ul>

                <Button
                  onClick={() => handlePlanSelect(plan)}
                  disabled={isCurrentPlan || isProcessing === plan.id}
                  className="w-full"
                  variant={isCurrentPlan ? 'outline' : 'default'}
                >
                  {isProcessing === plan.id ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : isCurrentPlan ? (
                    'Current Plan'
                  ) : plan.price === 0 ? (
                    'Get Started'
                  ) : (
                    `Upgrade to ${plan.name}`
                  )}
                </Button>

                {isCurrentPlan && (
                  <div className="text-center">
                    <Badge variant="secondary">Active</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>All plans include 24/7 support and secure payment processing</p>
        <p>You can upgrade, downgrade, or cancel your subscription at any time</p>
      </div>
    </div>
  );
};