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
    // First check AuthService (stores tokens in localStorage)
    const isAuthFromService = AuthService.isAuthenticated(platform);
    
    // If platform is Facebook, we might be authenticated via SDK only
    if (platform === 'facebook' && !isAuthFromService) {
      // Check if we have a token in localStorage that might not be in AuthService
      const fbToken = StorageService.getAuthTokens().facebook?.accessToken;
      if (fbToken) {
        return true;
      }
    }
    
    return isAuthFromService;
  }, []);

  // Connect platform
  const connectPlatform = useCallback(async (platform: string) => {
    setAuthenticating(prev => ({ ...prev, [platform]: true }));
    
    try {
      console.log(`Attempting to authenticate with ${platform}...`);
      
      // For Facebook, always use direct SDK approach, which avoids domain restrictions
      if (platform === 'facebook') {
        // Make sure SDK is initialized
        if (!fbSdkInitialized) {
          // Try to initialize SDK first
          try {
            const response = await fetch('/api/facebook-config');
            if (!response.ok) {
              throw new Error('Failed to fetch Facebook configuration');
            }
            
            const config = await response.json();
            if (config?.appId) {
              await FacebookSdkService.initialize(config.appId);
              setFbSdkInitialized(true);
            } else {
              throw new Error('Failed to get Facebook App ID');
            }
          } catch (error) {
            console.error('Failed to initialize Facebook SDK:', error);
            throw new Error('לא ניתן לאתחל את SDK של פייסבוק. נסה שוב מאוחר יותר.');
          }
        }
        
        // Use Facebook SDK directly
        await FacebookSdkService.login();
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
      // For Facebook, we need to handle SDK logout if initialized
      if (platform === 'facebook' && fbSdkInitialized && !CONFIG.DEV_MODE) {
        try {
          // Use the SDK to logout
          // This is a placeholder as the SDK doesn't have a direct logout method
          // We'll rely on removing the token from storage
          console.log('Logging out of Facebook with SDK...');
          
          // The SDK doesn't have a direct logout method we can call
          // Facebook login state will refresh on next page load
        } catch (fbError) {
          console.error('Error logging out from Facebook SDK:', fbError);
          // Continue with local logout even if FB SDK logout fails
        }
      }
      
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
    authenticating,
    fbSdkInitialized
  };
}

export default useAuth;
