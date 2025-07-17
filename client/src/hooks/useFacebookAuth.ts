import { useEffect, useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

export default function useFacebookAuth() {
  const [popupWindow, setPopupWindow] = useState<Window | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['/api/facebook-config'],
    queryFn: () => fetch('/api/facebook-config').then((res) => res.json()),
  });

  // Get auth status
  const { data: authStatus } = useQuery({
    queryKey: ['/api/auth-status'],
    queryFn: () => fetch('/api/auth-status').then((res) => res.json()),
  });

  const mutation = useMutation({
    mutationFn: async ({ code, redirectUri }: { code: string; redirectUri: string }) => {
      const res = await fetch('/api/facebook/auth-callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  function handleMessage(event: MessageEvent) {
    console.log('Message received:', event.data);
    console.log('Event origin:', event.origin);
    console.log('Window origin:', window.location.origin);
    
    if (event.origin !== window.location.origin) return;
    if (event.data?.platform !== 'facebook') return;

    // Close popup
    if (popupWindow && !popupWindow.closed) {
      popupWindow.close();
    }
    setPopupWindow(null);

    const code = event.data.code;
    if (!code) return;

    console.log('Exchanging code for token:', code);
    mutation.mutate({ code, redirectUri: data?.redirectUri || '' });
  }

  useEffect(() => {
    console.log('Setting up message listener');
    window.addEventListener('message', handleMessage);
    return () => {
      console.log('Cleaning up message listener');
      window.removeEventListener('message', handleMessage);
    };
  }, [popupWindow, mutation]);

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