import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export function useAuth() {
  const { toast } = useToast();

  const { data: user, isLoading, error } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
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
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}