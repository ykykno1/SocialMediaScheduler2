import { useEffect, useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

export default function useFacebookAuth() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [popupWindow, setPopupWindow] = useState<Window | null>(null);
  const [pendingAuth, setPendingAuth] = useState<{ code: string; redirectUri: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['/api/facebook-config'],
    queryFn: () => fetch('/api/facebook-config').then((res) => res.json()),
  });

  // Get auth status
  const { data: authStatus } = useQuery({
    queryKey: ['/api/auth-status'],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) return { isAuthenticated: false };
      
      const res = await fetch('/api/auth-status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return res.json();
    },
  });

  const mutation = useMutation({
    mutationFn: async ({ code, redirectUri }: { code: string; redirectUri: string }) => {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/facebook/auth-callback', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ 
          code,
          redirectUri
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'שגיאה לא ידועה');
      return data;
    },
    onSuccess: () => {
      toast({ title: 'התחברת בהצלחה לפייסבוק' });
      queryClient.invalidateQueries({ queryKey: ['/api/auth-status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/facebook/posts'] });
    },
    onError: (err: any) => {
      toast({ title: 'שגיאה בהתחברות לפייסבוק', description: err.message });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/facebook/disconnect', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'שגיאה לא ידועה');
      return data;
    },
    onSuccess: () => {
      toast({ title: 'התנתקת בהצלחה מפייסבוק' });
      queryClient.invalidateQueries({ queryKey: ['/api/auth-status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/facebook/posts'] });
    },
    onError: (err: any) => {
      toast({ title: 'שגיאה בהתנתקות מפייסבוק', description: err.message });
    },
  });

  const handleFacebookLogin = useCallback(() => {
    if (!data?.appId || !data?.redirectUri) {
      toast({ title: 'פרטי פייסבוק חסרים' });
      return;
    }

    const authUrl = `https://www.facebook.com/v22.0/dialog/oauth?client_id=${data.appId}&redirect_uri=${encodeURIComponent(data.redirectUri)}&response_type=code&scope=public_profile,email&state=facebook`;
    
    console.log('Opening Facebook auth URL:', authUrl);
    
    const popup = window.open(authUrl, 'facebook-auth', 'width=500,height=600');
    if (!popup) {
      toast({ title: 'לא הצלחנו לפתוח חלון אימות' });
      return;
    }
    
    setPopupWindow(popup);

    // Monitor popup for closure
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        setPopupWindow(null);
      }
    }, 1000);

  }, [data, toast]);

  const handleDisconnectFacebook = useCallback(() => {
    disconnectMutation.mutate();
  }, [disconnectMutation]);

  // Set up message listener once, not dependent on changing values
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      console.log('Message received:', event.data);
      console.log('Event origin:', event.origin);
      console.log('Window origin:', window.location.origin);
      
      if (event.origin !== window.location.origin) return;
      if (event.data?.platform !== 'facebook') return;

      const code = event.data.code;
      if (!code) return;

      console.log('Code received from popup:', code);
      
      // Store the auth data to be processed
      setPendingAuth({ code, redirectUri: window.location.origin + '/auth-callback.html' });

      // Close popup if it exists
      setPopupWindow((currentPopup) => {
        if (currentPopup && !currentPopup.closed) {
          currentPopup.close();
        }
        return null;
      });
    }

    console.log('Setting up message listener');
    window.addEventListener('message', handleMessage);
    return () => {
      console.log('Cleaning up message listener');
      window.removeEventListener('message', handleMessage);
    };
  }, []); // Empty dependency array - set up only once

  // Process pending auth when it's available
  useEffect(() => {
    if (pendingAuth && data?.redirectUri) {
      console.log('Processing pending auth:', pendingAuth);
      mutation.mutate(pendingAuth);
      setPendingAuth(null);
    }
  }, [pendingAuth, data, mutation]);

  // Close popup on unmount
  useEffect(() => {
    return () => {
      if (popupWindow && !popupWindow.closed) {
        popupWindow.close();
      }
    };
  }, [popupWindow]);

  return { 
    handleFacebookLogin, 
    handleDisconnectFacebook,
    isLoading: isLoading || mutation.isPending || disconnectMutation.isPending,
    isConnecting: mutation.isPending,
    isDisconnecting: disconnectMutation.isPending,
    // Legacy compatibility for FacebookSection
    isAuthenticated: authStatus?.isAuthenticated || false,
    isAuthenticating: mutation.isPending,
    login: handleFacebookLogin,
    logout: handleDisconnectFacebook,
    pageAccess: authStatus?.pageAccess || true
  };
}