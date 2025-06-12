import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ✅ OPTIMIZED: Reduced cache times for better performance
const CACHE_TIME = 1000 * 60 * 5; // 5 minutes
const STALE_TIME = 1000 * 60 * 2; // 2 minutes

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  rateToUSD: number;
  supportedMethods: string[];
}

// ✅ YOUR COMPLETE CURRENCY LIST (ALL OF THEM!)
export const SUPPORTED_CURRENCIES: Currency[] = [
  // A - I
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪', rateToUSD: 3.67, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'ALL', name: 'Albanian Lek', symbol: 'L', flag: '🇦🇱', rateToUSD: 93.45, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺', rateToUSD: 1.50, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'BGN', name: 'Bulgarian Lev', symbol: 'лв', flag: '🇧🇬', rateToUSD: 1.84, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'BHD', name: 'Bahraini Dinar', symbol: '.د.ب', flag: '🇧🇭', rateToUSD: 0.38, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'BND', name: 'Brunei Dollar', symbol: 'B$', flag: '🇧🇳', rateToUSD: 1.35, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦', rateToUSD: 1.37, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', flag: '🇨🇭', rateToUSD: 0.90, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'CLP', name: 'Chilean Peso', symbol: '$', flag: '🇨🇱', rateToUSD: 909.09, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳', rateToUSD: 7.25, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'COP', name: 'Colombian Peso', symbol: '$', flag: '🇨🇴', rateToUSD: 4000, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'CRC', name: 'Costa Rican Colón', symbol: '₡', flag: '🇨🇷', rateToUSD: 526.32, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč', flag: '🇨🇿', rateToUSD: 23.0, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr', flag: '🇩🇰', rateToUSD: 6.87, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'DOP', name: 'Dominican Peso', symbol: 'RD$', flag: '🇩🇴', rateToUSD: 58.82, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'DZD', name: 'Algerian Dinar', symbol: 'د.ج', flag: '🇩🇿', rateToUSD: 135.14, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'EGP', name: 'Egyptian Pound', symbol: '£', flag: '🇪🇬', rateToUSD: 47.62, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', rateToUSD: 0.92, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'GBP', name: 'British Pound Sterling', symbol: '£', flag: '🇬🇧', rateToUSD: 0.79, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵', flag: '🇬🇭', rateToUSD: 15.0, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'GMD', name: 'Gambian Dalasi', symbol: 'D', flag: '🇬🇲', rateToUSD: 69.0, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'GTQ', name: 'Guatemalan Quetzal', symbol: 'Q', flag: '🇬🇹', rateToUSD: 7.77, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', flag: '🇭🇰', rateToUSD: 7.82, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'HNL', name: 'Honduran Lempira', symbol: 'L', flag: '🇭🇳', rateToUSD: 24.69, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft', flag: '🇭🇺', rateToUSD: 370.37, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', flag: '🇮🇩', rateToUSD: 16393.44, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'ILS', name: 'Israeli New Shekel', symbol: '₪', flag: '🇮🇱', rateToUSD: 3.72, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳', rateToUSD: 83.33, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'IQD', name: 'Iraqi Dinar', symbol: 'ع.د', flag: '🇮🇶', rateToUSD: 1315.79, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'ISK', name: 'Icelandic Króna', symbol: 'kr', flag: '🇮🇸', rateToUSD: 138.89, supportedMethods: ['card', 'applepay', 'googlepay'] },

  // J - M
  { code: 'JOD', name: 'Jordanian Dinar', symbol: 'د.ا', flag: '🇯🇴', rateToUSD: 0.71, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵', rateToUSD: 156.25, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', flag: '🇰🇪', rateToUSD: 129.87, supportedMethods: ['card'] },
  { code: 'KHR', name: 'Cambodian Riel', symbol: '៛', flag: '🇰🇭', rateToUSD: 4166.67, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', flag: '🇰🇷', rateToUSD: 1369.86, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'د.ك', flag: '🇰🇼', rateToUSD: 0.31, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'LBP', name: 'Lebanese Pound', symbol: 'ل.ل', flag: '🇱🇧', rateToUSD: 90909.09, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'LKR', name: 'Sri Lankan Rupee', symbol: 'Rs', flag: '🇱🇰', rateToUSD: 303.03, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'LYD', name: 'Libyan Dinar', symbol: 'ل.د', flag: '🇱🇾', rateToUSD: 4.84, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'MAD', name: 'Moroccan Dirham', symbol: 'د.م.', flag: '🇲🇦', rateToUSD: 10.02, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'MOP', name: 'Macanese Pataca', symbol: 'MOP$', flag: '🇲🇴', rateToUSD: 8.08, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', flag: '🇲🇾', rateToUSD: 4.70, supportedMethods: ['card', 'applepay', 'googlepay'] },

  // N - S
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', flag: '🇳🇬', rateToUSD: 1492.54, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', flag: '🇳🇴', rateToUSD: 10.58, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', flag: '🇳🇿', rateToUSD: 1.63, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'OMR', name: 'Omani Rial', symbol: 'ر.ع.', flag: '🇴🇲', rateToUSD: 0.38, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'PAB', name: 'Panamanian Balboa', symbol: 'B/.', flag: '🇵🇦', rateToUSD: 1.00, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱', flag: '🇵🇭', rateToUSD: 58.82, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'PYG', name: 'Paraguayan Guarani', symbol: '₲', flag: '🇵🇾', rateToUSD: 7692.31, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'QAR', name: 'Qatari Rial', symbol: 'ر.ق', flag: '🇶🇦', rateToUSD: 3.65, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'ر.س', flag: '🇸🇦', rateToUSD: 3.75, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', flag: '🇸🇪', rateToUSD: 10.44, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬', rateToUSD: 1.35, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'SLL', name: 'Sierra Leonean Leone', symbol: 'Le', flag: '🇸🇱', rateToUSD: 20408.16, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'SVC', name: 'Salvadoran Colón', symbol: '₡', flag: '🇸🇻', rateToUSD: 8.75, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'SYP', name: 'Syrian Pound', symbol: '£S', flag: '🇸🇾', rateToUSD: 2500, supportedMethods: ['applepay', 'googlepay'] },

  // T - Z
  { code: 'THB', name: 'Thai Baht', symbol: '฿', flag: '🇹🇭', rateToUSD: 36.76, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'TND', name: 'Tunisian Dinar', symbol: 'د.ت', flag: '🇹🇳', rateToUSD: 3.12, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'TWD', name: 'New Taiwan Dollar', symbol: 'NT$', flag: '🇹🇼', rateToUSD: 32.47, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh', flag: '🇹🇿', rateToUSD: 2631.58, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh', flag: '🇺🇬', rateToUSD: 3846.15, supportedMethods: ['card', 'googlepay'] },
  { code: 'USD', name: 'United States Dollar', symbol: '$', flag: '🇺🇸', rateToUSD: 1.00, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', flag: '🇻🇳', rateToUSD: 25641.03, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'YER', name: 'Yemeni Rial', symbol: '﷼', flag: '🇾🇪', rateToUSD: 256.41, supportedMethods: ['card', 'applepay', 'googlepay'] },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', flag: '🇿🇦', rateToUSD: 18.87, supportedMethods: ['card'] },
  { code: 'ZMW', name: 'Zambian Kwacha', symbol: 'ZK', flag: '🇿🇲', rateToUSD: 26.32, supportedMethods: ['card', 'applepay', 'googlepay'] }
];

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

export const usePayment = () => {
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const getAuthHeaders = useCallback(() => {
    const token = session?.access_token || localStorage.getItem('access_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }, [session?.access_token]);

  const getCurrencyCountry = useCallback((currency: string): string => {
  const currencyToCountry: Record<string, string> = {
    'USD': 'US', 'EUR': 'DE', 'GBP': 'GB', 'NGN': 'NG', 'GHS': 'GH',
    'CAD': 'CA', 'AUD': 'AU', 'JPY': 'JP', 'CNY': 'CN', 'INR': 'IN',
    'ZAR': 'ZA', 'KES': 'KE', 'UGX': 'UG', 'TZS': 'TZ', 'AED': 'AE',
    'SAR': 'SA', 'EGP': 'EG', 'MAD': 'MA', 'DZD': 'DZ', 'TND': 'TN',
    'LYD': 'LY', 'ETB': 'ET', 'BWP': 'BW', 'MZN': 'MZ', 'ZMW': 'ZM',
    'MWK': 'MW', 'RWF': 'RW', 'BIF': 'BI', 'DJF': 'DJ', 'SOS': 'SO',
    'ERN': 'ER', 'STD': 'ST', 'CVE': 'CV', 'GMD': 'GM', 'GNF': 'GN',
    'LRD': 'LR', 'SLL': 'SL', 'CDF': 'CD', 'XAF': 'CM', 'XOF': 'SN',
    'THB': 'TH', 'VND': 'VN', 'IDR': 'ID', 'MYR': 'MY', 'SGD': 'SG',
    'PHP': 'PH', 'KRW': 'KR', 'HKD': 'HK', 'TWD': 'TW', 'BND': 'BN',
    'KHR': 'KH', 'LAK': 'LA', 'MMK': 'MM', 'NPR': 'NP', 'LKR': 'LK',
    'MVR': 'MV', 'BTN': 'BT', 'AFN': 'AF', 'PKR': 'PK', 'BDT': 'BD',
    'ILS': 'IL', 'JOD': 'JO', 'LBP': 'LB', 'SYP': 'SY', 'IQD': 'IQ',
    'IRR': 'IR', 'TRY': 'TR', 'AZN': 'AZ', 'GEL': 'GE', 'AMD': 'AM',
    'KZT': 'KZ', 'UZS': 'UZ', 'TJS': 'TJ', 'KGS': 'KG', 'TMT': 'TM',
    'MNT': 'MN', 'RUB': 'RU', 'BYN': 'BY', 'UAH': 'UA', 'MDL': 'MD',
    'PLN': 'PL', 'CZK': 'CZ', 'HUF': 'HU', 'RON': 'RO', 'BGN': 'BG',
    'HRK': 'HR', 'BAM': 'BA', 'RSD': 'RS', 'MKD': 'MK', 'ALL': 'AL',
    'NOK': 'NO', 'SEK': 'SE', 'DKK': 'DK', 'ISK': 'IS', 'CHF': 'CH',
    'CLP': 'CL', 'ARS': 'AR', 'BRL': 'BR', 'UYU': 'UY', 'PYG': 'PY',
    'BOB': 'BO', 'PEN': 'PE', 'COP': 'CO', 'VES': 'VE', 'GYD': 'GY',
    'SRD': 'SR', 'TTD': 'TT', 'JMD': 'JM', 'HTG': 'HT', 'DOP': 'DO',
    'CUP': 'CU', 'BSD': 'BS', 'BBD': 'BB', 'XCD': 'AG', 'BZD': 'BZ',
    'GTQ': 'GT', 'HNL': 'HN', 'NIO': 'NI', 'CRC': 'CR', 'PAB': 'PA',
    'MXN': 'MX', 'NZD': 'NZ', 'FJD': 'FJ', 'SBD': 'SB', 'VUV': 'VU',
    'TOP': 'TO', 'WST': 'WS', 'PGK': 'PG', 'NCF': 'NC', 'XPF': 'PF'
  };
  return currencyToCountry[currency.toUpperCase()] || 'NG'; // Default to Nigeria
}, []);


  // ✅ OPTIMIZED: Single dashboard query that fetches everything
  const { data: dashboardData, isLoading, refetch } = useQuery({
    queryKey: ['paymentDashboard'] as const,
    queryFn: async () => {
      if (!session?.access_token) return null;

      const response = await fetch(`${API_URL}/api/payment/dashboard-complete`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payment dashboard');
      }

      const result = await response.json();
      return result.data;
    },
    gcTime: CACHE_TIME,
    staleTime: STALE_TIME,
    enabled: !!session?.access_token,
    refetchOnWindowFocus: false,
    retry: 1 // ✅ OPTIMIZED: Reduce retries
  });

  // ✅ OPTIMIZED: Combined subscription and payment flow
const { mutate: subscribeToPlan, isPending: isSubscribing } = useMutation({
  mutationFn: async ({ planId, currency = 'USD' }: { planId: string; currency?: string }) => {
    if (!session?.access_token) throw new Error('Not authenticated');

    console.log('🔄 Starting subscription flow for plan:', { planId, currency });

    // Step 1: Subscribe to plan
    const subscriptionRes = await fetch(`${API_URL}/api/payment/subscription`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ planId })
    });

    if (!subscriptionRes.ok) {
      throw new Error('Failed to create subscription');
    }

    const subscriptionResult = await subscriptionRes.json();
    console.log('📋 Subscription response:', subscriptionResult);

    // Step 2: Check if payment is required
    if (subscriptionResult.success && subscriptionResult.data?.requiresPayment === true) {
      console.log('💳 Payment required - initiating payment in currency:', currency);
      
      // Step 3: Initiate payment in user's selected currency
      const paymentRes = await fetch(`${API_URL}/api/payment/initiate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          type: 'subscription',
          planId: subscriptionResult.data.planId,
          currency: currency.toUpperCase(), // ✅ User's selected currency
          redirectUrl: `${window.location.origin}/billing?payment=callback`,
          country: getCurrencyCountry(currency) // ✅ Get country from currency
        })
      });

      if (!paymentRes.ok) {
        throw new Error('Failed to initiate payment');
      }

      const paymentResult = await paymentRes.json();
      console.log('🚀 Payment initiated in', currency, ':', paymentResult);

      if (paymentResult.success && paymentResult.data?.paymentUrl) {
        // Store payment data
        localStorage.setItem('pendingPayment', JSON.stringify({
          reference: paymentResult.data.reference,
          transaction_id: paymentResult.data.transaction_id,
          type: 'subscription',
          amount: paymentResult.data.amountLocal,
          currency: paymentResult.data.currency,
          planId
        }));

        // Redirect to payment
        window.location.href = paymentResult.data.paymentUrl;
        return { redirected: true };
      }
    } else {
      // Free plan activated
      console.log('✅ Free plan activated');
      return { activated: true };
    }

    return subscriptionResult.data;
  },
  onSuccess: (data) => {
    if (!data.redirected) {
      // Only refresh if not redirecting
      queryClient.invalidateQueries({ queryKey: ['paymentDashboard'] });
    }
  },
  retry: 1
});

// ✅ Helper function to get country from currency

  // ✅ OPTIMIZED: Credit top-up flow
const { mutate: topUpCredits, isPending: isToppingUp } = useMutation({
  mutationFn: async ({ amount, currency }: { amount: number; currency: string }) => {
    if (!session?.access_token) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/api/payment/initiate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        type: 'topup',
        amount,
        currency: currency.toUpperCase(), // ✅ Send user's selected currency
        redirectUrl: `${window.location.origin}/billing?payment=callback`,
        country: getCurrencyCountry(currency) // ✅ FIX: Use the function!
      })
    });

    if (!response.ok) {
      throw new Error('Failed to initiate top-up');
    }

    const result = await response.json();
    
    if (result.success && result.data?.paymentUrl) {
      localStorage.setItem('pendingPayment', JSON.stringify({
        reference: result.data.reference,
        transaction_id: result.data.transaction_id,
        type: 'topup',
        amount: result.data.amountLocal,
        currency: result.data.currency
      }));

      window.location.href = result.data.paymentUrl;
    }

    return result.data;
  },
  retry: 1
});



  // ✅ OPTIMIZED: Payment verification
  const { mutate: verifyPayment, isPending: isVerifying } = useMutation({
    mutationFn: async ({ transaction_id, tx_ref, status }: {
      transaction_id?: string;
      tx_ref?: string;
      status?: string;
    }) => {
      const token = session?.access_token || localStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('Not authenticated - please sign in again');
      }

      const response = await fetch(`${API_URL}/api/payment/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ transaction_id, tx_ref, status })
      });

      if (!response.ok) {
        throw new Error('Failed to verify payment');
      }

      return response.json();
    },
    onSuccess: () => {
      // Clear pending payment
      localStorage.removeItem('pendingPayment');
      // Refresh all data
      queryClient.invalidateQueries({ queryKey: ['paymentDashboard'] });
    },
    retry: 1
  });

  // Cancel subscription
  const { mutate: cancelSubscription, isPending: isCancelling } = useMutation({
    mutationFn: async () => {
      if (!session?.access_token) throw new Error('Not authenticated');

      const response = await fetch(`${API_URL}/api/payment/subscription`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentDashboard'] });
    },
    retry: 1
  });

  // ✅ YOUR PRECIOUS LOCAL CURRENCY CALCULATOR FUNCTIONS (ALL OF THEM!)
  const calculateLocalAmount = useCallback((usdAmount: number, currency: string): string => {
    const currencyData = SUPPORTED_CURRENCIES.find(c => c.code === currency);
    if (!currencyData) return usdAmount.toFixed(2);
    
    const localAmount = usdAmount * currencyData.rateToUSD;
    return localAmount.toFixed(2);
  }, []);

  const calculateUSDAmount = useCallback((localAmount: number, currency: string): number => {
    const currencyData = SUPPORTED_CURRENCIES.find(c => c.code === currency);
    if (!currencyData) return localAmount;
    
    return localAmount / currencyData.rateToUSD;
  }, []);

  // ✅ CURRENCY CONVERTER FUNCTIONS (YOUR FULL SET!)
  const convertCurrency = useCallback((amount: number, fromCurrency: string, toCurrency: string): number => {
    const from = SUPPORTED_CURRENCIES.find(c => c.code === fromCurrency);
    const to = SUPPORTED_CURRENCIES.find(c => c.code === toCurrency);

    if (!from || !to) {
      throw new Error(`Unsupported currency: ${!from ? fromCurrency : toCurrency}`);
    }

    // Convert to USD first, then to target currency
    const usdAmount = amount / from.rateToUSD;
    return usdAmount * to.rateToUSD;
  }, []);

  const getSupportedPaymentMethods = useCallback((currency: string): string[] => {
    const currencyData = SUPPORTED_CURRENCIES.find(c => c.code === currency);
    return currencyData?.supportedMethods || ['card'];
  }, []);

  const getCurrencySymbol = useCallback((currency: string): string => {
    const currencyData = SUPPORTED_CURRENCIES.find(c => c.code === currency);
    return currencyData?.symbol || currency.toUpperCase();
  }, []);

  const getCurrencyName = useCallback((currency: string): string => {
    const currencyData = SUPPORTED_CURRENCIES.find(c => c.code === currency);
    return currencyData?.name || currency.toUpperCase();
  }, []);

  const formatCurrency = useCallback((amount: number, currency: string): string => {
    const symbol = getCurrencySymbol(currency);
    return `${symbol}${amount.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  }, [getCurrencySymbol]);

  const calculatePlatformFee = useCallback((amount: number, currency: string, feePercentage: number = 0.15) => {
    const feeAmount = amount * feePercentage;
    const netAmount = amount - feeAmount;
    
    return {
      feeAmount,
      feeInUSD: calculateUSDAmount(feeAmount, currency),
      netAmount,
      netInUSD: calculateUSDAmount(netAmount, currency)
    };
  }, [calculateUSDAmount]);

  return {
    // ✅ SIMPLIFIED: Direct access to data
    plans: dashboardData?.plans || [],
    subscription: dashboardData?.subscription,
    credits: dashboardData?.credits,
    billingDashboard: dashboardData?.dashboard,
    transactions: dashboardData?.dashboard?.recentTransactions || [],
    
    // Loading states
    isLoading,
    dashboardLoading: isLoading,
    isSubscribing,
    isToppingUp,
    isVerifying,
    isCancelling,
    
    // Error
    error,
    
    // Actions
    createSubscription: subscribeToPlan,
    initiatePayment: topUpCredits,
    verifyPayment,
    cancelSubscription,
    refreshBillingData: refetch,

      getCurrencyCountry,

    
    // Legacy methods (for backward compatibility)
    getPlans: () => Promise.resolve(dashboardData?.plans || []),
    getSubscription: () => Promise.resolve(dashboardData?.subscription),
    getCredits: () => Promise.resolve(dashboardData?.credits),
    getBillingDashboard: () => Promise.resolve(dashboardData?.dashboard),
    getTransactions: () => Promise.resolve(dashboardData?.dashboard?.recentTransactions || []),
    
    // ✅ ALL YOUR PRECIOUS CURRENCY FUNCTIONS (EVERY SINGLE ONE!)
    calculateLocalAmount,
    calculateUSDAmount,
    convertCurrency,
    getSupportedPaymentMethods,
    getCurrencySymbol,
    getCurrencyName,
    formatCurrency,
    calculatePlatformFee,
    
    // Utilities
    setError,
    
    // ✅ CURRENCY DATA ACCESS
    supportedCurrencies: SUPPORTED_CURRENCIES,
    isCurrencySupported: (currency: string) => SUPPORTED_CURRENCIES.some(c => c.code === currency)
  };
};