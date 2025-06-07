import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../lib/api';

export interface Plan {
  id: string;
  name: string;
  price: number;
  credits: number;
  memory_limit: number;
  session_api_limit: number;
  context_api_limit: number;
  free_models_only: boolean;
}

export interface UserSubscription {
  subscription_id: string;
  plan_name: string;
  plan_price: number;
  credits: number;
  memory_limit: number;
  session_api_limit: number;
  context_api_limit: number;
  free_models_only: boolean;
  status: string;
  current_period_end: string;
}

export interface Credits {
  available_credits: number;
  total_purchased: number;
  total_used: number;
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  country: string;
  flag: string;
  rateToUSD: number;
  supportedMethods: string[];
}

export interface Transaction {
  id: string;
  flutterwave_reference: string;
  type: string;
  amount: number;
  currency: string;
  platform_fee: number;
  credit_amount: number;
  status: string;
  payment_method: string;
  created_at: string;
}

export interface BillingDashboard {
  billing: {
    user_id: string;
    email: string;
    plan_name: string;
    plan_price: number;
    subscription_status: string;
    current_period_end: string;
    available_credits: number;
    total_purchased: number;
    total_used: number;
    total_transactions: number;
    total_spent: number;
  };
  recentTransactions: Array<{
    id: string;
    type: string;
    amount: number;
    balance_after: number;
    description: string;
    created_at: string;
  }>;
}

// Currency data with country mapping
export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', country: 'US', flag: '🇺🇸', rateToUSD: 1, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'EUR', name: 'Euro', symbol: '€', country: 'DE', flag: '🇪🇺', rateToUSD: 0.85, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'GBP', name: 'British Pound', symbol: '£', country: 'GB', flag: '🇬🇧', rateToUSD: 0.73, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', country: 'CA', flag: '🇨🇦', rateToUSD: 1.35, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', country: 'AU', flag: '🇦🇺', rateToUSD: 1.50, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', country: 'NG', flag: '🇳🇬', rateToUSD: 1600, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵', country: 'GH', flag: '🇬🇭', rateToUSD: 15, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', country: 'KE', flag: '🇰🇪', rateToUSD: 140, supportedMethods: ['card'] },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', country: 'ZA', flag: '🇿🇦', rateToUSD: 18, supportedMethods: ['card'] },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', country: 'JP', flag: '🇯🇵', rateToUSD: 150, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', country: 'CN', flag: '🇨🇳', rateToUSD: 7.2, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', country: 'IN', flag: '🇮🇳', rateToUSD: 83, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', country: 'SG', flag: '🇸🇬', rateToUSD: 1.35, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', country: 'MY', flag: '🇲🇾', rateToUSD: 4.7, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', country: 'TH', flag: '🇹🇭', rateToUSD: 36, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱', country: 'PH', flag: '🇵🇭', rateToUSD: 56, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', country: 'AE', flag: '🇦🇪', rateToUSD: 3.67, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', country: 'SA', flag: '🇸🇦', rateToUSD: 3.75, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'EGP', name: 'Egyptian Pound', symbol: '£', country: 'EG', flag: '🇪🇬', rateToUSD: 31, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'MAD', name: 'Moroccan Dirham', symbol: 'د.م.', country: 'MA', flag: '🇲🇦', rateToUSD: 10, supportedMethods: ['card', 'applepay', 'googlepay'] },
];

export const usePayment = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuth();

  const getAuthHeaders = () => {
  const token = session?.access_token || localStorage.getItem('access_token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

  // Get all available plans
  const getPlans = async (): Promise<Plan[]> => {
    if (!session?.access_token) throw new Error('Not authenticated');

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/payment/plans`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch plans');
      }

      const result = await response.json();
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Get user's current subscription
  const getSubscription = async (): Promise<UserSubscription> => {
    if (!session?.access_token) throw new Error('Not authenticated');

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/payment/subscription`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch subscription');
      }

      const result = await response.json();
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Create or activate subscription
  const createSubscription = async (planId: string) => {
    if (!session?.access_token) throw new Error('Not authenticated');

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/payment/subscription`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ planId })
      });

      if (!response.ok) {
        throw new Error('Failed to create subscription');
      }

      const result = await response.json();
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel subscription
  const cancelSubscription = async () => {
    if (!session?.access_token) throw new Error('Not authenticated');

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/payment/subscription`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Get user's credits
  const getCredits = async (): Promise<Credits> => {
    if (!session?.access_token) throw new Error('Not authenticated');

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/payment/credits`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch credits');
      }

      const result = await response.json();
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Initiate payment
  const initiatePayment = async (type: 'subscription' | 'topup', amount: number, currency: string, planId?: string) => {
    if (!session?.access_token) throw new Error('Not authenticated');

    setIsLoading(true);
    setError(null);

    try {
      const currencyData = SUPPORTED_CURRENCIES.find(c => c.code === currency);
      if (!currencyData) throw new Error('Unsupported currency');

      const response = await fetch(`${API_URL}/api/payment/initiate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          type,
          amount,
          currency: currency.toUpperCase(),
          planId,
          redirectUrl: `${window.location.origin}/billing?payment=callback`,
          country: currencyData.country
        })
      });

      if (!response.ok) {
        throw new Error('Failed to initiate payment');
      }

      const result = await response.json();
      
      if (result.success) {
        // Store payment data for verification
        localStorage.setItem('pendingPayment', JSON.stringify({
          reference: result.data.reference,
          transaction_id: result.data.transaction_id,
          type,
          amount: result.data.amountLocal,
          currency: result.data.currency,
          amountUSD: result.data.amountUSD,
          planId
        }));

        // Redirect to payment URL
        window.location.href = result.data.paymentUrl;
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Verify payment
  const verifyPayment = async (transaction_id: string, tx_ref: string, status: string) => {
  // ✅ FIX: Use stored token as fallback when session is null
  const token = session?.access_token || localStorage.getItem('access_token');
  
  if (!token) {
    throw new Error('Not authenticated - please sign in again');
  }

  setIsLoading(true);
  setError(null);

  try {
    const response = await fetch(`${API_URL}/api/payment/verify`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        transaction_id,
        tx_ref,
        status
      })
    });

    if (!response.ok) {
      throw new Error('Failed to verify payment');
    }

    const result = await response.json();
    return result;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    setError(errorMessage);
    throw err;
  } finally {
    setIsLoading(false);
  }
};

  // Get transactions
  const getTransactions = async (): Promise<Transaction[]> => {
    if (!session?.access_token) throw new Error('Not authenticated');

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/payment/transactions`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const result = await response.json();
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Get billing dashboard
  const getBillingDashboard = async (): Promise<BillingDashboard> => {
    if (!session?.access_token) throw new Error('Not authenticated');

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/payment/dashboard`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch billing dashboard');
      }

      const result = await response.json();
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate local amount from USD
  const calculateLocalAmount = (usdAmount: number, currency: string): number => {
    const currencyData = SUPPORTED_CURRENCIES.find(c => c.code === currency);
    if (!currencyData) return usdAmount;
    return Number((usdAmount * currencyData.rateToUSD).toFixed(2));
  };

  // Calculate USD amount from local
  const calculateUSDAmount = (localAmount: number, currency: string): number => {
    const currencyData = SUPPORTED_CURRENCIES.find(c => c.code === currency);
    if (!currencyData) return localAmount;
    return Number((localAmount / currencyData.rateToUSD).toFixed(2));
  };

  return {
    isLoading,
    error,
    getPlans,
    getSubscription,
    createSubscription,
    cancelSubscription,
    getCredits,
    initiatePayment,
    verifyPayment,
    getTransactions,
    getBillingDashboard,
    calculateLocalAmount,
    calculateUSDAmount,
  };
};