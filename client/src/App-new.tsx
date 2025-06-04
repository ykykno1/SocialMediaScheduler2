import { QueryClientProvider } from "@tanstack/react-query";
import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "@/hooks/useAuth-clean";
import { queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

// Pages
import AuthPage from "@/pages/auth-new";
import HomePage from "@/pages/home-new";
import NotFound from "@/pages/not-found";

function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

function AppRouter() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-gray-600">טוען...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Public route for authentication */}
      <Route path="/auth" component={AuthPage} />
      
      {/* Protected routes */}
      {isAuthenticated ? (
        <>
          <Route path="/" component={HomePage} />
          {/* Add more protected routes here */}
          <Route component={NotFound} />
        </>
      ) : (
        /* Redirect unauthenticated users to auth page */
        <Route>
          {() => {
            window.location.href = "/auth";
            return null;
          }}
        </Route>
      )}
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <div className="app" dir="rtl">
        <AppRouter />
        <Toaster />
      </div>
    </AuthProvider>
  );
}

export default App;