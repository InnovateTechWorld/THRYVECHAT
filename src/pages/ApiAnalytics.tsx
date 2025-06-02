
import React from 'react';
import { useParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Activity, Database, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ApiAnalytics = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock data for the API
  const apiData = {
    id,
    name: id === '1' ? 'React Development Chat' : 'Full Profile Export',
    type: id === '1' ? 'conversation' : 'profile',
    model: id === '1' ? 'gpt-4' : 'claude',
    requests: id === '1' ? 45 : 12,
    createdAt: id === '1' ? new Date('2024-05-20') : new Date('2024-05-22'),
    status: 'active'
  };

  const memoryItems = [
    { id: 1, content: "User is building a React application", type: "project" },
    { id: 2, content: "Prefers TypeScript over JavaScript", type: "preference" },
    { id: 3, content: "Working on a fitness tracking app", type: "project" }
  ];

  const notes = [
    { id: 1, title: "Component Architecture", content: "Remember to use composition over inheritance" },
    { id: 2, title: "State Management", content: "Consider using Zustand for simple state needs" }
  ];

  const usageStats = [
    { date: '2024-05-20', requests: 5 },
    { date: '2024-05-21', requests: 12 },
    { date: '2024-05-22', requests: 8 },
    { date: '2024-05-23', requests: 15 },
    { date: '2024-05-24', requests: 5 }
  ];

  return (
    <Layout>
      <div className="flex-1 flex flex-col bg-white">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <Button variant="ghost" onClick={() => navigate('/exports')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Exports
            </Button>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-semibold">API Analytics</h1>
            </div>
          </div>
        </div>
        
        <div className="flex-1 p-6">
          <div className="space-y-6 max-w-6xl">
            {/* API Overview */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{apiData.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{apiData.model}</Badge>
                    <Badge variant="default">{apiData.status}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Total Requests</p>
                    <p className="text-2xl font-bold">{apiData.requests}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Type</p>
                    <p className="text-lg capitalize">{apiData.type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Created</p>
                    <p className="text-lg">{apiData.createdAt.toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Model</p>
                    <p className="text-lg">{apiData.model}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Usage Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Usage Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-end justify-between bg-gray-50 p-4 rounded">
                  {usageStats.map((stat, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <div 
                        className="bg-blue-500 w-8 rounded-t"
                        style={{ height: `${(stat.requests / 15) * 200}px` }}
                      ></div>
                      <p className="text-xs mt-2">{new Date(stat.date).getDate()}</p>
                      <p className="text-xs text-gray-600">{stat.requests}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-6">
              {/* Memory Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Memory Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {memoryItems.map((item) => (
                      <div key={item.id} className="p-3 bg-gray-50 rounded">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="text-xs">
                            {item.type}
                          </Badge>
                        </div>
                        <p className="text-sm">{item.content}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Associated Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {notes.map((note) => (
                      <div key={note.id} className="p-3 bg-gray-50 rounded">
                        <h4 className="font-medium text-sm mb-1">{note.title}</h4>
                        <p className="text-sm text-gray-600">{note.content}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ApiAnalytics;
