
import React from 'react';
import { Layout } from '@/components/Layout';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CreditCard, Download, Zap } from 'lucide-react';

const Billing = () => {
  const currentPlan = {
    name: 'Developer',
    price: '$19/month',
    features: ['1000 API calls/month', 'All AI models', 'Priority support', 'Custom exports']
  };

  const usage = {
    apiCalls: { used: 750, limit: 1000 },
    exports: { used: 3, limit: 10 },
    storage: { used: 2.1, limit: 5 }
  };

  const invoices = [
    { id: '1', date: new Date('2024-05-01'), amount: '$19.00', status: 'paid' },
    { id: '2', date: new Date('2024-04-01'), amount: '$19.00', status: 'paid' },
    { id: '3', date: new Date('2024-03-01'), amount: '$19.00', status: 'paid' }
  ];

  return (
    <Layout>
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border bg-white">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-semibold">Billing & Tokens</h1>
            </div>
          </div>
        </div>
        
        <div className="flex-1 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Current Plan */}
            <Card className="border border-border">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Current Plan
                  <Badge className="bg-primary">{currentPlan.name}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">{currentPlan.price}</div>
                <ul className="space-y-1 text-sm text-muted-foreground mb-4">
                  {currentPlan.features.map((feature, index) => (
                    <li key={index}>• {feature}</li>
                  ))}
                </ul>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">Change Plan</Button>
                  <Button variant="outline" className="flex-1">Cancel Plan</Button>
                </div>
              </CardContent>
            </Card>

            {/* Token Balance */}
            <Card className="border border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Token Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">2,847 tokens</div>
                <p className="text-sm text-muted-foreground mb-4">
                  Tokens are used for API calls and AI model usage
                </p>
                <Button className="w-full">
                  <Zap className="w-4 h-4 mr-2" />
                  Add Tokens
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Usage */}
          <Card className="border border-border mb-6">
            <CardHeader>
              <CardTitle>Usage This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>API Calls</span>
                    <span>{usage.apiCalls.used}/{usage.apiCalls.limit}</span>
                  </div>
                  <Progress value={(usage.apiCalls.used / usage.apiCalls.limit) * 100} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>API Exports</span>
                    <span>{usage.exports.used}/{usage.exports.limit}</span>
                  </div>
                  <Progress value={(usage.exports.used / usage.exports.limit) * 100} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Storage (GB)</span>
                    <span>{usage.storage.used}/{usage.storage.limit}</span>
                  </div>
                  <Progress value={(usage.storage.used / usage.storage.limit) * 100} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Billing History */}
          <Card className="border border-border">
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div>
                      <p className="font-medium">{invoice.date.toLocaleDateString()}</p>
                      <p className="text-sm text-muted-foreground">{invoice.amount}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                        {invoice.status}
                      </Badge>
                      <Button size="sm" variant="ghost">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Billing;
