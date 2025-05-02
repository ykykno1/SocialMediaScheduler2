import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export interface Settings {
  autoSchedule: boolean;
  hideTime: string;
  restoreTime: string;
  timeZone: string;
}

export default function useSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query to fetch settings
  const {
    data: settings = {
      autoSchedule: false,
      hideTime: '18:30',
      restoreTime: '20:30',
      timeZone: 'Asia/Jerusalem'
    },
    isLoading,
    error,
  } = useQuery<Settings>({
    queryKey: ['/api/settings'],
  });

  // Mutation for updating settings
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<Settings>) => {
      const res = await apiRequest('POST', '/api/settings', newSettings);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: 'הגדרות נשמרו',
        description: 'ההגדרות שלך נשמרו בהצלחה',
      });
    },
    onError: (error) => {
      toast({
        title: 'שגיאה בשמירת הגדרות',
        description: error instanceof Error ? error.message : 'אירעה שגיאה בשמירת ההגדרות',
        variant: 'destructive',
      });
    }
  });

  return {
    settings,
    isLoading,
    error,
    updateSettings: (newSettings: Partial<Settings>) => updateSettingsMutation.mutate(newSettings),
    isUpdating: updateSettingsMutation.isPending,
  };
}