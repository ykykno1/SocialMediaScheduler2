import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Youtube, Play, Eye, EyeOff, ExternalLink, Unlink, Loader2, Lock, Unlock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  privacyStatus: 'public' | 'private' | 'unlisted';
  viewCount?: string;
  likeCount?: string;
  isLocked?: boolean;
}

export default function YouTubePage() {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [channelTitle, setChannelTitle] = useState('');
  const { toast } = useToast();

  const checkConnection = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      // Get user info
      const userResponse = await fetch('/api/user', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUser(userData);

        // Check YouTube connection status
        const youtubeResponse = await fetch('/api/youtube/auth-status', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (youtubeResponse.ok) {
          const youtubeStatus = await youtubeResponse.json();
          setIsConnected(youtubeStatus.isAuthenticated);
          
          if (youtubeStatus.isAuthenticated && youtubeStatus.channelTitle) {
            setChannelTitle(youtubeStatus.channelTitle);
            loadVideos();
          }
        }
      }
    } catch (error) {
      console.error('Error checking connection:', error);
    }
  };

  const connectYouTube = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch('/api/youtube/auth-url', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const { authUrl } = await response.json();
        console.log('Opening YouTube auth URL:', authUrl);
        console.log('Opening in new window...');
        const newWindow = window.open(authUrl, '_blank', 'width=600,height=700');
        if (!newWindow) {
          console.log('Popup blocked, trying direct redirect...');
          window.location.href = authUrl;
        }
      } else {
        const error = await response.json();
        setError('שגיאה בהתחברות ל-YouTube: יש צורך בהגדרת Google OAuth');
      }
    } catch (error) {
      setError('Failed to connect to YouTube');
    } finally {
      setLoading(false);
    }
  };

  const disconnectYouTube = async () => {
    try {
      setLoading(true);
      toast({
        title: "מתנתק מיוטיוב...",
        description: "מוחק את הטוקנים",
      });
      
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/youtube/disconnect', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        setIsConnected(false);
        setVideos([]);
        setSelectedVideos([]);
        setChannelTitle('');
        toast({
          title: "הצלחה!",
          description: "התנתקת בהצלחה מ-YouTube",
        });
      } else {
        const error = await response.json();
        setError(error.error || 'Failed to disconnect from YouTube');
      }
    } catch (error) {
      setError('Failed to disconnect from YouTube');
    } finally {
      setLoading(false);
    }
  };

  const loadVideos = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch('/api/youtube/videos', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const videosData = await response.json();
        console.log('Received videos data:', videosData);
        setVideos(videosData.videos || videosData);
      } else {
        const error = await response.json();
        setError(error.error || 'Failed to load videos');
      }
    } catch (error) {
      setError('Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

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
      } else {
        const error = await response.json();
        setError(error.error || 'Failed to hide videos');
      }
    } catch (error) {
      setError('Failed to hide videos');
    } finally {
      setLoading(false);
    }
  };

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('he-IL');
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
      } else {
        const error = await response.json();
        setError(error.error || 'Failed to restore videos');
      }
    } catch (error) {
      setError('Failed to restore videos');
    } finally {
      setLoading(false);
    }
  };

  const toggleVideoLock = async (videoId: string) => {
    const video = videos.find(v => v.id === videoId);
    if (!video) return;

    // בקש סיסמה אם מנעל סרטון
    if (!video.isLocked) {
      const password = prompt('הזן את הסיסמה שלך כדי לנעול את הסרטון:');
      if (!password) return;

      try {
        const token = localStorage.getItem('auth_token');
        
        const response = await fetch('/api/youtube/lock-video', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ videoId, password, action: 'lock' })
        });
        
        if (response.ok) {
          await loadVideos();
          toast({
            title: "הצלחה!",
            description: "הסרטון ננעל בהצלחה",
          });
        } else {
          const error = await response.json();
          toast({
            title: "שגיאה",
            description: error.message || "סיסמה שגויה",
            variant: "destructive"
          });
        }
      } catch (error) {
        toast({
          title: "שגיאה",
          description: "שגיאה בנעילת הסרטון",
          variant: "destructive"
        });
      }
    } else {
      // בטל נעילה ללא סיסמה
      try {
        const token = localStorage.getItem('auth_token');
        
        const response = await fetch('/api/youtube/lock-video', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ videoId, action: 'unlock' })
        });
        
        if (response.ok) {
          await loadVideos();
          toast({
            title: "הצלחה!",
            description: "הנעילה בוטלה בהצלחה",
          });
        } else {
          const error = await response.json();
          toast({
            title: "שגיאה",
            description: error.message || "שגיאה בביטול הנעילה",
            variant: "destructive"
          });
        }
      } catch (error) {
        toast({
          title: "שגיאה",
          description: "שגיאה בביטול הנעילה",
          variant: "destructive"
        });
      }
    }
  };

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
            toast({
              title: "הצלחה!",
              description: "התחברת בהצלחה ל-YouTube",
            });
            checkConnection();
          } else {
            const error = await response.json();
            setError(`שגיאה בחיבור ל-YouTube: ${error.error || 'שגיאה לא ידועה'}`);
          }
        } catch (error) {
          console.error('Error processing YouTube auth:', error);
          setError('שגיאה בעיבוד האימות');
        } finally {
          setLoading(false);
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Youtube className="h-8 w-8 text-red-500" />
            ניהול YouTube
          </h1>
          <p className="text-gray-600">
            התחבר לערוץ YouTube שלך כדי לנהל נראות סרטונים במהלך השבת
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="font-medium mb-1">שגיאה בהתחברות ל-YouTube</p>
                <p className="text-sm">{error}</p>
                {error.includes('OAuth') && (
                  <div className="mt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open('/oauth-setup', '_blank')}
                      className="text-red-700 border-red-300 bg-red-50"
                    >
                      פתח הוראות תיקון
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                )}
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700"
              >
                ✕
              </Button>
            </div>
          </div>
        )}

        {!isConnected ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Youtube className="h-5 w-5 text-red-500" />
                התחבר לערוץ YouTube
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                התחבר לערוץ YouTube שלך כדי להסתיר אוטומטית את הסרטונים שלך בשבת ולשחזר אותם אחר כך.
              </p>
              
              {error && error.includes('OAuth') && (
                <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-orange-800 text-sm mb-2">
                    <strong>נדרשת הגדרה חד-פעמית:</strong> יש צורך להוסיף redirect URI ב-Google Cloud Console
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open('/oauth-setup', '_blank')}
                    className="text-orange-700 border-orange-300"
                  >
                    הוראות תיקון מפורטות
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              )}
              
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

            {/* Videos List */}
            {loading && (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p>טוען סרטונים...</p>
              </div>
            )}

            {videos.length > 0 && (
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
                          src={video.thumbnail || video.thumbnailUrl} 
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
                        <p>פורסם: {formatDate(video.publishedAt)}</p>
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
                            onClick={() => hideVideo(video.id)}
                          >
                            <EyeOff className="h-4 w-4 mr-1" />
                            הסתר
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-green-600 border-green-300 hover:bg-green-50"
                            onClick={() => showVideo(video.id)}
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

            {!loading && videos.length === 0 && isConnected && (
              <Card>
                <CardContent className="text-center py-8">
                  <Youtube className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">לא נמצאו סרטונים בערוץ</p>
                </CardContent>
              </Card>
            )}

            {/* הסבר על סרטונים נעולים */}
            {videos.length > 0 && (
              <div className="mt-6 space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="text-sm font-medium text-blue-900 mb-2">מידע על סרטונים מוסתרים</h3>
                  <p className="text-sm text-blue-700">
                    סרטונים המסומנים כ"פרטי" כבר מוסתרים מהציבור. ניתן להציגם בחזרה או להשאיר אותם מוסתרים.
                  </p>
                </div>
                
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <h3 className="text-sm font-medium text-orange-900 mb-2 flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    סרטונים נעולים
                  </h3>
                  <p className="text-sm text-orange-700">
                    סרטונים נעולים לא יוצגו באופן אוטומטי בצאת השבת. הם ישארו מוסתרים עד שתבחר להציגם ידנית.
                    זה מאפשר לשמור סרטונים מסוימים פרטיים גם לאחר השבת.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}