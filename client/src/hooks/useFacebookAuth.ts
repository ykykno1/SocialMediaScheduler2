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
  }

  // Query for auth status
  const { 
    data: authStatus,
    isLoading,
    error
  } = useQuery<AuthStatus>({
    queryKey: ['/api/auth-status'],
    refetchInterval: 60000, // Refetch every minute to check token expiration
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

  // Function to initiate Facebook login
  const login = useCallback(async () => {
    try {
      // Get Facebook app configuration from server
      const configRes = await fetch('/api/facebook-config');
      
      if (!configRes.ok) {
        throw new Error('Failed to get Facebook configuration');
      }
      
      const { appId, redirectUri } = await configRes.json();
      
      // Construct Facebook OAuth URL with basic permissions only
      const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?` +
        `client_id=${appId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `state=facebook&` +
        `scope=public_profile,email,user_posts`;
      
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
      
      setPopupWindow(popup);
    } catch (error) {
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
      // Verify origin
      if (event.origin !== window.location.origin) return;
      
      // Handle successful auth
      if (event.data.success && event.data.platform === 'facebook') {
        toast({
          title: 'התחברות בוצעה בהצלחה',
          description: 'התחברת בהצלחה לחשבון הפייסבוק שלך'
        });
        
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['/api/auth-status'] });
        queryClient.invalidateQueries({ queryKey: ['/api/facebook/posts'] });
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
    isLoading,
    error,
    login,
    logout: () => logoutMutation.mutate(),
    isAuthenticating: !!popupWindow && !popupWindow.closed,
    isLoggingOut: logoutMutation.isPending
  };
}