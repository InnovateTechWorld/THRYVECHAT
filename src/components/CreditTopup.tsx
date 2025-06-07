import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, Loader2, Plus } from 'lucide-react';
import { usePayment, Credits } from '@/hooks/usePayment';
import { CurrencySelector } from './CurrencySelector';
import { useToast } from '@/hooks/use-toast';

interface CreditTopupProps {
  onTopupComplete?: (credits: Credits) => void;
}

export const CreditTopup: React.FC<CreditTopupProps> = ({ onTopupComplete }) => {
  const [credits, setCredits] = useState<Credits | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [selectedAmount, setSelectedAmount] = useState(10);
  const [isProcessing, setIsProcessing] = useState(false);
  const { getCredits, initiatePayment, calculateLocalAmount, isLoading } = usePayment();
  const { toast } = useToast();

  const topupOptions = [
    { usd: 5, credits: 5, popular: false },
    { usd: 10, credits: 10, popular: true },
    { usd: 25, credits: 25, popular: false },
    { usd: 50, credits: 50, popular: false },
    { usd: 100, credits: 100, popular: false },
  ];

  useEffect(() => {
    loadCredits();
  }, []);

  const loadCredits = async () => {
    try {
      const creditsData = await getCredits();
      setCredits(creditsData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load credit balance",
        variant: "destructive"
      });
    }
  };

  const handleTopup = async () => {
    setIsProcessing(true);

    try {
      const localAmount = calculateLocalAmount(selectedAmount, selectedCurrency);
      await initiatePayment('topup', localAmount, selectedCurrency);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to initiate payment",
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  };

  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'NGN': return '₦';
      case 'GHS': return '₵';
      case 'KES': return 'KSh';
      case 'ZAR': return 'R';
      case 'JPY': return '¥';
      case 'CNY': return '¥';
      case 'INR': return '₹';
      case 'AED': return 'د.إ';
      case 'SAR': return '﷼';
      default: return '$';
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Balance */}
      {credits && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              Current Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  ${credits.available_credits.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">Available</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  ${credits.total_purchased.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">Total Purchased</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-600">
                  ${credits.total_used.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">Total Used</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Currency Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Currency</CardTitle>
        </CardHeader>
        <CardContent>
          <CurrencySelector
            selectedCurrency={selectedCurrency}
            onCurrencyChange={setSelectedCurrency}
            usdAmount={selectedAmount}
          />
        </CardContent>
      </Card>

      {/* Top-up Options */}
      <Card>
        <CardHeader>
          <CardTitle>Choose Top-up Amount</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            {topupOptions.map((option) => {
              const localAmount = calculateLocalAmount(option.usd, selectedCurrency);
              const currencySymbol = getCurrencySymbol(selectedCurrency);
              const isSelected = selectedAmount === option.usd;

              return (
                <div
                  key={option.usd}
                  className={`relative p-4 border rounded-lg cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedAmount(option.usd)}
                >
                  {option.popular && (
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-blue-500 text-xs px-2 py-1">Popular</Badge>
                    </div>
                  )}
                  
                  <div className="text-center">
                    <div className="text-lg font-bold">
                      {currencySymbol}{localAmount}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      ${option.usd} USD
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      +{option.credits} credits
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-800 dark:text-blue-200">
                  Credit Information
                </span>
              </div>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Credits never expire</li>
                <li>• 1 USD = 1 Credit for AI model usage</li>
                <li>• Credits are used for API calls and premium features</li>
                <li>• Real-time usage tracking in your dashboard</li>
              </ul>
            </div>

            <Button
              onClick={handleTopup}
              disabled={isProcessing || isLoading}
              className="w-full"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add {getCurrencySymbol(selectedCurrency)}{calculateLocalAmount(selectedAmount, selectedCurrency)} Credits
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};