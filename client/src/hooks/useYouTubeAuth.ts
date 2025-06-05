import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

export default function useYouTubeAuth() {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const queryClient = useQueryClient();

  // Get auth status
  const { 
    data: authStatus = {},
    isLoading
  } = useQuery({
    queryKey: ['/api/youtube/auth-status'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        return { isAuthenticated: false, error: 'No token found' };
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to get auth status');
      }

      const data = await response.json();
      return data;
    },
    refetchOnWindowFocus: false,
    retry: false,
    enabled: !!localStorage.getItem('token') // Only run if we have a token
  });

  // Get auth URL
  const authUrlMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('עליך להתחבר תחילה');
      }

      const response = await fetch('/api/youtube/auth-url', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get auth URL');
      }

      const data = await response.json();
      return data.authUrl;
    },
    onSuccess: (data) => {
      // Open YouTube auth page in popup
      console.log('Got auth URL:', data.authUrl);
      console.log('Opening Google auth in popup...');

      const popup = window.open(
        data.authUrl,
        'google-auth',
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

      // Listen for messages from the popup
      const messageListener = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;

        if (event.data.platform === 'youtube' && event.data.success && event.data.code) {
          console.log('YouTube auth successful, processing code...');
          popup?.close();
          window.removeEventListener('message', messageListener);

          // Process the code with authenticated session
          processYouTubeCode(event.data.code);
        } else if (event.data.error) {
          console.error('YouTube auth error:', event.data.error);
          popup?.close();
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
      setIsAuthenticating(true);

      // Check if popup was closed manually
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          setIsAuthenticating(false);
        }
      }, 1000);
    },
    onError: (error) => {
      toast({
        title: "שגיאה בהתחברות ל-YouTube",
        description: error instanceof Error ? error.message : 'שגיאה לא ידועה',
        variant: "destructive",
      });
      setIsAuthenticating(false);
    }
  });

  // Logout
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/youtube/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to logout');
      }
    },
    onSuccess: () => {
      toast({
        title: "התנתקות הצליחה",
        description: "התנתקת בהצלחה מחשבון YouTube",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/youtube/auth-status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth-status'] });
    },
    onError: (error) => {
      toast({
        title: "שגיאה בהתנתקות",
        description: error instanceof Error ? error.message : 'שגיאה לא ידועה',
        variant: "destructive",
      });
    }
  });

  // Process YouTube auth code
  const processYouTubeCode = async (code: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('עליך להתחבר תחילה');
      }
      
      const response = await fetch('/api/youtube/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          code
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to exchange code for token');
      }

      const data = await response.json();

      queryClient.invalidateQueries({ queryKey: ['/api/youtube/auth-status'] });
      setIsAuthenticating(false);

      toast({
        title: "התחברות הצליחה",
        description: "התחברת בהצלחה לחשבון YouTube",
      });

      // Clear any stored auth code
      localStorage.removeItem('youtube_auth_code');
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

  const login = () => {
    console.log('YouTube login clicked');
    setIsAuthenticating(true);
    authUrlMutation.mutate();
  };

  const logout = () => {
    if (window.confirm('האם אתה בטוח שברצונך להתנתק מחשבון YouTube?')) {
      logoutMutation.mutate();
    }
  };

  return {
    isAuthenticated: (authStatus as any)?.isAuthenticated ?? false,
    isAuthenticating: isAuthenticating || authUrlMutation.isPending,
    isLoading,
    login,
    logout,
    isLoggingOut: logoutMutation.isPending,
    channelTitle: (authStatus as any)?.channelTitle
  };
}