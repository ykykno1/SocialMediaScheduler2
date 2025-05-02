import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FacebookPost } from '@shared/schema';

export default function useFacebookPosts() {
  const queryClient = useQueryClient();

  // Fetch posts
  const { 
    data: posts, 
    isLoading, 
    isError, 
    error,
    refetch 
  } = useQuery<FacebookPost[]>({
    queryKey: ['/api/facebook/posts'],
    refetchOnWindowFocus: false,
    retry: false,
  });

  // Hide posts mutation
  const hideMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/facebook/hide', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to hide posts');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate posts query after hiding
      queryClient.invalidateQueries({ queryKey: ['/api/facebook/posts'] });
      // Invalidate history to show new operation
      queryClient.invalidateQueries({ queryKey: ['/api/history'] });
    }
  });

  // Restore posts mutation
  const restoreMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/facebook/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to restore posts');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate posts query after restoring
      queryClient.invalidateQueries({ queryKey: ['/api/facebook/posts'] });
      // Invalidate history to show new operation
      queryClient.invalidateQueries({ queryKey: ['/api/history'] });
    }
  });

  return {
    posts: posts || [],
    isLoading,
    isError,
    error,
    refetch,
    hidePosts: hideMutation.mutate,
    isHiding: hideMutation.isPending,
    hideError: hideMutation.error,
    restorePosts: restoreMutation.mutate,
    isRestoring: restoreMutation.isPending,
    restoreError: restoreMutation.error,
    lastHideResult: hideMutation.data,
    lastRestoreResult: restoreMutation.data,
  };
}