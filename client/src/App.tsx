import React, { ReactNode, useState } from "react";
import { Switch, Route, Link, useLocation } from "wouter";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import PricingPage from "@/pages/pricing";
import YouTubePage from "@/pages/youtube-oauth";
import FacebookPage from "@/pages/facebook";
import InstagramPage from "@/pages/instagram";
import AdminPage from "@/pages/admin";
import AdminShabbatPage from "@/pages/admin-shabbat";
import AuthPage from "@/pages/auth";
import HomePage from "@/pages/home";
import LandingPage from "@/pages/landing";
import Dashboard from "@/components/Dashboard";
import Settings from "@/components/Settings";
import SettingsPage from "@/pages/settings";
import ProfilePage from "@/pages/profile";
import History from "@/components/History";
import PrivacyPolicyPage from "@/pages/privacy-policy";
import DataDeletionPage from "@/pages/data-deletion";
import TimingSettingsPage from "@/pages/timing-settings";
import TestScheduler from "@/pages/test-scheduler";
import AboutPage from "@/pages/about";
import SubscriptionPage from "@/pages/subscription";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Home, Settings as SettingsIcon, History as HistoryIcon, LogIn, LogOut, CreditCard, Youtube, Facebook, Instagram, Clock, TestTube } from "lucide-react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

// Hook for authentication
function useAuth() {
  const { toast } = useToast();
  
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/user"],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const headers: Record<string, string> = {};
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch("/api/user", { headers });
      if (response.status === 401) {
        return null;
      }
      if (!response.ok) {
        throw new Error("Failed to fetch user");
      }
      return response.json();
    },
    retry: false,
  });

  const logout = async () => {
    try {
      // Clear the JWT token from localStorage
      localStorage.removeItem('auth_token');
      queryClient.setQueryData(["/api/user"], null);
      queryClient.clear();
      toast({
        title: "התנתקת בהצלחה",
        description: "להתראות!",
      });
    } catch (error) {
      toast({
        title: "שגיאה בהתנתקות",
        description: "נסה שוב",
        variant: "destructive",
      });
    }
  };

  return {
    user: user || null,
    isLoading,
    isAuthenticated: !!user,
    logout,
  };
}

// Custom navbar component directly in App.tsx
function Navbar() {
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return null; // Don't show navigation if not authenticated
  }

  // Check if debug pages should be shown
  let showDebugPages = false;
  try {
    showDebugPages = localStorage.getItem('showDebugPages') === 'true';
  } catch (e) {
    console.error('localStorage error:', e);
  }

  const baseNavItems = [
    {
      label: "בית",
      href: "/",
      icon: <Home className="h-4 w-4 mr-2" />,
    },
    {
      label: "יוטיוב",
      href: "/youtube",
      icon: <Youtube className="h-4 w-4 mr-2" />,
    },
    {
      label: "פייסבוק",
      href: "/facebook",
      icon: <Facebook className="h-4 w-4 mr-2" />,
    },
    {
      label: "אינסטגרם",
      href: "/instagram",
      icon: <Instagram className="h-4 w-4 mr-2" />,
    },
    {
      label: "מחירים",
      href: "/pricing",
      icon: <CreditCard className="h-4 w-4 mr-2" />,
    },
    {
      label: "מנוי",
      href: "/subscription",
      icon: <CreditCard className="h-4 w-4 mr-2" />,
    },
    {
      label: "הגדרות",
      href: "/settings",
      icon: <SettingsIcon className="h-4 w-4 mr-2" />,
    },
    {
      label: "היסטוריה",
      href: "/history",
      icon: <HistoryIcon className="h-4 w-4 mr-2" />,
    },
  ];

  const debugNavItems = [
    {
      label: "בדיקת סקדולר",
      href: "/test-scheduler",
      icon: <TestTube className="h-4 w-4 mr-2" />,
    },
  ];

  const navItems = showDebugPages 
    ? [...baseNavItems, ...debugNavItems]
    : baseNavItems;

  return (
    <nav className="flex flex-wrap items-center gap-2 mb-4">
      {navItems.map((item) => (
        <Button
          key={item.href}
          variant={location === item.href ? "default" : "outline"}
          size="sm"
          className={cn(
            "flex items-center",
            location === item.href
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground"
          )}
          asChild
        >
          <Link href={item.href}>
            {item.icon}
            {item.label}
          </Link>
        </Button>
      ))}
    </nav>
  );
}

// User profile component with login/logout
function UserProfile() {
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  if (!isAuthenticated || !user) {
    return (
      <Button variant="outline" size="sm" asChild>
        <Link href="/auth">
          <LogIn className="h-4 w-4 mr-2" />
          התחבר
        </Link>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">
        שלום, {user.username || user.email}
      </span>
      <Button variant="outline" size="sm" onClick={handleLogout}>
        <LogOut className="h-4 w-4 mr-2" />
        התנתק
      </Button>
    </div>
  );
}

// Layout wrapper with dummy functions for the menu
function AppLayoutWrapper({ children }: { children: ReactNode }) {
  const [activeView, setActiveView] = useState('main');
  const [location, setLocation] = useLocation();
  
  const showSettings = () => setActiveView('settings');
  const showHistory = () => setActiveView('history');
  const showMain = () => setActiveView('main');

  // Reset to main view when location changes to home
  React.useEffect(() => {
    if (location === '/') {
      setActiveView('main');
    }
  }, [location]);

  return (
    <Layout onShowSettings={showSettings} onShowHistory={showHistory}>
      {activeView === 'settings' && <Settings />}
      {activeView === 'history' && <History />}
      {activeView === 'main' && children}
    </Layout>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/auth" component={AuthPage} />
        <Route path="/privacy-policy" component={PrivacyPolicyPage} />
        <Route path="/data-deletion" component={DataDeletionPage} />
        <Route path="/" component={LandingPage} />
        <Route component={LandingPage} />
      </Switch>
    );
  }

  return (
    <AppLayoutWrapper>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/profile" component={ProfilePage} />
        <Route path="/pricing" component={PricingPage} />
        <Route path="/subscription" component={SubscriptionPage} />
        <Route path="/youtube" component={YouTubePage} />
        <Route path="/facebook" component={FacebookPage} />
        <Route path="/instagram" component={InstagramPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/timing-settings" component={TimingSettingsPage} />
        <Route path="/test-scheduler" component={TestScheduler} />
        <Route path="/about" component={AboutPage} />
        <Route path="/privacy-policy" component={PrivacyPolicyPage} />
        <Route path="/data-deletion" component={DataDeletionPage} />
        <Route path="/system-admin-secure-access" component={AdminPage} />
        <Route path="/admin-shabbat-times" component={AdminShabbatPage} />
        <Route component={NotFound} />
      </Switch>
    </AppLayoutWrapper>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
