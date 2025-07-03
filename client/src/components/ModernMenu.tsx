import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Menu, 
  X, 
  Settings, 
  History, 
  CreditCard, 
  Info, 
  LogOut, 
  User,
  Shield,
  HelpCircle
} from 'lucide-react';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/useAuth';

interface ModernMenuProps {
  onShowSettings: () => void;
  onShowHistory: () => void;
}

const ModernMenu: React.FC<ModernMenuProps> = ({ onShowSettings, onShowHistory }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const handleAction = (action: () => void) => {
    action();
    closeMenu();
  };

  const menuItems = [
    {
      icon: User,
      label: 'פרופיל משתמש',
      action: () => {}, // Will be handled by UserProfile component
      disabled: false
    },
    {
      icon: Settings,
      label: 'הגדרות',
      action: onShowSettings,
      disabled: false
    },
    {
      icon: History,
      label: 'היסטוריה',
      action: onShowHistory,
      disabled: false
    },
    {
      icon: CreditCard,
      label: 'מחירים ושדרוגים',
      action: () => window.location.href = '/pricing',
      disabled: false
    },
    {
      icon: Info,
      label: 'אודות האפליקציה',
      action: () => window.location.href = '/about',
      disabled: false
    },
    {
      icon: Shield,
      label: 'מדיניות פרטיות',
      action: () => window.location.href = '/privacy-policy',
      disabled: false
    },
    {
      icon: HelpCircle,
      label: 'עזרה ותמיכה',
      action: () => {}, // Will open help
      disabled: false
    },
    {
      icon: LogOut,
      label: 'התנתקות',
      action: logout,
      disabled: false,
      destructive: true
    }
  ];

  return (
    <>
      {/* Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleMenu}
        className="ios-button h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-secondary relative z-50"
      >
        {isOpen ? (
          <X className="h-5 w-5 transition-transform duration-200" />
        ) : (
          <Menu className="h-5 w-5 transition-transform duration-200" />
        )}
      </Button>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 ios-fade-in"
          onClick={closeMenu}
        />
      )}

      {/* Menu Panel */}
      <div className={`
        fixed top-0 right-0 h-full w-80 bg-background/95 backdrop-blur-xl border-l border-border z-50
        transform transition-transform duration-300 ease-out shadow-2xl
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        {/* Header */}
        <div className="px-6 py-6 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold ios-title text-foreground">תפריט</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={closeMenu}
              className="ios-button h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {user && (
            <div className="mt-4 p-3 bg-secondary/50 rounded-xl">
              <p className="text-sm ios-body text-muted-foreground">מחובר כ:</p>
              <p className="font-medium ios-title text-foreground">{user.email}</p>
              <p className="text-xs ios-caption text-muted-foreground mt-1">
                חשבון {user.accountType === 'premium' ? 'פרימיום' : 
                       user.accountType === 'youtube_pro' ? 'יוטיוב פרו' : 'בסיסי'}
              </p>
            </div>
          )}
        </div>

        {/* Menu Items */}
        <div className="px-4 py-4">
          <nav className="space-y-2">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={() => handleAction(item.action)}
                disabled={item.disabled}
                className={`
                  w-full flex items-center px-4 py-3 text-right rounded-xl transition-all duration-200
                  ios-button group hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed
                  ${item.destructive ? 'hover:bg-destructive/10 hover:text-destructive' : ''}
                `}
              >
                <item.icon className={`
                  h-5 w-5 ml-3 transition-colors
                  ${item.destructive ? 'text-destructive' : 'text-muted-foreground group-hover:text-foreground'}
                `} />
                <span className={`
                  ios-body text-base font-medium
                  ${item.destructive ? 'text-destructive' : 'text-foreground'}
                `}>
                  {item.label}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-border bg-background/80">
          <p className="text-xs ios-caption text-muted-foreground text-center">
            רובוט שבת v2.0.0
          </p>
          <p className="text-xs ios-caption text-muted-foreground text-center mt-1">
            © 2025 כל הזכויות שמורות
          </p>
        </div>
      </div>
    </>
  );
};

export default ModernMenu;