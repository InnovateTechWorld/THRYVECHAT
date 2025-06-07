import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { SUPPORTED_CURRENCIES, Currency } from '@/hooks/usePayment';

interface CurrencySelectorProps {
  selectedCurrency: string;
  onCurrencyChange: (currency: string) => void;
  usdAmount: number;
  showPaymentMethods?: boolean;
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  selectedCurrency,
  onCurrencyChange,
  usdAmount,
  showPaymentMethods = true
}) => {
  const selectedCurrencyData = SUPPORTED_CURRENCIES.find(c => c.code === selectedCurrency);
  
  const calculateLocalAmount = (currency: Currency) => {
    return (usdAmount * currency.rateToUSD).toFixed(2);
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'card': return '💳';
      case 'applepay': return '🍎';
      case 'googlepay': return '🟢';
      default: return '💳';
    }
  };

  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case 'card': return 'Cards';
      case 'applepay': return 'Apple Pay';
      case 'googlepay': return 'Google Pay';
      default: return method;
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Select Currency</label>
        <Select value={selectedCurrency} onValueChange={onCurrencyChange}>
          <SelectTrigger className="w-full">
            <SelectValue>
              {selectedCurrencyData && (
                <div className="flex items-center gap-2">
                  <span>{selectedCurrencyData.flag}</span>
                  <span>{selectedCurrencyData.symbol} {selectedCurrencyData.code}</span>
                  <span className="text-muted-foreground">- {selectedCurrencyData.name}</span>
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {SUPPORTED_CURRENCIES.map((currency) => (
              <SelectItem key={currency.code} value={currency.code}>
                <div className="flex items-center gap-2">
                  <span>{currency.flag}</span>
                  <span>{currency.symbol} {currency.code}</span>
                  <span className="text-muted-foreground">- {currency.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedCurrencyData && (
        <div className="p-4 bg-muted rounded-lg space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Amount:</span>
            <div className="text-right">
              <div className="font-medium">
                {selectedCurrencyData.symbol}{calculateLocalAmount(selectedCurrencyData)} {selectedCurrencyData.code}
              </div>
              <div className="text-sm text-muted-foreground">
                ≈ ${usdAmount.toFixed(2)} USD (gets you ${usdAmount.toFixed(2)} in AI credits)
              </div>
            </div>
          </div>

          {showPaymentMethods && (
            <div>
              <div className="text-sm font-medium mb-2">Available Payment Methods:</div>
              <div className="flex flex-wrap gap-2">
                {selectedCurrencyData.supportedMethods.map((method) => (
                  <Badge key={method} variant="outline" className="flex items-center gap-1">
                    <span>{getPaymentMethodIcon(method)}</span>
                    <span>{getPaymentMethodName(method)}</span>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};