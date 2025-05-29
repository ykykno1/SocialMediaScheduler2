import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

export default function useYouTubeAuth() {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const queryClient = useQueryClient();

  // Get auth status
  const { 
    data: authStatus,
    isLoading
  } = useQuery({
    queryKey: ['/api/youtube/auth-status'],
    refetchOnWindowFocus: false
  });

  // Get auth URL for login
  const authUrlMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/youtube/auth-url');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get auth URL');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      // Redirect to YouTube auth page
      console.log('Got auth URL:', data.authUrl);
      console.log('Redirecting to Google...');
      window.location.href = data.authUrl;
      setIsAuthenticating(true);
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

  // Logout from YouTube
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/youtube/logout', {
        method: 'POST'
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
    isAuthenticated: authStatus?.isAuthenticated ?? false,
    isAuthenticating: isAuthenticating || authUrlMutation.isPending,
    isLoading,
    login,
    logout,
    isLoggingOut: logoutMutation.isPending,
    channelTitle: authStatus?.channelTitle
  };
}