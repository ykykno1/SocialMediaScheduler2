import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { FacebookPost } from '@shared/schema';

export default function useFacebookPosts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query to fetch Facebook posts
  const {
    data: posts = [],
    isLoading,
    error,
    refetch,
  } = useQuery<FacebookPost[]>({
    queryKey: ['/api/facebook/posts'],
    retry: 1, // Only retry once since this might fail if not authenticated
    enabled: true, // Always try to fetch initially
    staleTime: 0, // Always refetch when component mounts
  });

  // Mutation for hiding posts (setting privacy to "Only Me")
  const hidePostsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/facebook/hide');
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/facebook/posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/history'] });
      
      toast({
        title: 'תוכן הוסתר בהצלחה',
        description: `הוסתרו ${data.hiddenPosts} פריטים בהצלחה`,
      });
    },
    onError: (error) => {
      toast({
        title: 'שגיאה בהסתרת תוכן',
        description: error instanceof Error ? error.message : 'אירעה שגיאה בהסתרת תוכן',
        variant: 'destructive',
      });
    }
  });

  // Mutation for restoring posts (setting privacy back to "Public")
  const restorePostsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/facebook/restore');
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/facebook/posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/history'] });
      
      toast({
        title: 'תוכן שוחזר בהצלחה',
        description: `שוחזרו ${data.restoredPosts} פריטים בהצלחה`,
      });
    },
    onError: (error) => {
      toast({
        title: 'שגיאה בשחזור תוכן',
        description: error instanceof Error ? error.message : 'אירעה שגיאה בשחזור תוכן',
        variant: 'destructive',
      });
    }
  });

  // Get hidden and visible posts - including both SELF and ONLY_ME values for hidden posts
  // Ensure posts is always an array before filtering
  const safePosts = Array.isArray(posts) ? posts : [];
  const hiddenPosts = safePosts.filter(post => post.privacy?.value === 'SELF' || post.privacy?.value === 'ONLY_ME');
  const visiblePosts = safePosts.filter(post => post.privacy?.value !== 'SELF' && post.privacy?.value !== 'ONLY_ME');

  return {
    posts: safePosts,
    hiddenPosts,
    visiblePosts,
    isLoading,
    error,
    refetch,
    hidePosts: () => hidePostsMutation.mutate(),
    restorePosts: () => restorePostsMutation.mutate(),
    isHiding: hidePostsMutation.isPending,
    isRestoring: restorePostsMutation.isPending,
  };
}