import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

export default function useYouTubeAuth() {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const queryClient = useQueryClient();

  // Get current user token
  const getAuthToken = () => localStorage.getItem('token');

  // Check auth status
  const { 
    data: authStatus = { isAuthenticated: false },
    isLoading,
    error,
    refetch: refetchAuthStatus
  } = useQuery({
    queryKey: ['youtube-auth-status'],
    queryFn: async () => {
      const token = getAuthToken();
      if (!token) {
        return { isAuthenticated: false, error: 'User not authenticated' };
      }

      const response = await fetch('/api/youtube/auth-status', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          return { isAuthenticated: false, error: 'Authentication required' };
        }
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to get auth status');
      }

      return response.json();
    },
    enabled: !!getAuthToken(),
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1
  });

  // Start YouTube auth flow
  const login = async () => {
    const token = getAuthToken();
    if (!token) {
      toast({
        title: "שגיאה",
        description: "עליך להתחבר למערכת תחילה",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsAuthenticating(true);

      // Get auth URL
      const response = await fetch('/api/youtube/auth-url', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to get auth URL' }));
        throw new Error(errorData.error || 'Failed to get auth URL');
      }

      const { authUrl } = await response.json();

      // Open popup
      const popup = window.open(
        authUrl,
        'youtube-auth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        throw new Error('הדפדפן חסם את חלון ההתחברות. אנא אפשר popups ונסה שוב.');
      }

      // Listen for auth completion
      const messageListener = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;

        if (event.data.platform === 'youtube' && event.data.success && event.data.code) {
          popup.close();
          window.removeEventListener('message', messageListener);
          processCode(event.data.code);
        } else if (event.data.error) {
          popup.close();
          window.removeEventListener('message', messageListener);
          setIsAuthenticating(false);
          toast({
            title: "שגיאה בהתחברות",
            description: event.data.error,
            variant: "destructive",
          });
        }
      };

      window.addEventListener('message', messageListener);

      // Check if popup closed manually
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          setIsAuthenticating(false);
        }
      }, 1000);

    } catch (error) {
      setIsAuthenticating(false);
      toast({
        title: "שגיאה בהתחברות ל-YouTube",
        description: error instanceof Error ? error.message : 'שגיאה לא ידועה',
        variant: "destructive",
      });
    }
  };

  // Process auth code
  const processCode = async (code: string) => {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('User session expired');
      }

      const response = await fetch('/api/youtube/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to exchange code' }));
        throw new Error(errorData.error || 'Failed to exchange code for token');
      }

      const data = await response.json();

      await refetchAuthStatus();
      setIsAuthenticating(false);

      toast({
        title: "התחברות הצליחה",
        description: data.message || "התחברת בהצלחה לחשבון YouTube",
      });

    } catch (error) {
      setIsAuthenticating(false);
      toast({
        title: "שגיאה בהתחברות",
        description: error instanceof Error ? error.message : 'שגיאה לא ידועה',
        variant: "destructive",
      });
    }
  };

  // Logout
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/youtube/logout', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Logout failed' }));
        throw new Error(errorData.error || 'Failed to logout');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "התנתקות הצליחה",
        description: "התנתקת בהצלחה מחשבון YouTube",
      });
      refetchAuthStatus();
    },
    onError: (error) => {
      toast({
        title: "שגיאה בהתנתקות",
        description: error instanceof Error ? error.message : 'שגיאה לא ידועה',
        variant: "destructive",
      });
    }
  });

  const logout = () => {
    if (window.confirm('האם אתה בטוח שברצונך להתנתק מחשבון YouTube?')) {
      logoutMutation.mutate();
    }
  };

  return {
    isAuthenticated: Boolean(authStatus?.isAuthenticated),
    isAuthenticating: isAuthenticating,
    isLoading,
    login,
    logout,
    isLoggingOut: logoutMutation.isPending,
    channelTitle: authStatus?.channelTitle || null,
    error: error?.message
  };
}