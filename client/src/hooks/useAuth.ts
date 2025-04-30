import { useState, useCallback } from 'react';
import { useToast } from './use-toast';
import AuthService from '../services/authService';
import StorageService from '../services/storageService';
import useSettings from './useSettings';

export function useAuth() {
  const [authenticating, setAuthenticating] = useState<Record<string, boolean>>({});
  const { settings, saveSettings } = useSettings();
  const { toast } = useToast();

  // Check if platform is authenticated
  const isAuthenticated = useCallback((platform: string) => {
    return AuthService.isAuthenticated(platform);
  }, []);

  // Connect platform
  const connectPlatform = useCallback(async (platform: string) => {
    setAuthenticating(prev => ({ ...prev, [platform]: true }));
    
    try {
      await AuthService.authenticate(platform);
      
      // Update settings to reflect connected state
      const updatedSettings = { ...settings };
      updatedSettings.platforms[platform].connected = true;
      await saveSettings(updatedSettings);
      
      toast({
        title: 'חיבור הצליח',
        description: `התחברת בהצלחה ל${getPlatformDisplayName(platform)}.`,
      });
      
      return true;
    } catch (error) {
      toast({
        title: 'שגיאת חיבור',
        description: (error as Error).message,
        variant: 'destructive'
      });
      return false;
    } finally {
      setAuthenticating(prev => ({ ...prev, [platform]: false }));
    }
  }, [settings, saveSettings, toast]);

  // Disconnect platform
  const disconnectPlatform = useCallback(async (platform: string) => {
    try {
      // Remove auth token
      StorageService.removeAuthToken(platform);
      
      // Update settings
      const updatedSettings = { ...settings };
      updatedSettings.platforms[platform].connected = false;
      await saveSettings(updatedSettings);
      
      toast({
        title: 'ניתוק הצליח',
        description: `נותקת בהצלחה מ${getPlatformDisplayName(platform)}.`,
      });
      
      return true;
    } catch (error) {
      toast({
        title: 'שגיאת ניתוק',
        description: (error as Error).message,
        variant: 'destructive'
      });
      return false;
    }
  }, [settings, saveSettings, toast]);

  // Helper function to get display name for platform
  const getPlatformDisplayName = (platform: string): string => {
    const displayNames: Record<string, string> = {
      facebook: 'פייסבוק',
      instagram: 'אינסטגרם',
      youtube: 'יוטיוב',
      tiktok: 'טיקטוק'
    };
    
    return displayNames[platform] || platform;
  };

  return {
    isAuthenticated,
    connectPlatform,
    disconnectPlatform,
    authenticating
  };
}

export default useAuth;
