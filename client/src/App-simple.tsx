import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import HomePage from "@/pages/home-simple";
import YouTubePage from "@/pages/youtube-simple";
import NotFoundPage from "@/pages/not-found";

function App() {
  return (
    <div className="min-h-screen">
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/youtube" component={YouTubePage} />
        <Route component={NotFoundPage} />
      </Switch>
      <Toaster />
    </div>
  );
}

export default App;