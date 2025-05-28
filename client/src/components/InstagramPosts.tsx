import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Instagram, Eye, EyeOff, Calendar, Heart, MessageCircle } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function InstagramPosts() {
  const { toast } = useToast();
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set());

  // קבלת פוסטים
  const { data: postsData, isLoading, error } = useQuery({
    queryKey: ["/api/instagram/posts"],
    refetchInterval: 10000,
  });

  // הסתרת פוסט יחיד
  const hidePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      await apiRequest("POST", `/api/instagram/posts/${postId}/hide`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/instagram/posts"] });
      toast({
        title: "פוסט הוסתר",
        description: "הפוסט הוסתר בהצלחה מהפיד",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה בהסתרת פוסט",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // חשיפת פוסט יחיד
  const showPostMutation = useMutation({
    mutationFn: async (postId: string) => {
      await apiRequest("POST", `/api/instagram/posts/${postId}/show`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/instagram/posts"] });
      toast({
        title: "פוסט חשוף",
        description: "הפוסט חזר להיות גלוי בפיד",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה בחשיפת פוסט",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // הסתרת כל הפוסטים
  const hideAllMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/instagram/posts/hide-all");
      return response.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/instagram/posts"] });
      toast({
        title: "הפוסטים הוסתרו",
        description: `${result.hidden} פוסטים הוסתרו בהצלחה`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה בהסתרת פוסטים",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // חשיפת כל הפוסטים
  const showAllMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/instagram/posts/show-all");
      return response.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/instagram/posts"] });
      toast({
        title: "הפוסטים חשופים",
        description: `${result.shown} פוסטים חזרו להיות גלויים`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה בחשיפת פוסטים",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const togglePostSelection = (postId: string) => {
    const newSelected = new Set(selectedPosts);
    if (newSelected.has(postId)) {
      newSelected.delete(postId);
    } else {
      newSelected.add(postId);
    }
    setSelectedPosts(newSelected);
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Instagram className="h-5 w-5" />
            פוסטים באינסטגרם
          </CardTitle>
          <CardDescription>
            {error.message.includes("authenticated") 
              ? "התחבר לאינסטגרם כדי לראות פוסטים"
              : "שגיאה בטעינת פוסטים"}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Instagram className="h-5 w-5" />
            פוסטים באינסטגרם
          </CardTitle>
          <CardDescription>טוען פוסטים...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const posts = postsData?.posts || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Instagram className="h-5 w-5" />
          פוסטים באינסטגרם ({posts.length})
        </CardTitle>
        <CardDescription>
          ניהול פוסטים באינסטגרם - הסתרה וחשיפה אוטומטית
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* כפתורי פעולה כלליים */}
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={() => hideAllMutation.mutate()}
            disabled={hideAllMutation.isPending || posts.length === 0}
            variant="destructive"
            size="sm"
          >
            <EyeOff className="h-4 w-4 mr-2" />
            {hideAllMutation.isPending ? "מסתיר..." : "הסתר הכל"}
          </Button>
          
          <Button
            onClick={() => showAllMutation.mutate()}
            disabled={showAllMutation.isPending || posts.length === 0}
            variant="default"
            size="sm"
          >
            <Eye className="h-4 w-4 mr-2" />
            {showAllMutation.isPending ? "חושף..." : "חשוף הכל"}
          </Button>
        </div>

        {/* רשימת פוסטים */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {posts.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              לא נמצאו פוסטים באינסטגרם
            </div>
          ) : (
            posts.map((post: any) => (
              <div key={post.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* תמונה/וידאו */}
                    {post.media_url && (
                      <img
                        src={post.media_url}
                        alt="Post media"
                        className="w-16 h-16 object-cover rounded mb-2"
                      />
                    )}
                    
                    {/* תוכן הפוסט */}
                    <p className="text-sm font-medium line-clamp-2">
                      {post.caption || "פוסט ללא תיאור"}
                    </p>
                    
                    {/* מטא-דטה */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(post.timestamp).toLocaleDateString("he-IL")}
                      </span>
                      
                      {post.like_count !== undefined && (
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {post.like_count}
                        </span>
                      )}
                      
                      {post.comments_count !== undefined && (
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          {post.comments_count}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* סטטוס נראות */}
                    <Badge variant={post.is_hidden ? "destructive" : "default"}>
                      {post.is_hidden ? "מוסתר" : "גלוי"}
                    </Badge>
                    
                    {/* מתג הסתרה/חשיפה */}
                    <Switch
                      checked={!post.is_hidden}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          showPostMutation.mutate(post.id);
                        } else {
                          hidePostMutation.mutate(post.id);
                        }
                      }}
                      disabled={hidePostMutation.isPending || showPostMutation.isPending}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}