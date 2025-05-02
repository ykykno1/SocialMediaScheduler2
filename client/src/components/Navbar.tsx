import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Home, Settings, History } from "lucide-react";

const Navbar = () => {
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
      icon: <Settings className="h-4 w-4 mr-2" />,
    },
    {
      label: "היסטוריה",
      href: "/history",
      icon: <History className="h-4 w-4 mr-2" />,
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
};

export default Navbar;