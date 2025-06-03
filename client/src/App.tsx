import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import HomePage from "@/pages/home";
import PricingPage from "@/pages/pricing";
import AdminPage from "@/pages/admin";
import PlatformPage from "@/pages/platform";
import PlatformsPage from "@/pages/platforms";
import PrivacyPolicyPage from "@/pages/privacy-policy";
import DataDeletionPage from "@/pages/data-deletion";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/pricing" component={PricingPage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/platform" component={PlatformsPage} />
      <Route path="/platform/:platform" component={PlatformPage} />
      <Route path="/privacy-policy" component={PrivacyPolicyPage} />
      <Route path="/data-deletion" component={DataDeletionPage} />
      <Route component={NotFound} />
    </Switch>
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
