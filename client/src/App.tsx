import { Switch, Route, Link, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
// Removed auth for now - will add simple version
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import PricingPage from "@/pages/pricing";
import Dashboard from "@/components/Dashboard";
import Settings from "@/components/Settings";
import History from "@/components/History";
import PrivacyPolicyPage from "@/pages/privacy-policy";
import DataDeletionPage from "@/pages/data-deletion";
import { Button } from "@/components/ui/button";
import { Home, Settings as SettingsIcon, History as HistoryIcon, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";

// Custom navbar component directly in App.tsx
function Navbar() {
  const [location] = useLocation();

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
    {
      label: "כניסה",
      href: "/login",
      icon: <LogIn className="h-4 w-4 mr-2" />,
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

function Router() {
  return (
    <div className="container px-4 mx-auto max-w-6xl min-h-screen flex flex-col">
      <header className="py-4">
        <h1 className="text-3xl font-bold text-primary mb-4">רובוט שבת</h1>
        <Navbar />
      </header>
      
      <main className="flex-1 py-4">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/login" component={LoginPage} />
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
