import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import useFacebookAuth from "./useFacebookAuth";

interface FacebookPage {
  id: string;
  name: string;
  access_token?: string;
  category?: string;
  tasks?: string[];
  isHidden?: boolean;
}

interface PageHideResponse {
  success: boolean;
  totalPages: number;
  hiddenPages: number;
  failedPages: number;
  error?: string;
  manualInstructions?: boolean;
  message?: string;
}

export default function useFacebookPages() {
  const { isAuthenticated } = useFacebookAuth();

  // Query to get user's Facebook pages
  const { 
    data: pages = [], 
    isLoading,
    error
  } = useQuery<FacebookPage[]>({
    queryKey: ['/api/facebook/pages'],
    enabled: isAuthenticated,
  });
  
  // Mutation to hide pages
  const hideMutation = useMutation<PageHideResponse, Error, void>({
    mutationFn: async () => {
      const res = await fetch('/api/facebook/hide-pages', {
        method: 'POST',
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'שגיאה בהסתרת דפים');
      }
      
      return res.json();
    },
    onSuccess: (data) => {
      if (data.manualInstructions) {
        toast({
          title: 'הסתרת דפים',
          description: data.message || 'הדפים סומנו להסתרה. יש להשלים את הפעולות באתר פייסבוק.',
        });
      } else {
        toast({
          title: data.success ? 'הצלחה' : 'הסתרה חלקית',
          description: `הוסתרו ${data.hiddenPages} מתוך ${data.totalPages} דפים${data.error ? `. שגיאה: ${data.error}` : ''}`,
          variant: data.success ? 'default' : 'destructive',
        });
      }
      
      // Refresh pages data
      queryClient.invalidateQueries({ queryKey: ['/api/facebook/pages'] });
    },
    onError: (error) => {
      toast({
        title: 'שגיאה',
        description: `שגיאה בהסתרת דפים: ${error.message}`,
        variant: 'destructive',
      });
    }
  });
  
  // Mutation to restore pages
  const restoreMutation = useMutation<PageHideResponse, Error, void>({
    mutationFn: async () => {
      const res = await fetch('/api/facebook/restore-pages', {
        method: 'POST',
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'שגיאה בשחזור דפים');
      }
      
      return res.json();
    },
    onSuccess: (data) => {
      if (data.manualInstructions) {
        toast({
          title: 'שחזור דפים',
          description: data.message || 'הדפים סומנו לשחזור. יש להשלים את הפעולות באתר פייסבוק.',
        });
      } else {
        toast({
          title: data.success ? 'הצלחה' : 'שחזור חלקי',
          description: `שוחזרו ${data.hiddenPages} מתוך ${data.totalPages} דפים${data.error ? `. שגיאה: ${data.error}` : ''}`,
          variant: data.success ? 'default' : 'destructive',
        });
      }
      
      // Refresh pages data
      queryClient.invalidateQueries({ queryKey: ['/api/facebook/pages'] });
    },
    onError: (error) => {
      toast({
        title: 'שגיאה',
        description: `שגיאה בשחזור דפים: ${error.message}`,
        variant: 'destructive',
      });
    }
  });
  
  // Function to call hide pages
  const hidePages = () => {
    if (pages.length === 0) {
      toast({
        title: 'אין דפים',
        description: 'לא נמצאו דפים להסתרה',
        variant: 'destructive',
      });
      return;
    }
    
    hideMutation.mutate();
  };
  
  // Function to call restore pages
  const restorePages = () => {
    if (pages.length === 0) {
      toast({
        title: 'אין דפים',
        description: 'לא נמצאו דפים לשחזור',
        variant: 'destructive',
      });
      return;
    }
    
    restoreMutation.mutate();
  };
  
  return {
    pages,
    isLoading,
    error,
    hidePages,
    restorePages,
    isHiding: hideMutation.isPending,
    isRestoring: restoreMutation.isPending
  };
}