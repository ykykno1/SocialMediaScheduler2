import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface FacebookConnection {
  connectionName: string;
  isAuthenticated: boolean;
  facebookName?: string;
  facebookId?: string;
  pageAccess?: boolean;
  lastConnected?: Date;
}

interface FacebookAuth {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  timestamp?: number;
  userId: string;
  additionalData?: {
    id: string;
    name: string;
    email?: string;
  };
}

const useMultipleFacebookAuth = () => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isAddingConnection, setIsAddingConnection] = useState(false);
  const [isRemovingConnection, setIsRemovingConnection] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch all Facebook connections for the user
  const { data: connections = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/facebook/connections'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/facebook/connections');
        return response as FacebookConnection[];
      } catch (error) {
        console.error('Failed to fetch Facebook connections:', error);
        return [];
      }
    }
  });

  const hasAnyConnection = connections.length > 0;

  // Login/Connect mutation for new connections
  const loginMutation = useMutation({
    mutationFn: async (connectionName: string): Promise<FacebookAuth> => {
      setIsAuthenticating(true);
      
      const APP_ID = '1598261231562840';
      const redirectUri = encodeURIComponent(`${window.location.origin}/api/auth-callback`);
      const scope = encodeURIComponent('public_profile,email,publish_actions,manage_pages,pages_show_list,pages_read_engagement,pages_manage_posts,pages_manage_metadata');
      
      const authUrl = `https://www.facebook.com/v22.0/dialog/oauth?client_id=${APP_ID}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code&state=${encodeURIComponent(JSON.stringify({ platform: 'facebook', connectionName }))}`;
      
      return new Promise((resolve, reject) => {
        const popup = window.open(authUrl, 'facebook-auth', 'width=600,height=600,scrollbars=yes,resizable=yes');
        
        if (!popup) {
          reject(new Error('החלון הקופץ נחסם'));
          return;
        }

        const messageListener = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) {
            return;
          }

          if (event.data.type === 'facebook-auth-success') {
            window.removeEventListener('message', messageListener);
            popup.close();
            resolve(event.data.auth);
          } else if (event.data.type === 'facebook-auth-error') {
            window.removeEventListener('message', messageListener);
            popup.close();
            reject(new Error(event.data.error || 'שגיאה בהתחברות לפייסבוק'));
          }
        };

        window.addEventListener('message', messageListener);

        // Check if popup was closed manually
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            window.removeEventListener('message', messageListener);
            reject(new Error('החלון נסגר'));
          }
        }, 1000);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/facebook/connections'] });
      toast({
        title: "התחברת בהצלחה",
        description: "החיבור לפייסבוק הצליח",
      });
    },
    onError: (error: any) => {
      toast({
        title: "שגיאה בהתחברות",
        description: error.message || "לא הצלחנו להתחבר לפייסבוק",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsAuthenticating(false);
    }
  });

  // Logout/Remove connection mutation
  const logoutMutation = useMutation({
    mutationFn: async (connectionName: string) => {
      return await apiRequest('POST', '/api/facebook/disconnect', { connectionName });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/facebook/connections'] });
      toast({
        title: "התנתקת בהצלחה",
        description: "החיבור לפייסבוק הוסר",
      });
    },
    onError: (error: any) => {
      toast({
        title: "שגיאה בהתנתקות",
        description: "לא הצלחנו להסיר את החיבור",
        variant: "destructive",
      });
    }
  });

  const login = useCallback(async (connectionName: string) => {
    setIsAddingConnection(true);
    try {
      await loginMutation.mutateAsync(connectionName);
    } finally {
      setIsAddingConnection(false);
    }
  }, [loginMutation]);

  const logout = useCallback(async (connectionName: string) => {
    setIsRemovingConnection(true);
    try {
      await logoutMutation.mutateAsync(connectionName);
    } finally {
      setIsRemovingConnection(false);
    }
  }, [logoutMutation]);

  return {
    connections,
    hasAnyConnection,
    isLoading,
    isAuthenticating,
    isAddingConnection,
    isRemovingConnection,
    login,
    logout,
    refetch,
  };
};

export default useMultipleFacebookAuth;