import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function useFacebookAuth() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [popupWindow, setPopupWindow] = useState<Window | null>(null);

  interface AuthStatus {
    isAuthenticated: boolean;
    platform: string;
    authTime: string | null;
    pageAccess?: boolean;
  }

  // Query for auth status
  const { 
    data: authStatus,
    isLoading,
    error,
    refetch: refetchAuthStatus
  } = useQuery<AuthStatus>({
    queryKey: ['/api/auth-status'],
    refetchInterval: 60000, // Refetch every minute to check token expiration
    staleTime: 30000, // Consider data stale after 30 seconds
  });

  // Mutation for logging out
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/logout');
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth-status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/facebook/posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/facebook/pages'] });
      toast({
        title: 'התנתקות בוצעה בהצלחה',
        description: 'התנתקת בהצלחה מחשבון הפייסבוק שלך'
      });
    },
    onError: (error) => {
      toast({
        title: 'שגיאה בהתנתקות',
        description: error instanceof Error ? error.message : 'אירעה שגיאה בהתנתקות מפייסבוק',
        variant: 'destructive',
      });
    }
  });

  // Exchange code for token mutation
  const exchangeCodeMutation = useMutation({
    mutationFn: async ({ code }: { code: string }) => {
      const response = await apiRequest('POST', '/api/facebook/auth-callback', { code });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'התחברות בוצעה בהצלחה',
        description: 'התחברת בהצלחה לחשבון הפייסבוק שלך'
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/auth-status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/facebook/posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/facebook/pages'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'שגיאת התחברות',
        description: error.message || 'אירעה שגיאה בהתחברות לפייסבוק',
        variant: 'destructive',
      });
    }
  });

  // Function to initiate Facebook login
  const login = useCallback(async () => {
    try {
      console.log('Starting Facebook login');
      
      // Get Facebook app configuration from server
      const configRes = await fetch('/api/facebook-config');
      
      if (!configRes.ok) {
        throw new Error('Failed to get Facebook configuration');
      }
      
      const { appId, redirectUri } = await configRes.json();
      console.log('Facebook config received:', { appId, redirectUri });
      
      // בקשת הרשאות תקפות בלבד
      // שימוש רק בהרשאות שנתמכות בגרסה 22.0 של Facebook API
      // הסרנו את כל הרשאות העמודים שאינן תקפות
      const authUrl = `https://www.facebook.com/v22.0/dialog/oauth?` +
        `client_id=${appId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `state=facebook&` +
        `scope=public_profile,email,user_posts`;
      
      console.log('Facebook auth URL:', authUrl);
      
      // Open popup window
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const popup = window.open(
        authUrl,
        'facebook-login',
        `width=${width},height=${height},left=${left},top=${top}`
      );
      
      if (!popup) {
        throw new Error('נחסם חלון קופץ. אנא אפשר חלונות קופצים ונסה שוב');
      }
      
      console.log('Facebook popup opened');
      setPopupWindow(popup);
      
      // Add more detailed polling to check popup status
      const pollTimer = setInterval(() => {
        if (popup.closed) {
          console.log('Facebook popup was closed manually');
          setPopupWindow(null);
          clearInterval(pollTimer);
          return;
        }
        
        // Try to access popup URL for debugging
        try {
          const currentUrl = popup.location.href;
          console.log('Popup still open, current URL:', currentUrl);
          
          // Check if popup is on our callback page
          if (currentUrl.includes('auth-callback.html')) {
            console.log('Popup reached our callback page!');
          }
        } catch (e) {
          // Cross-origin error is expected when redirected to Facebook
          console.log('Cross-origin error (expected when on Facebook):', e.message);
        }
      }, 500); // Check more frequently
      
      // Store timer reference for cleanup
      setTimeout(() => {
        if (pollTimer) {
          clearInterval(pollTimer);
        }
      }, 60000); // Clean up after 1 minute
      
    } catch (error) {
      console.error('Facebook login error:', error);
      toast({
        title: 'שגיאת התחברות',
        description: error instanceof Error ? error.message : 'אירעה שגיאה בהתחברות לפייסבוק',
        variant: 'destructive',
      });
    }
  }, [toast]);

  // Handle message from popup
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log('Received message from popup:', event.data);
      console.log('Event origin:', event.origin);
      console.log('Window origin:', window.location.origin);
      
      // Verify origin
      if (event.origin !== window.location.origin) {
        console.log('Origin mismatch, ignoring message');
        return;
      }
      
      // Handle successful auth with code
      if (event.data.code && event.data.platform === 'facebook') {
        console.log('Facebook auth code received, exchanging for token');
        // Close popup first
        if (popupWindow && !popupWindow.closed) {
          popupWindow.close();
        }
        setPopupWindow(null);
        
        // Exchange code for token on the server
        exchangeCodeMutation.mutate({
          code: event.data.code
        });
      }
      
      // Handle auth errors (user cancelled, etc.)
      if (event.data.error && event.data.platform === 'facebook') {
        console.log('Facebook auth error received:', event.data.error);
        // Close popup
        if (popupWindow && !popupWindow.closed) {
          popupWindow.close();
        }
        setPopupWindow(null);
        
        if (event.data.error === 'access_denied') {
          toast({
            title: 'התחברות בוטלה',
            description: 'ההתחברות לפייסבוק בוטלה על ידי המשתמש',
            variant: 'default',
          });
        } else {
          toast({
            title: 'שגיאת התחברות',
            description: `שגיאה בהתחברות לפייסבוק: ${event.data.error}`,
            variant: 'destructive',
          });
        }
      }
      
      // Handle successful auth with access token (implicit flow)
      if (event.data.access_token && event.data.platform === 'facebook') {
        // TODO: Handle implicit flow if needed
        toast({
          title: 'התחברות בוצעה בהצלחה',
          description: 'התחברת בהצלחה לחשבון הפייסבוק שלך'
        });
        
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['/api/auth-status'] });
        queryClient.invalidateQueries({ queryKey: ['/api/facebook/posts'] });
        queryClient.invalidateQueries({ queryKey: ['/api/facebook/pages'] });
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [popupWindow, toast, queryClient]);

  // Close popup on unmount
  useEffect(() => {
    return () => {
      if (popupWindow && !popupWindow.closed) {
        popupWindow.close();
      }
    };
  }, [popupWindow]);

  return {
    isAuthenticated: (authStatus && authStatus.isAuthenticated) || false,
    authTime: (authStatus && authStatus.authTime) ? new Date(authStatus.authTime) : null,
    platform: authStatus?.platform || 'facebook',
    pageAccess: authStatus?.pageAccess || false,
    isLoading,
    error,
    login,
    logout: () => logoutMutation.mutate(),
    isAuthenticating: !!popupWindow && !popupWindow.closed,
    isLoggingOut: logoutMutation.isPending
  };
}