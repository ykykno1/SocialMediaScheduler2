import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Youtube, Eye, EyeOff, Loader2, AlertCircle, Lock, Unlock, ExternalLink, RefreshCw, Play, Unlink } from 'lucide-react';
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
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
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
        throw new Error('Failed to load videos');
      }
    } catch (error) {
      console.error('Error loading videos:', error);
      toast({
        title: "שגיאה",
        description: "שגיאה בטעינת הסרטונים",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const connectYouTube = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/youtube/auth-url', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Opening YouTube auth URL:', data.authUrl);
        console.log('Opening in new window...');
        window.open(data.authUrl, '_self');
      } else {
        throw new Error('Failed to get auth URL');
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

  const disconnectYouTube = async () => {
    try {
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
          title: "הותנתקת בהצלחה",
          description: "החיבור ל-YouTube נותק",
        });
      } else {
        throw new Error('Failed to disconnect');
      }
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Selection functions - copied from working version
  const selectAllPublic = () => {
    const publicVideos = videos.filter(v => v.privacyStatus === 'public').map(v => v.id);
    setSelectedVideos(publicVideos);
  };

  const selectAllPrivate = () => {
    const privateVideos = videos.filter(v => v.privacyStatus === 'private').map(v => v.id);
    setSelectedVideos(privateVideos);
  };

  const toggleVideoSelection = (videoId: string) => {
    setSelectedVideos(prev => 
      prev.includes(videoId) 
        ? prev.filter(id => id !== videoId)
        : [...prev, videoId]
    );
  };

  // Bulk hide/restore functions
  const hideVideos = async () => {
    if (selectedVideos.length === 0) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch('/api/youtube/hide', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ videoIds: selectedVideos })
      });
      
      if (response.ok) {
        await loadVideos();
        setSelectedVideos([]);
        toast({
          title: "הצלחה!",
          description: `${selectedVideos.length} סרטונים הוסתרו בהצלחה`,
        });
      } else {
        const error = await response.json();
        toast({
          title: "שגיאה",
          description: error.error || 'שגיאה בהסתרת הסרטונים',
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "שגיאה בהסתרת הסרטונים",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const restoreVideos = async () => {
    if (selectedVideos.length === 0) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch('/api/youtube/restore', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ videoIds: selectedVideos })
      });
      
      if (response.ok) {
        await loadVideos();
        setSelectedVideos([]);
        toast({
          title: "הצלחה!",
          description: `${selectedVideos.length} סרטונים שוחזרו בהצלחה`,
        });
      } else {
        const error = await response.json();
        toast({
          title: "שגיאה",
          description: error.error || 'שגיאה בשחזור הסרטונים',
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "שגיאה בשחזור הסרטונים",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Lock/unlock functions - copied from working version
  const toggleVideoLock = async (videoId: string) => {
    const video = videos.find(v => v.id === videoId);
    if (!video) return;

    try {
      const token = localStorage.getItem('auth_token');
      
      if (video.isLocked) {
        // בטל נעילה - בקש סיסמה
        const password = prompt("הכנס את הסיסמה שלך כדי לבטל את נעילת הסרטון:");
        if (!password) return;
        
        const response = await fetch(`/api/youtube/video/${videoId}/unlock`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ password })
        });
        
        if (response.ok) {
          await loadVideos();
          toast({
            title: "נעילת הסרטון בוטלה",
            description: "הסרטון שוחזר למצב המקורי ויכלל במבצעי הסתרה/הצגה",
          });
        } else {
          const error = await response.json();
          toast({
            title: "שגיאה",
            description: error.error || 'שגיאה בביטול נעילת הסרטון',
            variant: "destructive"
          });
        }
      } else {
        // נעל סרטון - ללא סיסמה
        const response = await fetch(`/api/youtube/video/${videoId}/lock`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ reason: "user_manual" })
        });
        
        if (response.ok) {
          await loadVideos();
          
          const isHidden = video.isHidden;
          toast({
            title: "הסרטון ננעל",
            description: isHidden 
              ? "הסרטון לא ישוחזר בצאת השבת" 
              : "הסרטון נשאר גלוי ולא יוסתר בשבת",
          });
        } else {
          const error = await response.json();
          toast({
            title: "שגיאה",
            description: error.error || 'שגיאה בנעילת הסרטון',
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "שגיאה בעדכון נעילת הסרטון",
        variant: "destructive"
      });
    }
  };

  // Individual hide/show functions - copied from working version
  const hideVideo = async (videoId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch('/api/youtube/hide', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ videoIds: [videoId] })
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
          description: error.error || "שגיאה בהסתרת הסרטון",
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
      
      const response = await fetch('/api/youtube/restore', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ videoIds: [videoId] })
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
          description: error.error || "שגיאה בהצגת הסרטון",
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
                  >
                    התנתק
                  </Button>
                </CardTitle>
              </CardHeader>
            </Card>

            {/* Video List - Starting Clean */}
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
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    רענן
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
                            <Badge variant={video.isHidden ? "destructive" : "default"}>
                              {video.isHidden ? "פרטי" : "פומבי"}
                            </Badge>
                            
                            {/* Individual Hide/Show Button - like old version */}
                            <Button 
                              variant={video.isHidden ? "default" : "destructive"}
                              size="sm"
                              onClick={() => video.isHidden ? showVideo(video.id) : hideVideo(video.id)}
                              disabled={loading}
                            >
                              {video.isHidden ? (
                                <>
                                  <Eye className="h-3 w-3 mr-1" />
                                  הצג
                                </>
                              ) : (
                                <>
                                  <EyeOff className="h-3 w-3 mr-1" />
                                  הסתר
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