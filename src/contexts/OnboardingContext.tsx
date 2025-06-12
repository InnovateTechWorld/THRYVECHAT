import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { API_URL } from '@/lib/api';

interface OnboardingContextType {
  isOnboardingRequired: boolean;
  isCheckingOnboarding: boolean;
  currentStep: number;
  totalSteps: number;
  isNewUser: boolean;
  checkOnboardingStatus: () => Promise<void>;
  completeOnboarding: () => void;
  setCurrentStep: (step: number) => void;
  skipOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};

interface OnboardingProviderProps {
  children: React.ReactNode;
}

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({ children }) => {
  const [isOnboardingRequired, setIsOnboardingRequired] = useState(false);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [isNewUser, setIsNewUser] = useState(false);
  const totalSteps = 4; // Welcome, Memory/Notes, Subscription, Model Selection

  const { user, loading: authLoading, session } = useAuth();

  const checkOnboardingStatus = useCallback(async () => {
    // Don't check until auth is ready
    if (authLoading || !user || !session?.access_token) {
      return;
    }

    setIsCheckingOnboarding(true);

    try {
      console.log('🔍 Checking onboarding status for user:', user.id);
      
      // Check if user has completed onboarding before
      const onboardingComplete = localStorage.getItem(`onboarding_complete_${user.id}`);
      
      if (onboardingComplete === 'true') {
        console.log('✅ User has already completed onboarding');
        setIsOnboardingRequired(false);
        setIsCheckingOnboarding(false);
        return;
      }

      // Make API calls to check user data
      const headers = {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      };

      // Check memories and subscription in parallel
      const [memoriesResponse, subscriptionResponse] = await Promise.allSettled([
        fetch(`${API_URL}/memory`, { headers }),
        fetch(`${API_URL}/api/payment/dashboard-complete`, { headers })
      ]);

      let hasMemories = false;
      let hasActiveSubscription = false;

      // Check memories
      if (memoriesResponse.status === 'fulfilled' && memoriesResponse.value.ok) {
        const memories = await memoriesResponse.value.json();
        hasMemories = Array.isArray(memories) && memories.length > 0;
        console.log('📝 User has memories:', hasMemories, memories?.length || 0);
      } else {
        console.log('⚠️ Failed to fetch memories:', memoriesResponse);
      }

      // Check subscription
      if (subscriptionResponse.status === 'fulfilled' && subscriptionResponse.value.ok) {
        const dashboardData = await subscriptionResponse.value.json();
        const subscription = dashboardData?.data?.subscription;
        hasActiveSubscription = subscription && subscription.status === 'active';
        console.log('💳 User has active subscription:', hasActiveSubscription, subscription?.status);
      } else {
        console.log('⚠️ Failed to fetch subscription:', subscriptionResponse);
      }

      // User is new if they have NO memories AND NO active subscription
      const userIsNew = !hasMemories && !hasActiveSubscription;
      
      console.log('🆔 User analysis:', {
        hasMemories,
        hasActiveSubscription,
        userIsNew
      });
      
      setIsNewUser(userIsNew);
      setIsOnboardingRequired(userIsNew);
      
      // If user has memories or active subscription, mark onboarding as complete
      if (!userIsNew) {
        localStorage.setItem(`onboarding_complete_${user.id}`, 'true');
        console.log('✅ Marking onboarding as complete for existing user');
      } else {
        console.log('🆕 New user detected - onboarding required');
      }
    } catch (error) {
      console.error('❌ Error checking onboarding status:', error);
      // On error, don't show onboarding to avoid blocking the user
      setIsOnboardingRequired(false);
    } finally {
      setIsCheckingOnboarding(false);
    }
  }, [user, authLoading, session?.access_token]);

  const completeOnboarding = useCallback(() => {
    if (user) {
      console.log('🎉 Completing onboarding for user:', user.id);
      localStorage.setItem(`onboarding_complete_${user.id}`, 'true');
      setIsOnboardingRequired(false);
      setCurrentStep(0);
    }
  }, [user]);

  const skipOnboarding = useCallback(() => {
    if (user) {
      console.log('⏭️ Skipping onboarding for user:', user.id);
      localStorage.setItem(`onboarding_complete_${user.id}`, 'true');
      setIsOnboardingRequired(false);
      setCurrentStep(0);
    }
  }, [user]);

  useEffect(() => {
    checkOnboardingStatus();
  }, [checkOnboardingStatus]);

  const value: OnboardingContextType = {
    isOnboardingRequired,
    isCheckingOnboarding,
    currentStep,
    totalSteps,
    isNewUser,
    checkOnboardingStatus,
    completeOnboarding,
    setCurrentStep,
    skipOnboarding,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};