import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface FacebookAuthResponse {
  access_token: string;
  expires_in: number;
  user_id: string;
}

interface AuthStatus {
  isAuthenticated: boolean;
  platform: string;
  authTime: string | null;
}

export default function useFacebookAuth() {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const queryClient = useQueryClient();

  // Check authentication status
  const { data: authStatus, isLoading } = useQuery<AuthStatus>({
    queryKey: ['/api/auth-status'],
    refetchOnWindowFocus: false,
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to logout');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate auth status after logout
      queryClient.invalidateQueries({ queryKey: ['/api/auth-status'] });
    }
  });

  // Start Facebook authentication flow
  const startAuthFlow = useCallback(async () => {
    try {
      setIsAuthenticating(true);
      
      // Get Facebook configuration from server
      const configResponse = await fetch('/api/facebook-config');
      
      if (!configResponse.ok) {
        throw new Error('Failed to get Facebook configuration');
      }
      
      const config = await configResponse.json();
      
      if (!config.appId) {
        throw new Error('Facebook App ID not configured');
      }
      
      // Create login URL
      const redirectUri = config.redirectUri;
      const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?` +
        `client_id=${config.appId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=public_profile,email&` +
        `state=facebook`;
      
      // Open popup window for authentication
      const authWindow = window.open(
        authUrl,
        'facebook-auth',
        'width=600,height=600,location=yes,resizable=yes,scrollbars=yes'
      );
      
      if (!authWindow) {
        throw new Error('Popup window was blocked. Please allow popups for this site.');
      }
      
      // Listen for messages from auth window
      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) {
          return;
        }
        
        const { platform, success, error } = event.data;
        
        if (error) {
          console.error('Authentication error:', error);
          setIsAuthenticating(false);
          return;
        }
        
        if (platform === 'facebook' && success) {
          // Authentication successful, invalidate queries
          queryClient.invalidateQueries({ queryKey: ['/api/auth-status'] });
          setIsAuthenticating(false);
        }
      };
      
      window.addEventListener('message', handleMessage);
      
      // Cleanup
      const interval = setInterval(() => {
        if (authWindow && authWindow.closed) {
          window.removeEventListener('message', handleMessage);
          clearInterval(interval);
          setIsAuthenticating(false);
        }
      }, 1000);
      
      // Timeout after 5 minutes
      setTimeout(() => {
        if (authWindow && !authWindow.closed) {
          authWindow.close();
        }
        window.removeEventListener('message', handleMessage);
        clearInterval(interval);
        setIsAuthenticating(false);
      }, 300000);
      
    } catch (error) {
      console.error('Authentication error:', error);
      setIsAuthenticating(false);
    }
  }, [queryClient]);

  // Handle logout
  const logout = useCallback(() => {
    logoutMutation.mutate();
  }, [logoutMutation]);

  return {
    isAuthenticated: authStatus?.isAuthenticated || false,
    isAuthenticating,
    isLoading,
    startAuthFlow,
    logout,
  };
}