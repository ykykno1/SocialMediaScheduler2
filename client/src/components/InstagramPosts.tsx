import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Instagram, ExternalLink, EyeOff, Eye } from "lucide-react";
import useInstagramPosts from "@/hooks/useInstagramPosts";

export default function InstagramPosts() {
  const { data: posts, isLoading, error, hidePosts, isHiding, restorePosts, isRestoring } = useInstagramPosts();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Instagram className="h-5 w-5" />
            פוסטים באינסטגרם
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Instagram className="h-5 w-5" />
            פוסטים באינסטגרם
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">שגיאה בטעינת פוסטים מאינסטגרם</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Instagram className="h-5 w-5" />
            פוסטים באינסטגרם
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">לא נמצאו פוסטים</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Instagram className="h-5 w-5" />
          פוסטים באינסטגרם
        </CardTitle>
        <CardDescription className="flex items-center justify-between">
          <span>{posts.length} פוסטים זמינים</span>
          <div className="flex gap-2">
            <Button
              onClick={() => hidePosts()}
              disabled={isHiding || isRestoring}
              size="sm"
              variant="outline"
            >
              {isHiding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  מסתיר...
                </>
              ) : (
                <>
                  <EyeOff className="mr-2 h-4 w-4" />
                  הסתר הכל
                </>
              )}
            </Button>
            <Button
              onClick={() => restorePosts()}
              disabled={isHiding || isRestoring}
              size="sm"
              variant="outline"
            >
              {isRestoring ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  משחזר...
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  שחזר הכל
                </>
              )}
            </Button>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {post.media_type}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                    {post.caption}
                  </p>
                  
                  <p className="text-xs text-muted-foreground">
                    {new Date(post.timestamp).toLocaleDateString('he-IL')}
                  </p>
                </div>
                
                {post.permalink !== "#" && (
                  <a
                    href={post.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 p-2 hover:bg-muted rounded-md transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}