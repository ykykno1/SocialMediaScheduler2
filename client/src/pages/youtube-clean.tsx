import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Youtube, Eye, EyeOff, Loader2, AlertCircle, ExternalLink, Unlink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  description: string;
  privacyStatus: string;
  isHidden: boolean;
  viewCount: string;
  isLocked?: boolean;
  lockReason?: string;
}

export default function YouTubeCleanPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [channelTitle, setChannelTitle] = useState('');
  const { toast } = useToast();

  const checkConnection = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch('/api/youtube/auth-status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsConnected(data.isAuthenticated);
        setChannelTitle(data.channelTitle || '');
        
        if (data.isAuthenticated) {
          loadVideos();
        }
      }
    } catch (error) {
      console.error('Failed to check connection:', error);
    }
  };

  const loadVideos = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch('/api/youtube/videos', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Received videos data:', data);
        setVideos(data.videos || []);
      } else {
        const error = await response.json();
        toast({
          title: "שגיאה בטעינת סרטונים",
          description: error.error || 'Failed to load videos',
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "שגיאה בטעינת סרטונים",
        description: "Failed to load videos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const connectYouTube = () => {
    const authUrl = `/api/youtube/auth?platform=youtube`;
    const popup = window.open(authUrl, 'youtube-auth', 'width=600,height=600');
    
    const checkClosed = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkClosed);
        checkConnection();
      }
    }, 1000);
  };

  const disconnectYouTube = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch('/api/youtube/disconnect', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        setIsConnected(false);
        setVideos([]);
        setChannelTitle('');
        toast({
          title: "הצלחה!",
          description: "התנתקת מיוטיוב בהצלחה",
        });
      } else {
        const error = await response.json();
        toast({
          title: "שגיאה",
          description: error.error || 'שגיאה בניתוק מיוטיוב',
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "שגיאה בניתוק מיוטיוב",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const hideVideo = async (videoId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`/api/youtube/video/${videoId}/hide`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        await loadVideos();
        toast({
          title: "הצלחה!",
          description: "הסרטון הוסתר בהצלחה",
        });
      } else {
        const error = await response.json();
        toast({
          title: "שגיאה",
          description: error.error || 'שגיאה בהסתרת הסרטון',
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "שגיאה בהסתרת הסרטון",
        variant: "destructive"
      });
    }
  };

  const showVideo = async (videoId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`/api/youtube/video/${videoId}/show`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        await loadVideos();
        toast({
          title: "הצלחה!",
          description: "הסרטון הוצג בהצלחה",
        });
      } else {
        const error = await response.json();
        toast({
          title: "שגיאה",
          description: error.error || 'שגיאה בהצגת הסרטון',
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "שגיאה בהצגת הסרטון",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data.platform === 'youtube' && event.data.code) {
        console.log('Received YouTube auth code:', event.data.code);
        setLoading(true);
        
        try {
          const token = localStorage.getItem('auth_token');
          const response = await fetch('/api/auth-callback', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              code: event.data.code,
              platform: 'youtube'
            })
          });
          
          if (response.ok) {
            await checkConnection();
            toast({
              title: "התחברת בהצלחה!",
              description: "החיבור ל-YouTube הושלם",
            });
          } else {
            const error = await response.json();
            throw new Error(error.error || 'Authentication failed');
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
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [toast]);

  return (
    <div className="container mx-auto p-6 max-w-4xl" dir="rtl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">ניהול YouTube</h1>
        <p className="text-muted-foreground">
          נהל את הסרטונים שלך ב-YouTube עם בקרת פרטיות מתקדמת
        </p>
      </div>

      <div className="space-y-6">
        {!isConnected ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Youtube className="h-5 w-5 text-red-500" />
                התחבר ל-YouTube
              </CardTitle>
              <CardDescription>
                התחבר לחשבון ה-YouTube שלך כדי לנהל את הסרטונים
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={connectYouTube} 
                disabled={loading}
                className="bg-red-500 hover:bg-red-600"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                {loading ? 'מתחבר...' : 'התחבר ל-YouTube'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Connection Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Youtube className="h-5 w-5 text-red-500" />
                    ניהול YouTube
                    {channelTitle && (
                      <Badge variant="secondary">{channelTitle}</Badge>
                    )}
                  </div>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={disconnectYouTube}
                    disabled={loading}
                  >
                    <Unlink className="h-4 w-4 mr-2" />
                    התנתק מיוטיוב
                  </Button>
                </CardTitle>
              </CardHeader>
            </Card>

            {/* Video List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>רשימת הסרטונים שלך</span>
                  <Button 
                    variant="outline" 
                    onClick={loadVideos} 
                    disabled={loading}
                    size="sm"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'רענן'}
                  </Button>
                </CardTitle>
                {videos.length > 0 && (
                  <CardDescription>
                    {videos.length} סרטונים נמצאו
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {loading && videos.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="mr-2">טוען סרטונים...</span>
                  </div>
                ) : videos.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    לא נמצאו סרטונים
                  </div>
                ) : (
                  <div className="space-y-4">
                    {videos.map((video) => (
                      <div key={video.id} className="border rounded-lg p-4">
                        <div className="flex gap-4">
                          {/* Thumbnail */}
                          <img 
                            src={video.thumbnail} 
                            alt={video.title}
                            className="w-24 h-16 object-cover rounded"
                          />

                          {/* Video Info */}
                          <div className="flex-1">
                            <h3 className="font-medium text-sm leading-tight">{video.title}</h3>
                            <div className="text-xs text-muted-foreground mt-1">
                              {new Date(video.publishedAt).toLocaleDateString('he-IL')}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              צפיות: {video.viewCount}
                            </div>
                          </div>

                          {/* Status and Actions */}
                          <div className="flex flex-col items-end gap-2">
                            <Badge variant={video.privacyStatus === 'public' ? "default" : "secondary"}>
                              {video.privacyStatus === 'public' ? "ציבורי" : "פרטי"}
                            </Badge>
                            
                            {/* Individual Hide/Show Button */}
                            <Button 
                              variant={video.privacyStatus === 'public' ? "destructive" : "default"}
                              size="sm"
                              onClick={() => video.privacyStatus === 'public' ? hideVideo(video.id) : showVideo(video.id)}
                              disabled={loading}
                            >
                              {video.privacyStatus === 'public' ? (
                                <>
                                  <EyeOff className="h-3 w-3 mr-1" />
                                  הסתר
                                </>
                              ) : (
                                <>
                                  <Eye className="h-3 w-3 mr-1" />
                                  הצג
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}