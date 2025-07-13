import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

export default function useYouTubeAuth() {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const queryClient = useQueryClient();
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  // Get auth status
  const {
    data: authStatus = {},
    isLoading
  } = useQuery({
    queryKey: ['/api/youtube/auth-status'],
    queryFn: async () => {
      const response = await fetch('/api/youtube/auth-status', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (!response.ok) {
        throw new Error('Failed to get auth status');
      }

      return response.json();
    },
    enabled: !!token,
    refetchOnWindowFocus: false
  });

  // Get auth URL for login
  const authUrlMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/youtube/auth-url', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get auth URL');
      }

      return await response.json();
    },
    onSuccess: (data) => {
      console.log('✅ Got auth URL from server:', data.authUrl);
      console.log('🚀 Attempting to open Google auth popup...');

      const popup = window.open(
        data.authUrl,
        'google-auth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        console.error('❌ Popup was blocked by browser!');
        setIsAuthenticating(false);
        toast({
          title: "שגיאה",
          description: "הדפדפן חסם את חלון ההתחברות. אנא אפשר popups ונסה שוב.",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Popup opened successfully, waiting for response...');

      const messageListener = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;

        if (event.data.platform === 'youtube' && event.data.success && event.data.code) {
          console.log('YouTube auth successful, processing code...');
          popup?.close();
          window.removeEventListener('message', messageListener);
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

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/youtube/logout', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'שגיאה בהתנתקות');
      }

      return await response.json();
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

  const processYouTubeCode = async (code: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/youtube/auth-callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ code })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to exchange code for token');
      }

      await response.json();
      queryClient.invalidateQueries({ queryKey: ['/api/youtube/auth-status'] });
      setIsAuthenticating(false);

      toast({
        title: "התחברות הצליחה",
        description: "התחברת בהצלחה לחשבון YouTube",
      });

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
    console.log('🎬 YouTube login clicked - starting authentication process');
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
"""

# Save the code to a .ts file
output_path = Path("/mnt/data/useYouTubeAuth.ts")
output_path.write_text(corrected_code, encoding='utf-8')
output_path.name