import { useQuery, useMutation, type UseMutationResult } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User, AuthResponse, RegisterRequest, LoginRequest } from "../../../shared/types";

type UserWithoutPassword = Omit<User, 'password'>;

export function useAuth() {
  const { toast } = useToast();

  // Get current user - only if token exists
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  
  const { data: user, isLoading, error } = useQuery<UserWithoutPassword>({
    queryKey: ["/api/user"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/user");
        return res; // apiRequest already returns JSON
      } catch (error) {
        // If token is invalid, clear it and return null
        if (error instanceof Error && (error.message.includes("401") || error.message.includes("INVALID_TOKEN"))) {
          localStorage.removeItem('auth_token');
          return null;
        }
        throw error;
      }
    },
    enabled: !!token, // Only run query if token exists
    retry: false,
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterRequest): Promise<AuthResponse> => {
      const res = await apiRequest("POST", "/api/register", credentials);
      return res; // apiRequest already returns JSON
    },
    onSuccess: (response: AuthResponse) => {
      // Store JWT token
      localStorage.setItem("auth_token", response.token);
      
      // Update query cache
      queryClient.setQueryData(["/api/user"], response.user);
      
      toast({
        title: "ברוך הבא!",
        description: "חשבונך נוצר בהצלחה",
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
      return res; // apiRequest already returns JSON
    },
    onSuccess: (response: AuthResponse) => {
      // Store JWT token
      localStorage.setItem("auth_token", response.token);
      
      // Update query cache
      queryClient.setQueryData(["/api/user"], response.user);
      
      toast({
        title: "ברוך השב!",
        description: "התחברת בהצלחה",
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
    mutationFn: async (): Promise<void> => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      // Remove JWT token
      localStorage.removeItem("auth_token");
      
      // Clear all platform-related data from localStorage
      localStorage.removeItem("facebook_auth");
      localStorage.removeItem("youtube_auth");
      localStorage.removeItem("instagram_auth");
      localStorage.removeItem("tiktok_auth");
      
      // Clear query cache completely
      queryClient.clear();
      
      toast({
        title: "התנתקת בהצלחה",
        description: "שבת שלום!",
      });
    },
    onError: (error: Error) => {
      // Even if logout fails on server, clear local storage
      localStorage.removeItem("auth_token");
      queryClient.setQueryData(["/api/user"], null);
      
      toast({
        title: "התנתקות",
        description: "התנתקת מהמערכת",
      });
    },
  });

  return {
    user: user || null,
    isLoading,
    error,
    isAuthenticated: !!user,
    register: registerMutation.mutate,
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    isRegistering: registerMutation.isPending,
    isLoggingIn: loginMutation.isPending,
    registerMutation,
    loginMutation,
    logoutMutation,
  };
}