import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, CreditCard, Zap, Calendar, ArrowRight } from 'lucide-react';

interface PaymentSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentData: {
    type: 'subscription' | 'topup';
    amount: number;
    currency: string;
    amountUSD: number;
    planName?: string;
    credits?: number;
    reference: string;
  } | null;
}

export const PaymentSuccessModal: React.FC<PaymentSuccessModalProps> = ({
  isOpen,
  onClose,
  paymentData
}) => {
  if (!paymentData) return null;

  const formatCurrency = (amount: number, currency: string) => {
    const symbols: Record<string, string> = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'NGN': '₦',
      'GHS': '₵',
      'KES': 'KSh',
      'ZAR': 'R',
      'JPY': '¥',
      'CNY': '¥',
      'INR': '₹',
      'AED': 'د.إ',
      'SAR': '﷼',
    };
    
    const symbol = symbols[currency] || currency;
    return `${symbol}${amount.toFixed(2)}`;
  };

  const handleViewDashboard = () => {
    onClose();
    if (paymentData.type === 'subscription') {
      window.location.href = '/billing?tab=subscription';
    } else {
      window.location.href = '/billing?tab=credits';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-6 h-6" />
            Payment Successful!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Success Message */}
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {paymentData.type === 'subscription' ? 'Subscription Activated!' : 'Credits Added!'}
            </h3>
            <p className="text-muted-foreground">
              {paymentData.type === 'subscription' 
                ? `Your ${paymentData.planName} plan is now active and ready to use.`
                : `${formatCurrency(paymentData.amountUSD, 'USD')} in credits has been added to your account.`
              }
            </p>
          </div>

          {/* Payment Details */}
          <div className="bg-muted rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Payment Amount:</span>
              <div className="text-right">
                <div className="font-medium">
                  {formatCurrency(paymentData.amount, paymentData.currency)}
                </div>
                {paymentData.currency !== 'USD' && (
                  <div className="text-sm text-muted-foreground">
                    ≈ ${paymentData.amountUSD.toFixed(2)} USD
                  </div>
                )}
              </div>
            </div>

            {paymentData.type === 'subscription' && paymentData.planName && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Plan:</span>
                <Badge variant="default">{paymentData.planName}</Badge>
              </div>
            )}

            {paymentData.credits && paymentData.credits > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Credits Added:</span>
                <div className="flex items-center gap-1">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span className="font-medium">${paymentData.credits.toFixed(2)}</span>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Reference:</span>
              <span className="text-xs font-mono text-muted-foreground">
                {paymentData.reference}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Date:</span>
              <span className="text-sm">
                {new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>

          {/* What's Next */}
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
              What's Next?
            </h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              {paymentData.type === 'subscription' ? (
                <>
                  <li>• Your new plan features are now available</li>
                  <li>• Enjoy increased limits and premium models</li>
                  <li>• Monthly credits have been added to your account</li>
                  <li>• Billing will auto-renew monthly</li>
                </>
              ) : (
                <>
                  <li>• Credits are available immediately</li>
                  <li>• Use credits for AI model calls and features</li>
                  <li>• Credits never expire</li>
                  <li>• Track usage in your dashboard</li>
                </>
              )}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Continue
            </Button>
            <Button onClick={handleViewDashboard} className="flex-1">
              <ArrowRight className="w-4 h-4 mr-2" />
              View Dashboard
            </Button>
          </div>

          {/* Support Note */}
          <div className="text-center text-xs text-muted-foreground">
            Need help? Contact our support team with reference: {paymentData.reference}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};