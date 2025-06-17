import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SubscriptionPlans } from './SubscriptionPlans';
import { Crown, Loader2 } from 'lucide-react';
import { usePayment } from '@/hooks/usePayment';
import { useToast } from '@/hooks/use-toast';
import { PaymentSuccessModal } from './PaymentSuccessModal';

interface UpgradeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  modelName?: string;
}

export const UpgradeDialog: React.FC<UpgradeDialogProps> = ({
  isOpen,
  onClose,
  modelName = 'this model'
}) => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(false);
  const [paymentSuccessData, setPaymentSuccessData] = useState<any>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const { verifyPayment, refreshBillingData } = usePayment();

  useEffect(() => {
    const isPaymentCallback = searchParams.get('payment') === 'callback';
    if (isPaymentCallback) {
      handlePaymentCallback();
    }
  }, [searchParams]);

  const handlePaymentCallback = async () => {
    setIsVerifying(true);
    
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const status = urlParams.get('status');
      const tx_ref = urlParams.get('tx_ref');
      const transaction_id = urlParams.get('transaction_id');

      const pendingPaymentData = localStorage.getItem('pendingPayment');
      const pendingPayment = pendingPaymentData ? JSON.parse(pendingPaymentData) : {};

      if (status === 'successful' && (transaction_id || tx_ref)) {
        verifyPayment({ 
          transaction_id: transaction_id || '', 
          tx_ref: tx_ref || '', 
          status 
        }, {
          onSuccess: (result) => {
            if (result.success && result.verified) {
              localStorage.removeItem('pendingPayment');
              
              toast({
                title: "Payment Completed!",
                description: `${result.data?.plan?.name} plan activated successfully.`,
              });
              
              setPaymentSuccessData({
                type: result.data?.type || pendingPayment.type || 'subscription',
                amount: pendingPayment.amount || 0,
                currency: pendingPayment.currency || 'USD',
                amountUSD: pendingPayment.amountUSD || 0,
                planName: result.data?.plan?.name || result.data?.planName || 'Premium Plan',
                reference: pendingPayment.reference || tx_ref
              });
              
              setShowSuccessModal(true);
              onClose();
              refreshBillingData();
            } else {
              throw new Error(result.error || 'Payment verification failed');
            }
          },
          onError: (error) => {
            console.error('Payment verification error:', error);
            toast({
              title: "Payment Verification Failed",
              description: error instanceof Error ? error.message : "Please contact support if payment was deducted",
              variant: "destructive"
            });
          }
        });
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      toast({
        title: "Payment Verification Failed",
        description: error instanceof Error ? error.message : "Please contact support if payment was deducted",
        variant: "destructive"
      });
    } finally {
      setIsVerifying(false);
    }
  };

  if (isVerifying) {
    return (
      <Dialog open={true} onOpenChange={() => {}}>
        <DialogContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Verifying Payment</h2>
              <p className="text-muted-foreground">
                Please wait while we confirm your payment and activate your plan...
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2 justify-center mb-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Crown className="w-5 h-5 text-primary" />
              </div>
            </div>
            <DialogTitle className="text-2xl text-center">
              Upgrade Required
            </DialogTitle>
            <DialogDescription className="text-center text-base">
              {`${modelName} is only available with a paid subscription. Upgrade your plan to unlock access to premium AI models and features.`}
            </DialogDescription>
          </DialogHeader>

          <SubscriptionPlans 
            onPlanSelect={() => {
              refreshBillingData();
            }}
          />
        </DialogContent>
      </Dialog>

      <PaymentSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        paymentData={paymentSuccessData}
      />
    </>
  );
};