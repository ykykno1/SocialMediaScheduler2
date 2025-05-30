import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { PrivacyStatus, SupportedPlatform } from "@shared/schema";

export function usePrivacyStatus(platform: SupportedPlatform) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get privacy statuses for a platform
  const { data: privacyStatuses = [], isLoading } = useQuery<PrivacyStatus[]>({
    queryKey: [`/api/privacy-status/${platform}`],
  });

  // Toggle content lock
  const toggleLockMutation = useMutation({
    mutationFn: async ({ contentId }: { contentId: string }) => {
      const response = await fetch('/api/toggle-content-lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, contentId })
      });
      
      if (!response.ok) {
        throw new Error('Failed to toggle content lock');
      }
      
      return await response.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: data.isLocked ? "תוכן נעול" : "תוכן שוחרר",
        description: data.isLocked 
          ? "התוכן לא ישוחזר אוטומטית בסוף שבת"
          : "התוכן ישוחזר אוטומטית בסוף שבת",
      });
      queryClient.invalidateQueries({ 
        queryKey: [`/api/privacy-status/${platform}`] 
      });
    },
    onError: () => {
      toast({
        title: "שגיאה",
        description: "לא ניתן לשנות מצב נעילה",
        variant: "destructive",
      });
    }
  });

  // Update privacy status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ 
      contentId, 
      originalStatus, 
      currentStatus, 
      wasHiddenByUser 
    }: {
      contentId: string;
      originalStatus: string;
      currentStatus: string;
      wasHiddenByUser: boolean;
    }) => {
      const response = await fetch('/api/privacy-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          platform, 
          contentId, 
          originalStatus, 
          currentStatus, 
          wasHiddenByUser 
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update privacy status');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [`/api/privacy-status/${platform}`] 
      });
    }
  });

  // Helper function to get privacy status for a specific content item
  const getContentStatus = (contentId: string): PrivacyStatus | undefined => {
    return privacyStatuses.find(status => status.contentId === contentId);
  };

  // Helper function to check if content is locked
  const isContentLocked = (contentId: string): boolean => {
    const status = getContentStatus(contentId);
    return status?.isLockedByUser || false;
  };

  // Helper function to check if content was originally hidden
  const wasOriginallyHidden = (contentId: string): boolean => {
    const status = getContentStatus(contentId);
    return status?.wasHiddenByUser || false;
  };

  return {
    privacyStatuses,
    isLoading,
    toggleLock: toggleLockMutation.mutate,
    isToggling: toggleLockMutation.isPending,
    updateStatus: updateStatusMutation.mutate,
    isUpdating: updateStatusMutation.isPending,
    getContentStatus,
    isContentLocked,
    wasOriginallyHidden
  };
}