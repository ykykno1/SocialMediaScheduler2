import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Youtube, LogOut, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface YouTubeVideo {
  id: string;
  title: string;
  thumbnailUrl: string;
  privacyStatus: 'public' | 'private' | 'unlisted';
}

const SimpleYouTubeManager = () => {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [hideAllDisabled, setHideAllDisabled] = useState(false);
  const { toast } = useToast();

  // Check auth status
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/youtube/auth-status', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsConnected(data.isAuthenticated);
        if (data.isAuthenticated) {
          loadVideos();
        } else {
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsLoading(false);
    }
  };

  const loadVideos = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/youtube/videos', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      if (response.ok) {
        const data = await response.json();
        setVideos(data.videos || []);
      }
    } catch (error) {
      console.error('Failed to load videos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm("האם אתה בטוח שברצונך להתנתק מיוטיוב?")) {
      try {
        const token = localStorage.getItem('auth_token');
        await fetch('/api/youtube/disconnect', {
          method: 'POST',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        
        setIsConnected(false);
        setVideos([]);
        toast({
          title: "התנתקות בוצעה בהצלחה",
          description: "התנתקת מיוטיוב בהצלחה"
        });
      } catch (error) {
        toast({
          title: "שגיאה בהתנתקות",
          description: "נכשל בהתנתקות מיוטיוב",
          variant: "destructive"
        });
      }
    }
  };

  const handleHideAll = async () => {
    if (window.confirm("האם אתה בטוח שברצונך להסתיר את כל הסרטונים?")) {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch('/api/youtube/hide-all', {
          method: 'POST',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        
        if (response.ok) {
          setHideAllDisabled(true);
          loadVideos();
          toast({
            title: "הסרטונים הוסתרו",
            description: "כל הסרטונים הציבוריים הוסתרו בהצלחה"
          });
        }
      } catch (error) {
        toast({
          title: "שגיאה",
          description: "נכשל בהסתרת הסרטונים",
          variant: "destructive"
        });
      }
    }
  };

  const handleRestoreAll = async () => {
    if (window.confirm("האם אתה בטוח שברצונך לשחזר את כל הסרטונים?")) {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch('/api/youtube/show-all', {
          method: 'POST',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        
        if (response.ok) {
          setHideAllDisabled(false);
          loadVideos();
          toast({
            title: "הסרטונים שוחזרו",
            description: "כל הסרטונים שוחזרו בהצלחה"
          });
        }
      } catch (error) {
        toast({
          title: "שגיאה",
          description: "נכשל בשחזור הסרטונים",
          variant: "destructive"
        });
      }
    }
  };

  const handleToggleVideo = async (videoId: string, currentStatus: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const newStatus = currentStatus === 'public' ? 'private' : 'public';
      
      const response = await fetch(`/api/youtube/video/${videoId}/privacy`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ privacyStatus: newStatus })
      });
      
      if (response.ok) {
        loadVideos();
        toast({
          title: "סטטוס עודכן",
          description: `הסרטון ${newStatus === 'public' ? 'פורסם' : 'הוסתר'} בהצלחה`
        });
      }
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "נכשל בעדכון הסרטון",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">טוען...</div>
        </CardContent>
      </Card>
    );
  }

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Youtube className="h-5 w-5 text-red-500" />
            לא מחובר ליוטיוב
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">יש להתחבר ליוטיוב כדי לנהל סרטונים</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Youtube className="h-5 w-5 text-red-500" />
              סרטוני YouTube
            </CardTitle>
            <p className="text-sm text-gray-600">
              סה"כ {videos.length} סרטונים
            </p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700"
          >
            <LogOut className="mr-2 h-4 w-4" />
            התנתק
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Button
            onClick={handleRestoreAll}
            variant="outline"
            disabled={videos.filter((v: any) => v.privacyStatus === "private").length === 0}
          >
            <Eye className="mr-2 h-4 w-4" />
            שחזר הכל
          </Button>
          <Button
            onClick={handleHideAll}
            variant="destructive"
            disabled={hideAllDisabled || videos.filter((v: any) => v.privacyStatus === "public").length === 0}
          >
            <EyeOff className="mr-2 h-4 w-4" />
            הסתר הכל
          </Button>
        </div>
        
        {videos.length > 0 && (
          <div className="grid gap-3">
            {videos.slice(0, 5).map((video: any) => (
              <div key={video.id} className="flex items-center gap-3 p-3 border rounded">
                <img 
                  src={video.thumbnailUrl} 
                  alt={video.title}
                  className="w-16 h-12 object-cover rounded"
                />
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{video.title}</h4>
                  <span className={`text-xs px-2 py-1 rounded ${
                    video.privacyStatus === 'public' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {video.privacyStatus === 'public' ? 'ציבורי' : 'פרטי'}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant={video.privacyStatus === 'public' ? 'destructive' : 'default'}
                  onClick={() => handleToggleVideo(video.id, video.privacyStatus)}
                >
                  {video.privacyStatus === 'public' ? (
                    <>
                      <EyeOff className="mr-1 h-3 w-3" />
                      הסתר
                    </>
                  ) : (
                    <>
                      <Eye className="mr-1 h-3 w-3" />
                      פרסם
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SimpleYouTubeManager;