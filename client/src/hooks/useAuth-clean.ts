import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import type { User, RegisterRequest, LoginRequest, AuthResponse } from "@shared/types";

type UserWithoutPassword = Omit<User, 'password'>;

export function useAuth() {
  const { toast } = useToast();
  const [isTokenChecked, setIsTokenChecked] = useState(false);
  
  // Clear any invalid token on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      // Test if token is valid by making a quick request
      fetch('/api/user', {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(res => {
        if (!res.ok) {
          localStorage.removeItem('auth_token');
        }
      }).catch(() => {
        localStorage.removeItem('auth_token');
      }).finally(() => {
        setIsTokenChecked(true);
      });
    } else {
      setIsTokenChecked(true);
    }
  }, []);

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  
  const { data: user, isLoading } = useQuery<UserWithoutPassword | null>({
    queryKey: ["/api/user"],
    queryFn: async () => {
      if (!token) return null;
      
      try {
        const res = await apiRequest("GET", "/api/user");
        return res.json();
      } catch (error) {
        localStorage.removeItem('auth_token');
        return null;
      }
    },
    enabled: isTokenChecked && !!token,
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterRequest): Promise<AuthResponse> => {
      const res = await apiRequest("POST", "/api/register", credentials);
      return res.json();
    },
    onSuccess: (response: AuthResponse) => {
      localStorage.setItem('auth_token', response.token);
      queryClient.setQueryData(["/api/user"], response.user);
      toast({
        title: "רישום הושלם בהצלחה",
        description: `ברוך הבא ${response.user.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה ברישום",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginRequest): Promise<AuthResponse> => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return res.json();
    },
    onSuccess: (response: AuthResponse) => {
      localStorage.setItem('auth_token', response.token);
      queryClient.setQueryData(["/api/user"], response.user);
      toast({
        title: "התחברות הושלמה בהצלחה",
        description: `ברוך הבא ${response.user.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה בהתחברות",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      localStorage.removeItem('auth_token');
      queryClient.setQueryData(["/api/user"], null);
      queryClient.clear();
      toast({
        title: "התנתקת בהצלחה",
        description: "להתראות!",
      });
    },
    onError: (error: Error) => {
      // Even if logout fails on server, clear local data
      localStorage.removeItem('auth_token');
      queryClient.setQueryData(["/api/user"], null);
      queryClient.clear();
    },
  });

  const isAuthenticated = !!user && !!token;
  const isLoadingAuth = !isTokenChecked || (isTokenChecked && !!token && isLoading);

  return {
    user,
    isAuthenticated,
    isLoading: isLoadingAuth,
    registerMutation,
    loginMutation,
    logoutMutation,
  };
}