import { QueryClientProvider } from "@tanstack/react-query";
import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

// Pages
import AuthPage from "@/pages/auth-new";
import HomePage from "@/pages/home-new";
import NotFound from "@/pages/not-found";

function App() {
  const [location] = useLocation();
  const { user, isLoading, isAuthenticated } = useAuth();

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
            <p className="text-gray-600">טוען...</p>
          </div>
        </div>
        <Toaster />
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="app" dir="rtl">
        <Switch>
          <Route path="/auth">
            {isAuthenticated ? <HomePage /> : <AuthPage />}
          </Route>

          <Route path="/">
            {isAuthenticated ? <HomePage /> : <AuthPage />}
          </Route>

          <Route component={NotFound} />
        </Switch>
        <Toaster />
      </div>
    </QueryClientProvider>
  );
}

export default App;