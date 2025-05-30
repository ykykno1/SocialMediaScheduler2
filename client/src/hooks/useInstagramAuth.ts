import { useQuery } from "@tanstack/react-query";

interface InstagramAuthStatus {
  isAuthenticated: boolean;
  platform: string;
  user?: {
    id: string;
    name: string;
  };
}

export default function useInstagramAuth() {
  const { data = { isAuthenticated: false, platform: 'instagram' }, isLoading } = useQuery<InstagramAuthStatus>({
    queryKey: ["/api/instagram/auth-status"],
    retry: false,
  });

  return {
    isAuthenticated: data.isAuthenticated,
    user: data.user,
    isLoading,
  };
}