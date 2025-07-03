import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export interface InstagramPost {
  id: string;
  caption: string;
  timestamp: string;
  media_type: string;
  permalink: string;
}

export default function useInstagramPosts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery<InstagramPost[]>({
    queryKey: ["/api/instagram/posts"],
    retry: false,
  });

  const hideMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/instagram/hide");
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "הצלחה",
        description: data.message || "פוסטים באינסטגרם הוסתרו",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/instagram/posts"] });
    },
    onError: (error: any) => {
      toast({
        title: "שגיאה",
        description: error.message || "לא ניתן להסתיר פוסטים באינסטגרם",
        variant: "destructive",
      });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/instagram/restore");
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "הצלחה",
        description: data.message || "פוסטים באינסטגרם שוחזרו",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/instagram/posts"] });
    },
    onError: (error: any) => {
      toast({
        title: "שגיאה",
        description: error.message || "לא ניתן לשחזר פוסטים באינסטגרם",
        variant: "destructive",
      });
    },
  });

  return {
    ...query,
    hidePosts: hideMutation.mutate,
    isHiding: hideMutation.isPending,
    restorePosts: restoreMutation.mutate,
    isRestoring: restoreMutation.isPending,
  };
}