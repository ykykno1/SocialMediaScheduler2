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
    refetchInterval: 5000, // Refetch every 5 seconds for responsive updates
    staleTime: 0, // Always refetch when queries are invalidated
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
    mutationFn: async ({ code, redirectUri }: { code: string; redirectUri: string }) => {
      console.log('🚀 exchangeCodeMutation.mutationFn called');
      console.log('📤 About to send POST to /api/auth-callback');
      console.log('📤 Code:', code.substring(0, 20) + '...');
      console.log('📤 RedirectUri:', redirectUri);
      
      try {
        const response = await apiRequest('POST', '/api/auth-callback', { code, redirectUri });
        console.log('📥 Response received from server:', response);
        const data = await response.json();
        console.log('📥 Response data:', data);
        return data;
      } catch (error) {
        console.error('❌ Error in mutationFn:', error);
        throw error;
      }
    },
    onSuccess: async () => {
      console.log('🎉 Exchange code mutation succeeded!');
      
      // Force immediate refetch of auth status
      await refetchAuthStatus();
      
      toast({
        title: 'התחברות בוצעה בהצלחה',
        description: 'התחברת בהצלחה לחשבון הפייסבוק שלך'
      });
      
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['/api/auth-status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/facebook/posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/facebook/pages'] });
      
      console.log('🔄 All queries invalidated after successful auth');
    },
    onError: (error: Error) => {
      console.log('❌ Exchange code mutation failed');
      
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
      // Track attempt number
      const attemptCount = parseInt(localStorage.getItem('facebook_attempts') || '0') + 1;
      localStorage.setItem('facebook_attempts', attemptCount.toString());
      
      console.log(`Starting Facebook login - Attempt #${attemptCount}`);
      console.log('Previous attempts:', localStorage.getItem('facebook_attempts'));
      console.log('Last success:', localStorage.getItem('facebook_last_success'));
      
      // Get Facebook app configuration from server
      const configRes = await fetch('/api/facebook-config');
      
      if (!configRes.ok) {
        throw new Error('Failed to get Facebook configuration');
      }
      
      const { appId, redirectUri } = await configRes.json();
      console.log('Facebook config received:', { appId, redirectUri });
      
      // בקשת הרשאות תקפות בלבד
      // שימוש רק בהרשאות שנתמכות בגרסה 22.0 של Facebook API
      // משתמש באותם סקופים כמו השרת
      const authUrl = `https://www.facebook.com/v22.0/dialog/oauth?` +
        `client_id=${appId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `state=facebook&` +
        `scope=public_profile,email,user_posts`;
      
      console.log('Facebook auth URL:', authUrl);
      console.log('Please open this URL in a new tab to test manually:', authUrl);
      
      // Show user-friendly message about popup blocking
      toast({
        title: 'חלון פופאפ נפתח',
        description: 'אם החלון לא נפתח, הדפדפן כנראה חוסם חלונות קופצים. אפשר להעתיק את הקישור מהקונסול.',
        variant: 'default',
      });
      
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
      
      // Add polling to check if popup is closed
      let pollCount = 0;
      const maxPolls = 180; // 3 minutes total
      const pollTimer = setInterval(() => {
        pollCount++;
        
        // Check if popup was closed (either manually or by Facebook redirect failure)
        if (popup.closed) {
          console.log(`Facebook popup was closed after ${pollCount} seconds`);
          setPopupWindow(null);
          clearInterval(pollTimer);
          
          // Only show timeout message if it was closed very quickly (likely an error)
          if (pollCount < 5) {
            toast({
              title: 'בעיה בהתחברות',
              description: 'החלון נסגר מהר מדי. נסה שוב או בדוק חלונות קופצים.',
              variant: 'destructive',
            });
          } else if (pollCount < 30) {
            toast({
              title: 'ההתחברות בוטלה',
              description: 'אם לא השלמת את ההתחברות, נסה שוב.',
              variant: 'default',
            });
          }
          return;
        }
        
        // Cleanup after max time
        if (pollCount >= maxPolls) {
          console.log('Facebook auth timeout - cleaning up');
          setPopupWindow(null);
          clearInterval(pollTimer);
          toast({
            title: 'תקלה בהתחברות',
            description: 'ההתחברות לפייסבוק לקחה יותר מדי זמן. נסה שוב.',
            variant: 'destructive',
          });
        }
      }, 1000);
      
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
      if (event.data.code && event.data.platform === 'facebook' && !exchangeCodeMutation.isPending) {
        console.log('Facebook auth code received, exchanging for token');
        
        // Close popup first
        if (popupWindow && !popupWindow.closed) {
          popupWindow.close();
        }
        setPopupWindow(null);
        
        // Exchange code for token on the server (only if not already pending)
        console.log('🔄 About to call exchangeCodeMutation.mutate');
        console.log('🔄 Code to send:', event.data.code.substring(0, 20) + '...');
        console.log('🔄 Redirect URI:', window.location.origin + '/auth-callback.html');
        
        exchangeCodeMutation.mutate({
          code: event.data.code,
          redirectUri: window.location.origin + '/auth-callback.html'
        });
        
        console.log('🔄 exchangeCodeMutation.mutate called');
      } else if (event.data.code && exchangeCodeMutation.isPending) {
        console.log('🚫 Mutation already pending, ignoring duplicate code');
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
            description: 'ההתחברות לפייסבוק בוטלה. אם רוצה להתחבר, יש לאשר את ההרשאות במסך הפייסבוק.',
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
      
      // Handle auth error
      if (event.data.error) {
        toast({
          title: 'שגיאת התחברות',
          description: event.data.error,
          variant: 'destructive',
        });
      }
      
      // Close popup
      if (popupWindow && !popupWindow.closed) {
        popupWindow.close();
      }
      
      setPopupWindow(null);
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
    isAuthenticating: exchangeCodeMutation.isPending || (!!popupWindow && !popupWindow.closed),
    isLoggingOut: logoutMutation.isPending
  };
}