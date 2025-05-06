import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { YouTubeVideo } from '@shared/schema';

export default function useYouTubeVideos() {
  const queryClient = useQueryClient();

  // Get all videos
  const { 
    data: videos = [],
    isLoading,
    error,
    refetch
  } = useQuery<YouTubeVideo[]>({
    queryKey: ['/api/youtube/videos'],
    refetchOnWindowFocus: false,
    retry: 1,
    enabled: true
  });

  // Hide a single video
  const hideVideoMutation = useMutation({
    mutationFn: async (videoId: string) => {
      const response = await fetch(`/api/youtube/videos/${videoId}/privacy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ privacyStatus: 'private' })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'שגיאה בהסתרת הסרטון');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "הסרטון הוסתר בהצלחה",
        description: "הסרטון הוגדר כפרטי",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/youtube/videos'] });
    },
    onError: (error) => {
      toast({
        title: "שגיאה בהסתרת הסרטון",
        description: error instanceof Error ? error.message : 'שגיאה לא ידועה',
        variant: "destructive",
      });
    }
  });

  // Show a single video
  const showVideoMutation = useMutation({
    mutationFn: async (videoId: string) => {
      const response = await fetch(`/api/youtube/videos/${videoId}/privacy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ privacyStatus: 'public' })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'שגיאה בשחזור הסרטון');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "הסרטון שוחזר בהצלחה",
        description: "הסרטון הוגדר כציבורי",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/youtube/videos'] });
    },
    onError: (error) => {
      toast({
        title: "שגיאה בשחזור הסרטון",
        description: error instanceof Error ? error.message : 'שגיאה לא ידועה',
        variant: "destructive",
      });
    }
  });

  // Hide all videos
  const hideAllMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/youtube/videos/hide-all', {
        method: 'POST'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'שגיאה בהסתרת כל הסרטונים');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "הסרטונים הוסתרו בהצלחה",
        description: `${data.hiddenCount} סרטונים הוגדרו כפרטיים`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/youtube/videos'] });
    },
    onError: (error) => {
      toast({
        title: "שגיאה בהסתרת הסרטונים",
        description: error instanceof Error ? error.message : 'שגיאה לא ידועה',
        variant: "destructive",
      });
    }
  });

  // Restore all videos
  const restoreAllMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/youtube/videos/restore-all', {
        method: 'POST'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'שגיאה בשחזור הסרטונים');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "הסרטונים שוחזרו בהצלחה",
        description: `${data.restoredCount} סרטונים שוחזרו למצבם הקודם`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/youtube/videos'] });
    },
    onError: (error) => {
      toast({
        title: "שגיאה בשחזור הסרטונים",
        description: error instanceof Error ? error.message : 'שגיאה לא ידועה',
        variant: "destructive",
      });
    }
  });

  const hideVideo = (videoId: string) => {
    hideVideoMutation.mutate(videoId);
  };

  const showVideo = (videoId: string) => {
    showVideoMutation.mutate(videoId);
  };

  const hideAllVideos = () => {
    hideAllMutation.mutate();
  };

  const restoreAllVideos = () => {
    restoreAllMutation.mutate();
  };

  return {
    videos,
    isLoading,
    error,
    hideVideo,
    showVideo,
    hideAllVideos,
    restoreAllVideos,
    isHiding: hideVideoMutation.isPending || hideAllMutation.isPending,
    isRestoring: showVideoMutation.isPending || restoreAllMutation.isPending,
    refetch
  };
}