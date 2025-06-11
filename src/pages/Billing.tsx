import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CreditCard, 
  Crown, 
  Zap, 
  History, 
  Settings, 
  Loader2, 
  AlertCircle,
  CheckCircle,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { usePayment, BillingDashboard } from '@/hooks/usePayment';
import { SubscriptionPlans } from '@/components/SubscriptionPlans';
import { CreditTopup } from '@/components/CreditTopup';
import { TransactionHistory } from '@/components/TransactionHistory';
import { PaymentSuccessModal } from '@/components/PaymentSuccessModal';

const Billing = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [paymentSuccessData, setPaymentSuccessData] = useState<any>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const { 
    billingDashboard,
    verifyPayment, 
    cancelSubscription,
    isLoading,
    dashboardLoading,
    refreshBillingData
  } = usePayment();

  const formatCurrency = (value: any): string => {
    const numValue = Number(value || 0);
    return isNaN(numValue) ? '0.00' : numValue.toFixed(2);
  };

  useEffect(() => {
    // Check for payment callback
    const isPaymentCallback = searchParams.get('payment') === 'callback';
    const tab = searchParams.get('tab');
    
    if (tab) {
      setActiveTab(tab);
    }
    
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

      console.log('Payment callback params:', { status, tx_ref, transaction_id });

      const pendingPaymentData = localStorage.getItem('pendingPayment');
      const pendingPayment = pendingPaymentData ? JSON.parse(pendingPaymentData) : {};

      if (status === 'successful' && (transaction_id || tx_ref)) {
        console.log('Verifying payment...');
        
        // Use the verifyPayment mutation from usePayment
        verifyPayment({ 
          transaction_id: transaction_id || '', 
          tx_ref: tx_ref || '', 
          status 
        }, {
          onSuccess: (result) => {
            console.log('Verification result:', result);

            if (result.success && result.verified) {
              localStorage.removeItem('pendingPayment');
              
              if (result.data?.plan?.name) {
                toast({
                  title: "Payment Completed!",
                  description: `${result.data.plan.name} plan activated successfully.`,
                });
              } else {
                toast({
                  title: "Payment Completed!",
                  description: "Payment completed successfully!",
                });
              }
              
              setPaymentSuccessData({
                type: result.data?.type || pendingPayment.type || 'topup',
                amount: pendingPayment.amount || 0,
                currency: pendingPayment.currency || 'USD',
                amountUSD: pendingPayment.amountUSD || 0,
                planName: result.data?.plan?.name || result.data?.planName || 'Premium Plan',
                credits: result.data?.creditsAdded,
                reference: pendingPayment.reference || tx_ref
              });
              
              setShowSuccessModal(true);
              
              if (result.data?.type === 'subscription') {
                navigate('/billing?tab=subscription', { replace: true });
                setActiveTab('subscription');
              } else {
                navigate('/billing?tab=credits', { replace: true });
                setActiveTab('credits');
              }
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
            
            navigate('/billing', { replace: true });
          }
        });
      } else {
        throw new Error(`Payment status: ${status}. Transaction not successful.`);
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      toast({
        title: "Payment Verification Failed",
        description: error instanceof Error ? error.message : "Please contact support if payment was deducted",
        variant: "destructive"
      });
      
      navigate('/billing', { replace: true });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.')) {
      return;
    }

    cancelSubscription(undefined, {
      onSuccess: () => {
        toast({
          title: "Subscription Cancelled",
          description: "Your subscription has been cancelled. You'll retain access until the end of your billing period.",
        });
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: "Failed to cancel subscription",
          variant: "destructive"
        });
      }
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isVerifying) {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center bg-background">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Verifying Payment</h2>
            <p className="text-muted-foreground">
              Please wait while we confirm your payment and activate your plan...
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex-1 flex flex-col bg-background text-foreground">
        <div className="flex flex-col md:flex-row md:items-center justify-between p-4 md:p-6 border-b border-border bg-card">
          <div className="flex items-center gap-3 md:gap-4">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-semibold">Billing & Payments</h1>
            </div>
          </div>
        </div>
        
        <div className="flex-1 p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-1">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="subscription">Subscription</TabsTrigger>
              <TabsTrigger value="credits">Credits</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {billingDashboard ? (
                <>
                  {/* Current Status Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                    {/* Subscription Status */}
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
                        <Crown className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{billingDashboard?.billing?.plan_name || 'Free Plan'}</div>
                        <p className="text-xs text-muted-foreground">
                          {Number(billingDashboard?.billing?.plan_price || 0) > 0 ? (
                            <>
                              ${formatCurrency(billingDashboard?.billing?.plan_price)}/month
                              {billingDashboard?.billing?.current_period_end && (
                                <> • Renews {formatDate(billingDashboard.billing.current_period_end)}</>
                              )}
                            </>
                          ) : (
                            'Free tier'
                          )}
                        </p>
                        <div className="mt-2">
                          <Badge 
                            variant={billingDashboard?.billing?.subscription_status === 'active' ? 'default' : 'secondary'}
                          >
                            {billingDashboard?.billing?.subscription_status || 'inactive'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Credits Balance */}
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">AI Credits</CardTitle>
                        <Zap className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                          ${formatCurrency(billingDashboard?.billing?.available_credits)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          ${formatCurrency(billingDashboard?.billing?.total_purchased)} purchased • ${formatCurrency(billingDashboard?.billing?.total_used)} used
                        </p>
                        <Button size="sm" className="mt-2" onClick={() => setActiveTab('credits')}>
                          <Zap className="w-3 h-3 mr-1" />
                          Add Credits
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Total Spending */}
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          ${formatCurrency(billingDashboard?.billing?.total_spent)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {billingDashboard?.billing?.total_transactions || 0} transactions
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Quick Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                        <Button
                          variant="outline"
                          className="h-auto flex-col p-4 touch-manipulation"
                          onClick={() => setActiveTab('subscription')}
                        >
                          <Crown className="w-6 h-6 mb-2" />
                          <span className="font-medium">Upgrade Plan</span>
                          <span className="text-xs text-muted-foreground">Get more features</span>
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          className="h-auto flex-col p-4"
                          onClick={() => setActiveTab('credits')}
                        >
                          <Zap className="w-6 h-6 mb-2" />
                          <span className="font-medium">Buy Credits</span>
                          <span className="text-xs text-muted-foreground">Top up your balance</span>
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          className="h-auto flex-col p-4"
                          onClick={() => setActiveTab('history')}
                        >
                          <History className="w-6 h-6 mb-2" />
                          <span className="font-medium">View History</span>
                          <span className="text-xs text-muted-foreground">See all transactions</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Transactions */}
                  {(billingDashboard?.recentTransactions?.length || 0) > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 md:space-y-3">
                          {(billingDashboard?.recentTransactions || [])
                            .filter(transaction => transaction && typeof transaction === 'object')
                            .slice(0, 5)
                            .map((transaction) => (
                              <div key={transaction.id || Math.random()} className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium capitalize">{transaction.type || 'Unknown'}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {transaction.created_at ? new Date(transaction.created_at).toLocaleDateString() : 'Unknown date'}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-medium">
                                    ${formatCurrency(transaction.amount)}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Cancel Subscription Option */}
                  {billingDashboard?.billing?.subscription_status === 'active' && Number(billingDashboard?.billing?.plan_price || 0) > 0 && (
                    <Card className="border-red-200">
                      <CardHeader>
                        <CardTitle className="text-red-600">Danger Zone</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div>
                            <h3 className="font-medium">Cancel Subscription</h3>
                            <p className="text-sm text-muted-foreground">
                              Cancel your subscription and downgrade to the free plan
                            </p>
                          </div>
                          <Button variant="destructive" onClick={handleCancelSubscription}>
                            Cancel Plan
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : dashboardLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  <span>Loading billing information...</span>
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Failed to load billing information. Please refresh the page.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            {/* Subscription Tab */}
            <TabsContent value="subscription">
              <SubscriptionPlans 
                currentPlan={billingDashboard?.billing?.plan_name}
                onPlanSelect={() => refreshBillingData()}
              />
            </TabsContent>

            {/* Credits Tab */}
            <TabsContent value="credits">
              <CreditTopup onTopupComplete={() => refreshBillingData()} />
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history">
              <TransactionHistory />
            </TabsContent>
          </Tabs>
        </div>

        {/* Payment Success Modal */}
        <PaymentSuccessModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          paymentData={paymentSuccessData}
        />
      </div>
    </Layout>
  );
};

export default Billing;