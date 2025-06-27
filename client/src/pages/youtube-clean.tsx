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
                    disabled={loading}
                  >
                    <Unlink className="h-4 w-4 mr-2" />
                    התנתק מיוטיוב
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 flex-wrap items-center">
                  <Button onClick={loadVideos} disabled={loading}>
                    <Play className="h-4 w-4 mr-2" />
                    רענן רשימת סרטונים
                  </Button>
                  
                  <Button 
                    onClick={async () => {
                      const publicVideos = videos.filter(v => v.privacyStatus === 'public').map(v => v.id);
                      setSelectedVideos(publicVideos);
                      await hideVideos();
                    }} 
                    disabled={loading || videos.filter(v => v.privacyStatus === 'public').length === 0}
                    variant="destructive"
                  >
                    <EyeOff className="h-4 w-4 mr-2" />
                    הסתר הכל ({videos.filter(v => v.privacyStatus === 'public').length})
                  </Button>
                  
                  <Button 
                    onClick={async () => {
                      const privateVideos = videos.filter(v => v.privacyStatus === 'private').map(v => v.id);
                      setSelectedVideos(privateVideos);
                      await restoreVideos();
                    }} 
                    disabled={loading || videos.filter(v => v.privacyStatus === 'private').length === 0}
                    variant="default"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    הצג הכל ({videos.filter(v => v.privacyStatus === 'private').length})
                  </Button>
                  
                  {selectedVideos.length > 0 && (
                    <>
                      <Button 
                        onClick={hideVideos} 
                        disabled={loading}
                        variant="destructive"
                      >
                        <EyeOff className="h-4 w-4 mr-2" />
                        הסתר נבחרים ({selectedVideos.length})
                      </Button>
                      
                      <Button 
                        onClick={restoreVideos} 
                        disabled={loading}
                        variant="default"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        שחזר נבחרים ({selectedVideos.length})
                      </Button>
                    </>
                  )}
                </div>
                
                {videos.length > 0 && (
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline" onClick={selectAllPublic}>
                      בחר כל הציבוריים ({videos.filter(v => v.privacyStatus === 'public').length})
                    </Button>
                    <Button size="sm" variant="outline" onClick={selectAllPrivate}>
                      בחר כל הפרטיים ({videos.filter(v => v.privacyStatus === 'private').length})
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setSelectedVideos([])}>
                      נקה בחירה
                    </Button>
                  </div>
                )}
              </CardContent>
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
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {videos.map((video) => (
                      <Card 
                        key={video.id} 
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedVideos.includes(video.id) ? 'ring-2 ring-blue-500' : ''
                        }`}
                        onClick={() => toggleVideoSelection(video.id)}
                      >
                        <CardContent className="p-4">
                          <div className="relative mb-3">
                            <img 
                              src={video.thumbnail} 
                              alt={video.title}
                              className="w-full h-32 object-cover rounded"
                              onError={(e) => {
                                e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="180" viewBox="0 0 300 180"><rect width="300" height="180" fill="%23ddd"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999">תמונה</text></svg>';
                              }}
                            />
                            <div className="absolute top-2 right-2 flex gap-1">
                              <Badge 
                                variant={video.privacyStatus === 'public' ? 'default' : 'secondary'}
                              >
                                {video.privacyStatus === 'public' ? 'ציבורי' : 'פרטי'}
                              </Badge>
                              {video.isHidden && (
                                <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                                  <EyeOff className="h-3 w-3 mr-1" />
                                  הוסתר
                                </Badge>
                              )}
                              {video.isLocked && (
                                <Badge variant="destructive" className="bg-orange-500">
                                  <Lock className="h-3 w-3" />
                                </Badge>
                              )}
                            </div>
                            
                            <div className="absolute top-2 left-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="bg-white/80 hover:bg-white/90 p-1 h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleVideoLock(video.id);
                                }}
                              >
                                {video.isLocked ? (
                                  <Lock className="h-3 w-3 text-orange-600" />
                                ) : (
                                  <Unlock className="h-3 w-3 text-gray-600" />
                                )}
                              </Button>
                            </div>
                            {video.isHidden && (
                              <div className="absolute inset-0 bg-gray-500/60 rounded flex items-center justify-center">
                                <div className="text-center">
                                  <EyeOff className="h-8 w-8 text-white mx-auto mb-2" />
                                  <span className="text-white text-sm font-medium">סרטון מוסתר</span>
                                </div>
                              </div>
                            )}
                            {selectedVideos.includes(video.id) && (
                              <div className="absolute inset-0 bg-blue-500/20 rounded flex items-center justify-center">
                                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-sm">✓</span>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <h3 className="font-semibold text-sm mb-2 line-clamp-2">
                            {video.title}
                          </h3>
                          
                          <div className="text-xs text-gray-500 space-y-1">
                            <p>פורסם: {new Date(video.publishedAt).toLocaleDateString('he-IL')}</p>
                            {video.viewCount && (
                              <p>צפיות: {parseInt(video.viewCount).toLocaleString()}</p>
                            )}
                          </div>
                          
                          <div className="flex gap-2 mt-3">
                            {video.privacyStatus === 'public' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  hideVideo(video.id);
                                }}
                              >
                                <EyeOff className="h-4 w-4 mr-1" />
                                הסתר
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 text-green-600 border-green-300 hover:bg-green-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  showVideo(video.id);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                הצג
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* הסבר על סרטונים נעולים וניהול */}
            {videos.length > 0 && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="text-sm font-medium text-blue-900 mb-2">מידע על מצבי סרטונים</h3>
                  <p className="text-sm text-blue-700">
                    סרטונים המסומנים כ"פרטי" כבר מוסתרים מהציבור. ניתן להציגם בחזרה או להשאיר אותם מוסתרים.
                    לחץ על סרטונים כדי לבחור אותם לפעולות קבוצתיות.
                  </p>
                </div>
                
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <h3 className="text-sm font-medium text-orange-900 mb-2 flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    סרטונים נעולים
                  </h3>
                  <p className="text-sm text-orange-700 mb-2">
                    סרטונים נעולים לא יושפעו מפעולות האסתרה והצגה האוטומטיות. הם ישארו במצבם הנוכחי עד שתבחר לשחרר את הנעילה.
                  </p>
                  <p className="text-sm text-orange-700">
                    לנעילת סרטון: לחץ על כפתור המנעול. לביטול נעילה: יידרש הזנת סיסמה.
                  </p>
                </div>

                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h3 className="text-sm font-medium text-green-900 mb-2">כיצד להשתמש בממשק</h3>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• לחץ על סרטון כדי לבחור אותו לפעולות קבוצתיות</li>
                    <li>• השתמש בכפתורי "בחר כל הציבוריים/פרטיים" לבחירה מהירה</li>
                    <li>• כפתורי "הסתר/הצג" פועלים על סרטון בודד</li>
                    <li>• כפתורי "הסתר/שחזר נבחרים" פועלים על כל הסרטונים הנבחרים</li>
                    <li>• סרטונים נעולים מוגנים מפעולות אוטומטיות</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}