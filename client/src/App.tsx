import { Switch, Route, Link, useLocation } from "wouter";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import PricingPage from "@/pages/pricing";
import YouTubePage from "@/pages/youtube";
import FacebookPage from "@/pages/facebook";
import InstagramPage from "@/pages/instagram";
import AdminPage from "@/pages/admin";
import AuthPage from "@/pages/auth";
import HomePage from "@/pages/home";
import Dashboard from "@/components/Dashboard";
import Settings from "@/components/Settings";
import SettingsPage from "@/pages/settings";
import History from "@/components/History";
import PrivacyPolicyPage from "@/pages/privacy-policy";
import DataDeletionPage from "@/pages/data-deletion";
import { Button } from "@/components/ui/button";
import { Home, Settings as SettingsIcon, History as HistoryIcon, LogIn, LogOut, CreditCard, Youtube, Facebook, Instagram } from "lucide-react";
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

  const navItems = [
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
      <div className="container px-4 mx-auto max-w-6xl min-h-screen flex flex-col">
        <header className="py-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-primary">רובוט שבת</h1>
            <UserProfile />
          </div>
        </header>
        
        <main className="flex-1 py-4">
          <Switch>
            <Route path="/auth" component={AuthPage} />
            <Route path="/privacy-policy" component={PrivacyPolicyPage} />
            <Route path="/data-deletion" component={DataDeletionPage} />
            <Route>
              <AuthPage />
            </Route>
          </Switch>
        </main>
        
        <footer className="py-4 text-sm text-muted-foreground text-center border-t">
          © {new Date().getFullYear()} רובוט שבת - כל הזכויות שמורות
        </footer>
      </div>
    );
  }

  return (
    <div className="container px-4 mx-auto max-w-6xl min-h-screen flex flex-col">
      <header className="py-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-primary">רובוט שבת</h1>
          <UserProfile />
        </div>
        <Navbar />
      </header>
      
      <main className="flex-1 py-4">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/pricing" component={PricingPage} />
          <Route path="/youtube" component={YouTubePage} />
          <Route path="/facebook" component={FacebookPage} />
          <Route path="/instagram" component={InstagramPage} />
          <Route path="/settings" component={SettingsPage} />
          <Route path="/history" component={History} />
          <Route path="/privacy-policy" component={PrivacyPolicyPage} />
          <Route path="/data-deletion" component={DataDeletionPage} />
          <Route path="/system-admin-secure-access" component={AdminPage} />
          <Route component={NotFound} />
        </Switch>
      </main>
      
      <footer className="py-4 text-sm text-muted-foreground text-center border-t">
        © {new Date().getFullYear()} רובוט שבת - כל הזכויות שמורות
      </footer>
    </div>
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
