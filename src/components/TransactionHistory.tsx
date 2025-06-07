import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, Download, Loader2, ArrowUpRight, ArrowDownLeft, CreditCard } from 'lucide-react';
import { usePayment, Transaction } from '@/hooks/usePayment';
import { useToast } from '@/hooks/use-toast';

interface TransactionHistoryProps {
  limit?: number;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({ limit }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { getTransactions, isLoading } = usePayment();
  const { toast } = useToast();

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const transactionsData = await getTransactions();
      setTransactions(limit ? transactionsData.slice(0, limit) : transactionsData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load transaction history",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'successful':
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'subscription':
        return <CreditCard className="w-4 h-4" />;
      case 'topup':
      case 'purchase':
        return <ArrowUpRight className="w-4 h-4" />;
      case 'usage':
      case 'deduction':
        return <ArrowDownLeft className="w-4 h-4" />;
      default:
        return <History className="w-4 h-4" />;
    }
  };

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Loading transactions...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5" />
          Transaction History
          {limit && transactions.length > 0 && (
            <Badge variant="secondary">{transactions.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <History className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
              No transactions yet
            </h3>
            <p className="text-sm text-muted-foreground">
              Your payment history will appear here once you make your first transaction
            </p>
          </div>
        ) : (
          <ScrollArea className={limit ? "h-[400px]" : "h-[600px]"}>
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-full">
                      {getTypeIcon(transaction.type)}
                    </div>
                    <div>
                      <div className="font-medium capitalize">
                        {transaction.type} Payment
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(transaction.created_at)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Ref: {transaction.flutterwave_reference}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-medium">
                      {formatCurrency(transaction.amount, transaction.currency)}
                    </div>
                    {transaction.credit_amount > 0 && (
                      <div className="text-sm text-blue-600">
                        +${transaction.credit_amount.toFixed(2)} credits
                      </div>
                    )}
                    <div className="mt-1">
                      <Badge 
                        className={getStatusColor(transaction.status)}
                        variant="secondary"
                      >
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {limit && transactions.length > 0 && (
          <div className="mt-4 text-center">
            <Button variant="outline" size="sm">
              View All Transactions
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};