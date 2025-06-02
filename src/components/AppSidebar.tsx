
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  MessageSquare,
  FileText,
  Clock,
  Brain,
  Download,
  BarChart3,
  Link as LinkIcon,
  Settings,
  Zap,
  CreditCard,
  LogOut,
  Bot
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const navigationItems = [
  {
    title: 'Chat',
    url: '/chat',
    icon: MessageSquare,
    description: 'AI Conversations'
  },
  {
    title: 'Models',
    url: '/models',
    icon: Bot,
    description: 'AI Models'
  },
  {
    title: 'Notes',
    url: '/notes',
    icon: FileText,
    description: 'Saved Thoughts'
  },
  {
    title: 'Sessions',
    url: '/sessions',
    icon: Clock,
    description: 'Chat History'
  },
  {
    title: 'Memory',
    url: '/memory',
    icon: Brain,
    description: 'User Context'
  },
];

const managementItems = [
  {
    title: 'Export APIs',
    url: '/exports',
    icon: Download,
    description: 'API Endpoints'
  },
  {
    title: 'API Usage',
    url: '/usage',
    icon: BarChart3,
    description: 'Analytics'
  },
  {
    title: 'Connected Apps',
    url: '/connected',
    icon: LinkIcon,
    description: 'Integrations'
  },
  {
    title: 'Billing',
    url: '/billing',
    icon: CreditCard,
    description: 'Account'
  },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <Sidebar className="border-r border-border bg-white">
      <SidebarHeader className="border-b border-border p-4 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-sm text-gray-900">Echo Verse</h2>
            <p className="text-xs text-gray-600">AI Flow</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-2 bg-white">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-gray-600 px-2 py-2">
            Workspace
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link 
                        to={item.url}
                        className={cn(
                          "flex items-center gap-3 px-2 py-2 rounded-lg transition-all duration-200",
                          isActive 
                            ? "bg-primary/10 text-primary border border-primary/20" 
                            : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                        )}
                      >
                        <item.icon className="w-4 h-4" />
                        <div className="flex-1">
                          <span className="text-sm font-medium">{item.title}</span>
                          <p className="text-xs text-gray-500">{item.description}</p>
                        </div>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-gray-600 px-2 py-2">
            Management
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {managementItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link 
                        to={item.url}
                        className={cn(
                          "flex items-center gap-3 px-2 py-2 rounded-lg transition-all duration-200",
                          isActive 
                            ? "bg-primary/10 text-primary border border-primary/20" 
                            : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                        )}
                      >
                        <item.icon className="w-4 h-4" />
                        <div className="flex-1">
                          <span className="text-sm font-medium">{item.title}</span>
                          <p className="text-xs text-gray-500">{item.description}</p>
                        </div>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link
                    to="/settings"
                    className={cn(
                      "flex items-center gap-3 px-2 py-2 rounded-lg transition-all duration-200",
                      location.pathname === '/settings'
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                    )}
                  >
                    <Settings className="w-4 h-4" />
                    <div className="flex-1">
                      <span className="text-sm font-medium">Settings</span>
                      <p className="text-xs text-gray-500">Preferences</p>
                    </div>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {user && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-2 py-2 rounded-lg transition-all duration-200 hover:bg-red-50 text-gray-600 hover:text-red-600"
                    >
                      <LogOut className="w-4 h-4" />
                      <div className="flex-1 text-left">
                        <span className="text-sm font-medium">Sign Out</span>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
