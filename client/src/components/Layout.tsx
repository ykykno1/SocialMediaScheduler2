import React, { ReactNode, useState } from 'react';
import { Settings, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UserProfile from './UserProfile';

interface LayoutProps {
  children: ReactNode;
  onShowSettings: () => void;
  onShowHistory: () => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children,
  onShowSettings,
  onShowHistory
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground ios-fade-in">
      {/* iOS-style Header with blur effect */}
      <header className="bg-background/80 backdrop-blur-xl border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-semibold ios-title text-primary">רובוט שבת</h1>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onShowHistory}
              className="ios-button h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-secondary"
            >
              <History className="h-5 w-5" />
            </Button>
            <UserProfile onShowSettings={onShowSettings} />
          </div>
        </div>
      </header>

      {/* iOS-style Main Content */}
      <main className="flex-grow container mx-auto px-6 py-8">
        <div className="ios-scale-in">
          {children}
        </div>
      </main>

      {/* iOS-style Footer */}
      <footer className="bg-background/50 backdrop-blur-sm py-6 border-t border-border/50 mt-auto">
        <div className="container mx-auto px-6 text-center">
          <p className="text-sm ios-body text-muted-foreground">
            © 2025 רובוט שבת | גרסה 2.0.0
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
