import React, { ReactNode, useState } from 'react';
import ModernMenu from './ModernMenu';
import { Link } from 'wouter';

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
          <Link href="/" className="text-2xl font-semibold ios-title text-primary hover:opacity-80 transition-opacity cursor-pointer">
            רובוט שבת
          </Link>
          <div className="flex items-center">
            <ModernMenu 
              onShowSettings={onShowSettings}
              onShowHistory={onShowHistory}
            />
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
