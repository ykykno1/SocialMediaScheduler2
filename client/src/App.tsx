import { Switch, Route, Link, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth";
import Dashboard from "@/components/Dashboard";
import Settings from "@/components/Settings";
import History from "@/components/History";
import PrivacyPolicyPage from "@/pages/privacy-policy";
import DataDeletionPage from "@/pages/data-deletion";
import { Button } from "@/components/ui/button";
import { Home, Settings as SettingsIcon, History as HistoryIcon, LogOut, User, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

// Custom navbar component directly in App.tsx
function Navbar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    {
      label: "בית",
      href: "/",
      icon: <Home className="h-4 w-4 mr-2" />,
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
    <nav className="flex flex-wrap items-center justify-between gap-2 mb-4">
      <div className="flex flex-wrap items-center gap-2">
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
      </div>
      
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4" />
          <span>{user?.firstName || user?.username}</span>
          {user?.accountType === 'premium' && (
            <Crown className="h-4 w-4 text-yellow-500" />
          )}
          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
            {user?.accountType === 'premium' ? 'פרימיום' : 'חינמי'}
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={logout}>
          <LogOut className="h-4 w-4 mr-2" />
          התנתק
        </Button>
      </div>
    </nav>
  );
}

function AuthenticatedApp() {
  return (
    <div className="container px-4 mx-auto max-w-6xl min-h-screen flex flex-col">
      <header className="py-4">
        <h1 className="text-3xl font-bold text-primary mb-4">רובוט שבת</h1>
        <Navbar />
      </header>
      
      <main className="flex-1 py-4">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/settings" component={Settings} />
          <Route path="/history" component={History} />
          <Route path="/privacy-policy" component={PrivacyPolicyPage} />
          <Route path="/data-deletion" component={DataDeletionPage} />
          <Route component={NotFound} />
        </Switch>
      </main>
      
      <footer className="py-4 text-sm text-muted-foreground text-center border-t">
        © {new Date().getFullYear()} רובוט שבת - כל הזכויות שמורות
      </footer>
    </div>
  );
}

function Router() {
  const { isAuthenticated } = useAuth();

  // Show auth page for non-authenticated users
  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/privacy-policy" component={PrivacyPolicyPage} />
        <Route path="/data-deletion" component={DataDeletionPage} />
        <Route component={AuthPage} />
      </Switch>
    );
  }

  // Show authenticated app
  return <AuthenticatedApp />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Router />
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
