import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Home, Settings, History, TestTube, Clock } from "lucide-react";
import { useState, useEffect } from "react";

const Navbar = () => {
  const [location] = useLocation();
  const [showDebugPages, setShowDebugPages] = useState(() => {
    return localStorage.getItem('showDebugPages') === 'true';
  });

  useEffect(() => {
    const handleDebugToggle = (event: CustomEvent) => {
      setShowDebugPages(event.detail.showDebugPages);
    };

    const handleStorageChange = () => {
      setShowDebugPages(localStorage.getItem('showDebugPages') === 'true');
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // User returned to tab, check localStorage again
        setShowDebugPages(localStorage.getItem('showDebugPages') === 'true');
      }
    };

    window.addEventListener('debugPagesToggle', handleDebugToggle as EventListener);
    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleStorageChange);
    
    return () => {
      window.removeEventListener('debugPagesToggle', handleDebugToggle as EventListener);
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleStorageChange);
    };
  }, []);

  const baseNavItems = [
    {
      label: "בית",
      href: "/",
      icon: <Home className="h-4 w-4 mr-2" />,
    },
    {
      label: "הגדרות",
      href: "/settings",
      icon: <Settings className="h-4 w-4 mr-2" />,
    },
    {
      label: "היסטוריה",
      href: "/history",
      icon: <History className="h-4 w-4 mr-2" />,
    },
  ];

  const debugNavItems = [
    {
      label: "בדיקת סקדולר",
      href: "/test-scheduler",
      icon: <TestTube className="h-4 w-4 mr-2" />,
    },
    {
      label: "הגדרות תזמון",
      href: "/timing-settings",
      icon: <Clock className="h-4 w-4 mr-2" />,
    },
  ];

  const navItems = showDebugPages 
    ? [...baseNavItems, ...debugNavItems]
    : baseNavItems;

  // Debug console log to see current state
  console.log('Navbar: showDebugPages =', showDebugPages, 'localStorage =', localStorage.getItem('showDebugPages'));

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
};

export default Navbar;