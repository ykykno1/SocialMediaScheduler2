import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings } from '@shared/schema';

export default function useSettings() {
  const queryClient = useQueryClient();

  // Fetch settings
  const { 
    data: settings, 
    isLoading, 
    isError, 
    error 
  } = useQuery<Settings>({
    queryKey: ['/api/settings'],
    refetchOnWindowFocus: false,
  });

  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: async (newSettings: Settings) => {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSettings),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update settings');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      // Update settings in cache
      queryClient.setQueryData(['/api/settings'], data);
    }
  });

  return {
    settings: settings || {
      autoSchedule: true,
      hideTime: '18:30',
      restoreTime: '19:45',
      timeZone: 'Asia/Jerusalem',
      exceptedPostIds: [],
      lastHideOperation: null,
      lastRestoreOperation: null,
    },
    isLoading,
    isError,
    error,
    updateSettings: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,
  };
}