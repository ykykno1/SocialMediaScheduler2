import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { FacebookPage } from '@shared/schema';

export default function useFacebookPages() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query to fetch Facebook pages
  const {
    data: pages = [],
    isLoading,
    error,
    refetch,
  } = useQuery<FacebookPage[]>({
    queryKey: ['/api/facebook/pages'],
    retry: 1, // Only retry once since this might fail if not authenticated
  });

  // Mutation for hiding pages
  const hidePagesMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/facebook/hide-pages');
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/facebook/pages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/history'] });
      
      toast({
        title: 'עמודים הוסתרו בהצלחה',
        description: `הוסתרו ${data.hiddenPages} עמודים בהצלחה`,
      });
    },
    onError: (error) => {
      toast({
        title: 'שגיאה בהסתרת עמודים',
        description: error instanceof Error ? error.message : 'אירעה שגיאה בהסתרת עמודים',
        variant: 'destructive',
      });
    }
  });

  // Mutation for restoring pages
  const restorePagesMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/facebook/restore-pages');
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/facebook/pages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/history'] });
      
      toast({
        title: 'עמודים שוחזרו בהצלחה',
        description: `שוחזרו ${data.restoredPages} עמודים בהצלחה`,
      });
    },
    onError: (error) => {
      toast({
        title: 'שגיאה בשחזור עמודים',
        description: error instanceof Error ? error.message : 'אירעה שגיאה בשחזור עמודים',
        variant: 'destructive',
      });
    }
  });

  // Get hidden and visible pages
  const hiddenPages = pages.filter(page => page.isHidden === true) || [];
  const visiblePages = pages.filter(page => page.isHidden !== true) || [];

  return {
    pages,
    hiddenPages,
    visiblePages,
    isLoading,
    error,
    refetch,
    hidePages: () => hidePagesMutation.mutate(),
    restorePages: () => restorePagesMutation.mutate(),
    isHiding: hidePagesMutation.isPending,
    isRestoring: restorePagesMutation.isPending,
  };
}