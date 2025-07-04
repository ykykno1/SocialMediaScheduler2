import { useQuery } from '@tanstack/react-query';

interface PlatformStatus {
  platform: string;
  hasValidToken: boolean;
  isConnected: boolean;
  expiresAt?: number;
}

interface PlatformStatusResponse {
  youtube: PlatformStatus;
  facebook: PlatformStatus;
}

export function usePlatformStatus() {
  return useQuery<PlatformStatusResponse>({
    queryKey: ['/api/platform-status'],
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 15000, // Consider data fresh for 15 seconds
  });
}

export function useCountdownTimer() {
  return useQuery({
    queryKey: ['/api/scheduler/next-operation'],
    refetchInterval: 1000, // Update every second for countdown
    staleTime: 0, // Always fresh for real-time updates
  });
}