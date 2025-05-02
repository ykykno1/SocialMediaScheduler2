import { useState, useCallback, useEffect } from 'react';
import { useToast } from './use-toast';
import AuthService from '../services/authService';
import StorageService from '../services/storageService';
import FacebookSdkService from '../services/facebookSdk';
import useSettings from './useSettings';
import CONFIG from '../config';

export function useAuth() {
  const [authenticating, setAuthenticating] = useState<Record<string, boolean>>({});
  const [fbSdkInitialized, setFbSdkInitialized] = useState<boolean>(false);
  const { settings, saveSettings } = useSettings();
  const { toast } = useToast();
  
  // Initialize Facebook SDK on component mount
  useEffect(() => {
    if (CONFIG.DEV_MODE) {
      // Skip in development mode
      return;
    }
    
    const initFacebookSdk = async () => {
      try {
        // Fetch app ID from server
        const response = await fetch('/api/facebook-config');
        if (!response.ok) {
          throw new Error('Failed to fetch Facebook configuration');
        }
        
        const config = await response.json();
        if (config?.appId) {
          await FacebookSdkService.initialize(config.appId);
          setFbSdkInitialized(true);
          
          // Try to check login status
          try {
            await FacebookSdkService.checkLoginStatus();
          } catch (err) {
            console.warn('Failed to check Facebook login status:', err);
          }
        }
      } catch (error) {
        console.error('Failed to initialize Facebook SDK:', error);
      }
    };
    
    initFacebookSdk();
  }, []);

  // Check if platform is authenticated
  const isAuthenticated = useCallback((platform: string) => {
    return AuthService.isAuthenticated(platform);
  }, []);

  // Connect platform
  const connectPlatform = useCallback(async (platform: string) => {
    setAuthenticating(prev => ({ ...prev, [platform]: true }));
    
    try {
      console.log(`Attempting to authenticate with ${platform}...`);
      
      // For Facebook, use SDK or traditional auth based on availability
      if (platform === 'facebook' && !CONFIG.DEV_MODE) {
        if (fbSdkInitialized) {
          // Use Facebook SDK
          await FacebookSdkService.login();
        } else {
          // Use traditional OAuth flow
          // First validate that platform has API key and secret
          if (!settings.platforms[platform].apiKey) {
            throw new Error(`נדרש להזין מפתח API ל${getPlatformDisplayName(platform)}`);
          }
            
          await AuthService.authenticate(platform);
        }
      } else {
        // For other platforms, use traditional OAuth 
        // First validate that platform has API key and secret
        if (!settings.platforms[platform].apiKey || !settings.platforms[platform].apiSecret) {
          throw new Error(`נדרש להזין מפתח API וסיסמת API ל${getPlatformDisplayName(platform)}`);
        }
          
        await AuthService.authenticate(platform);
      }
      
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
      console.error(`Authentication error with ${platform}:`, error);
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
