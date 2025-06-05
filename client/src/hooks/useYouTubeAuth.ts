
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

export default function useYouTubeAuth() {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Initialize token from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    setToken(storedToken);
  }, []);

  // Get auth status with proper token handling
  const { 
    data: authStatus = { isAuthenticated: false },
    isLoading,
    error,
    refetch: refetchAuthStatus
  } = useQuery({
    queryKey: ['youtube-auth-status', token],
    queryFn: async () => {
      if (!token) {
        console.log('No token available for YouTube auth check');
        return { isAuthenticated: false, error: 'No token found' };
      }

      console.log('Making YouTube auth status request with token');
      
      const response = await fetch('/api/youtube/auth-status', {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('YouTube auth status response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          console.log('YouTube auth status: unauthorized');
          return { isAuthenticated: false, error: 'Authentication required' };
        }
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('YouTube auth status error:', errorData);
        throw new Error(errorData.error || 'Failed to get auth status');
      }

      const data = await response.json();
      console.log('YouTube auth status success:', data);
      return data;
    },
    enabled: !!token,
    refetchOnWindowFocus: false,
    retry: 1
  });

  // Get auth URL
  const authUrlMutation = useMutation({
    mutationFn: async () => {
      if (!token) {
        throw new Error('עליך להתחבר תחילה');
      }

      console.log('Getting YouTube auth URL');

      const response = await fetch('/api/youtube/auth-url', {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('YouTube auth URL response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to get auth URL' }));
        console.error('YouTube auth URL error:', response.status, errorData);
        throw new Error(errorData.error || 'Failed to get auth URL');
      }

      const data = await response.json();
      console.log('YouTube auth URL received successfully');
      return data.authUrl;
    },
    onSuccess: (authUrl) => {
      console.log('Opening YouTube auth in popup...');
      
      const popup = window.open(
        authUrl,
        'youtube-auth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        console.error('Popup blocked by browser');
        setIsAuthenticating(false);
        toast({
          title: "שגיאה",
          description: "הדפדפן חסם את חלון ההתחברות. אנא אפשר popups ונסה שוב.",
          variant: "destructive",
        });
        return;
      }

      setIsAuthenticating(true);

      // Listen for messages from the popup
      const messageListener = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;

        console.log('Received message from popup:', event.data);

        if (event.data.platform === 'youtube' && event.data.success && event.data.code) {
          console.log('YouTube auth successful, processing code...');
          popup.close();
          window.removeEventListener('message', messageListener);
          processYouTubeCode(event.data.code);
        } else if (event.data.error) {
          console.error('YouTube auth error:', event.data.error);
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

      // Check if popup was closed manually
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          setIsAuthenticating(false);
          console.log('Popup was closed manually');
        }
      }, 1000);
    },
    onError: (error) => {
      console.error('YouTube auth URL error:', error);
      toast({
        title: "שגיאה בהתחברות ל-YouTube",
        description: error instanceof Error ? error.message : 'שגיאה לא ידועה',
        variant: "destructive",
      });
      setIsAuthenticating(false);
    }
  });

  // Process YouTube auth code
  const processYouTubeCode = async (code: string) => {
    try {
      if (!token) {
        throw new Error('עליך להתחבר תחילה');
      }
      
      console.log('Processing YouTube code');
      
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
        console.error('YouTube token exchange error:', errorData);
        throw new Error(errorData.error || 'Failed to exchange code for token');
      }

      const data = await response.json();
      console.log('YouTube token exchange success:', data);

      // Refresh auth status
      await refetchAuthStatus();
      
      setIsAuthenticating(false);

      toast({
        title: "התחברות הצליחה",
        description: data.message || "התחברת בהצלחה לחשבון YouTube",
      });

    } catch (error) {
      console.error('Error processing YouTube code:', error);
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
      console.error('YouTube logout error:', error);
      toast({
        title: "שגיאה בהתנתקות",
        description: error instanceof Error ? error.message : 'שגיאה לא ידועה',
        variant: "destructive",
      });
    }
  });

  // Update token when localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      const newToken = localStorage.getItem('token');
      setToken(newToken);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = () => {
    console.log('YouTube login clicked');
    authUrlMutation.mutate();
  };

  const logout = () => {
    if (window.confirm('האם אתה בטוח שברצונך להתנתק מחשבון YouTube?')) {
      logoutMutation.mutate();
    }
  };

  return {
    isAuthenticated: Boolean(authStatus?.isAuthenticated),
    isAuthenticating: isAuthenticating || authUrlMutation.isPending,
    isLoading,
    login,
    logout,
    isLoggingOut: logoutMutation.isPending,
    channelTitle: authStatus?.channelTitle || null,
    error: error?.message
  };
}
