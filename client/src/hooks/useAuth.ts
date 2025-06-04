import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  email?: string;
  accountType: 'free' | 'youtube_pro' | 'premium';
  createdAt: string;
  hideCount: number;
  maxHides: number;
}

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
}

export function useAuth() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current user
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ['/api/user'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/user');
        if (response.status === 401) {
          return null;
        }
        return await response.json();
      } catch (error) {
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const response = await apiRequest('POST', '/api/login', credentials);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }
      return await response.json();
    },
    onSuccess: (userData) => {
      if (userData.token) {
        localStorage.setItem('authToken', userData.token);
      }
      queryClient.setQueryData(['/api/user'], userData);
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({
        title: 'התחברות בוצעה בהצלחה',
        description: 'ברוך הבא בחזרה!'
      });
    },
    onError: (error) => {
      toast({
        title: 'שגיאת התחברות',
        description: error instanceof Error ? error.message : 'אירעה שגיאה בהתחברות',
        variant: 'destructive'
      });
    }
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      const response = await apiRequest('POST', '/api/register', userData);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Registration failed');
      }
      return await response.json();
    },
    onSuccess: (userData) => {
      if (userData.token) {
        localStorage.setItem('authToken', userData.token);
      }
      queryClient.setQueryData(['/api/user'], userData);
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({
        title: 'הרשמה בוצעה בהצלחה',
        description: 'ברוך הבא לרובוט שבת!'
      });
    },
    onError: (error) => {
      toast({
        title: 'שגיאת רישום',
        description: error instanceof Error ? error.message : 'אירעה שגיאה ברישום',
        variant: 'destructive'
      });
    }
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/logout');
      return response;
    },
    onSuccess: () => {
      localStorage.removeItem('authToken');
      queryClient.setQueryData(['/api/user'], null);
      queryClient.clear();
      toast({
        title: 'התנתקות בוצעה בהצלחה',
        description: 'להתראות!'
      });
    },
    onError: (error) => {
      toast({
        title: 'שגיאת התנתקות',
        description: 'אירעה שגיאה בהתנתקות',
        variant: 'destructive'
      });
    }
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
  };
}