
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface User {
  id: string;
  email: string;
  username: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  username: string;
}

export function useAuth() {
  const { toast } = useToast();

  const { data: user, isLoading, error } = useQuery({
    queryKey: ["user"],
    queryFn: async (): Promise<User | null> => {
      const token = localStorage.getItem('token');
      if (!token) return null;

      const response = await fetch("/api/user", {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        return null;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch user");
      }

      return response.json();
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Login failed");
      }

      return response.json();
    },
    onSuccess: (data) => {
      localStorage.setItem('token', data.token);
      queryClient.setQueryData(["user"], data.user);
      toast({
        title: "התחברת בהצלחה",
        description: "ברוך הבא!",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "שגיאה בהתחברות",
        description: error.message,
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Registration failed");
      }

      return response.json();
    },
    onSuccess: (data) => {
      localStorage.setItem('token', data.token);
      queryClient.setQueryData(["user"], data.user);
      toast({
        title: "נרשמת בהצלחה",
        description: "ברוך הבא!",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "שגיאה בהרשמה",
        description: error.message,
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('token');
      if (token) {
        await fetch("/api/logout", { 
          method: "POST",
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
    },
    onSuccess: () => {
      localStorage.removeItem('token');
      queryClient.setQueryData(["user"], null);
      queryClient.clear();
      toast({
        title: "התנתקת בהצלחה",
        description: "שבת שלום!",
      });
    },
    onError: () => {
      localStorage.removeItem('token');
      queryClient.setQueryData(["user"], null);
      queryClient.clear();
    },
  });

  return {
    user: user || null,
    isLoading,
    error,
    isAuthenticated: !!user,
    loginMutation,
    registerMutation,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}
