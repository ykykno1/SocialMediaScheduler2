import React, { useState } from 'react';
import Layout from '@/components/Layout';
import Dashboard from '@/components/Dashboard';
import Settings from '@/components/Settings';
import History from '@/components/History';
import ContentList from '@/components/ContentList';

type View = 'dashboard' | 'settings' | 'history' | 'content';

export default function Home() {
  const [activeView, setActiveView] = useState<View>('dashboard');
  
  const showDashboard = () => setActiveView('dashboard');
  const showSettings = () => setActiveView('settings');
  const showHistory = () => setActiveView('history');
  const showContent = () => setActiveView('content');
  
  return (
    <Layout
      onShowSettings={showSettings}
      onShowHistory={showHistory}
    >
      {activeView === 'dashboard' && (
        <Dashboard 
          onShowSettings={showSettings} 
          onShowContent={showContent}
        />
      )}
      
      {activeView === 'settings' && (
        <Settings onBackToDashboard={showDashboard} />
      )}
      
      {activeView === 'history' && (
        <History onBackToDashboard={showDashboard} />
      )}
      
      {activeView === 'content' && (
        <ContentList onBackToDashboard={showDashboard} />
      )}
    </Layout>
  );
}
