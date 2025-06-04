import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Youtube, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  viewCount: string;
  isHidden: boolean;
}

export default function YouTubeSimplePage() {
  const [isConnected, setIsConnected] = useState(false);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [channelTitle, setChannelTitle] = useState('');
  const { toast } = useToast();

  // Check connection status
  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/youtube/status', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsConnected(data.connected);
        setChannelTitle(data.channelTitle || '');
      }
    } catch (error) {
      console.error('Failed to check YouTube status:', error);
    }
  };

  const connectToYouTube = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/youtube/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      if (response.ok) {
        const data = await response.json();
        setIsConnected(true);
        setChannelTitle(data.channelTitle);
        toast({
          title: "התחברות הצליחה",
          description: "התחברת בהצלחה ל-YouTube",
        });
        loadVideos();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'שגיאה בהתחברות');
      }
    } catch (error: any) {
      toast({
        title: "שגיאה בהתחברות",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadVideos = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/youtube/videos', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (response.ok) {
        const data = await response.json();
        setVideos(data.videos || []);
      } else {
        throw new Error('שגיאה בטעינת הסרטונים');
      }
    } catch (error: any) {
      toast({
        title: "שגיאה בטעינת סרטונים",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleVideoVisibility = async (videoId: string, currentlyHidden: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const action = currentlyHidden ? 'show' : 'hide';
      const response = await fetch(`/api/youtube/videos/${videoId}/${action}`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (response.ok) {
        // Update local state
        setVideos(prev => prev.map(video => 
          video.id === videoId 
            ? { ...video, isHidden: !currentlyHidden }
            : video
        ));
        
        toast({
          title: currentlyHidden ? "הסרטון הוצג" : "הסרטון הוסתר",
          description: currentlyHidden ? "הסרטון חזר להיות גלוי" : "הסרטון הוסתר מהציבור",
        });
      } else {
        throw new Error('שגיאה בעדכון הסרטון');
      }
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const hideAllVideos = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/youtube/hide-all', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "הוסתרו כל הסרטונים",
          description: `הוסתרו ${data.hiddenCount} סרטונים בהצלחה`,
        });
        loadVideos();
      } else {
        throw new Error('שגיאה בהסתרת הסרטונים');
      }
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const showAllVideos = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/youtube/show-all', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "הוצגו כל הסרטונים",
          description: `הוצגו ${data.shownCount} סרטונים בהצלחה`,
        });
        loadVideos();
      } else {
        throw new Error('שגיאה בהצגת הסרטונים');
      }
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Youtube className="h-8 w-8 text-red-600" />
            ניהול YouTube
          </h1>
          <p className="text-muted-foreground">
            נהל את הסרטונים שלך ב-YouTube עבור שבת
          </p>
        </div>

        {!isConnected ? (
          <Card>
            <CardHeader>
              <CardTitle>התחבר ל-YouTube</CardTitle>
              <CardDescription>
                התחבר לחשבון YouTube שלך כדי לנהל את הסרטונים
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={connectToYouTube} 
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    מתחבר...
                  </>
                ) : (
                  <>
                    <Youtube className="ml-2 h-4 w-4" />
                    התחבר ל-YouTube
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>ערוץ YouTube: {channelTitle}</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    מחובר
                  </Badge>
                </CardTitle>
                <CardDescription>
                  נהל את כל הסרטונים בערוץ שלך
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-4">
                  <Button onClick={loadVideos} disabled={loading}>
                    {loading ? (
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    ) : null}
                    רענן רשימת סרטונים
                  </Button>
                  <Button onClick={hideAllVideos} disabled={loading} variant="destructive">
                    הסתר הכל
                  </Button>
                  <Button onClick={showAllVideos} disabled={loading} variant="outline">
                    הצג הכל
                  </Button>
                </div>
              </CardContent>
            </Card>

            {videos.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {videos.map((video) => (
                  <Card key={video.id} className="overflow-hidden">
                    <div className="aspect-video relative">
                      <img 
                        src={video.thumbnail} 
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2">
                        <Badge variant={video.isHidden ? "destructive" : "default"}>
                          {video.isHidden ? "מוסתר" : "גלוי"}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-sm mb-2 line-clamp-2">
                        {video.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-3">
                        {video.viewCount} צפיות
                      </p>
                      <Button
                        size="sm"
                        variant={video.isHidden ? "default" : "outline"}
                        onClick={() => toggleVideoVisibility(video.id, video.isHidden)}
                        className="w-full"
                      >
                        {video.isHidden ? (
                          <>
                            <Eye className="ml-2 h-4 w-4" />
                            הצג
                          </>
                        ) : (
                          <>
                            <EyeOff className="ml-2 h-4 w-4" />
                            הסתר
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {isConnected && videos.length === 0 && !loading && (
              <Card>
                <CardContent className="text-center py-8">
                  <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">אין סרטונים</h3>
                  <p className="text-muted-foreground">
                    לא נמצאו סרטונים בערוץ שלך
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

