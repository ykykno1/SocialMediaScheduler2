import React, { ReactNode, useState } from 'react';
import { Settings, History } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    <div className="min-h-screen flex flex-col bg-gray-100 text-gray-800">
      {/* Header */}
      <header className="bg-[#3466ad] text-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold">רובוט שבת</h1>
          <div className="flex gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onShowSettings}
              className="p-2 rounded hover:bg-blue-600 transition text-white"
            >
              <Settings className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onShowHistory}
              className="p-2 rounded hover:bg-blue-600 transition text-white"
            >
              <History className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white py-4 border-t mt-auto">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          <p>© 2023 רובוט שבת | גרסה 1.0.0</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
