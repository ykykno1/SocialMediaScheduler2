import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Youtube, Play, Eye, EyeOff, ExternalLink, Unlink, Loader2 } from 'lucide-react';
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
        window.location.href = authUrl;
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
        toast({
          title: "הותנקת בהצלחה מיוטיוב",
          description: "כעת ניתן להתחבר מחדש",
        });
      } else {
        const error = await response.json();
        setError(error.error || 'Failed to disconnect');
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
        setVideos(videosData);
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
      const token = localStorage.getItem('token');
      
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

  const restoreVideos = async () => {
    if (selectedVideos.length === 0) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
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

  const toggleVideoSelection = (videoId: string) => {
    setSelectedVideos(prev => 
      prev.includes(videoId) 
        ? prev.filter(id => id !== videoId)
        : [...prev, videoId]
    );
  };

  const selectAllPublic = () => {
    const publicVideos = videos.filter(v => v.privacyStatus === 'public').map(v => v.id);
    setSelectedVideos(publicVideos);
  };

  const selectAllPrivate = () => {
    const privateVideos = videos.filter(v => v.privacyStatus === 'private').map(v => v.id);
    setSelectedVideos(privateVideos);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('he-IL');
  };

  // Check URL params for connection status
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('youtube') === 'connected') {
      setIsConnected(true);
      loadVideos();
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get('youtube') === 'error') {
      setError('Failed to connect to YouTube');
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Youtube className="h-8 w-8 text-red-500" />
            YouTube Management
          </h1>
          <p className="text-gray-600">
            Connect your YouTube channel to manage video visibility during Shabbat
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
                Connect YouTube Channel
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
                    {user?.youtubeChannelTitle && (
                      <Badge variant="secondary">{user.youtubeChannelTitle}</Badge>
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
                    onClick={disconnectYouTube}
                    disabled={loading}
                    variant="destructive"
                    size="sm"
                  >
                    <Unlink className="h-4 w-4 mr-2" />
                    התנתק מיוטיוב
                  </Button>
                  
                  {selectedVideos.length > 0 && (
                    <>
                      <Button 
                        onClick={hideVideos} 
                        disabled={loading}
                        variant="destructive"
                      >
                        <EyeOff className="h-4 w-4 mr-2" />
                        Hide Selected ({selectedVideos.length})
                      </Button>
                      
                      <Button 
                        onClick={restoreVideos} 
                        disabled={loading}
                        variant="default"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Restore Selected ({selectedVideos.length})
                      </Button>
                    </>
                  )}
                </div>
                
                {videos.length > 0 && (
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline" onClick={selectAllPublic}>
                      Select All Public ({videos.filter(v => v.privacyStatus === 'public').length})
                    </Button>
                    <Button size="sm" variant="outline" onClick={selectAllPrivate}>
                      Select All Private ({videos.filter(v => v.privacyStatus === 'private').length})
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setSelectedVideos([])}>
                      Clear Selection
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Videos List */}
            {loading && (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p>Loading videos...</p>
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
                          src={video.thumbnailUrl} 
                          alt={video.title}
                          className="w-full h-32 object-cover rounded"
                        />
                        <div className="absolute top-2 right-2">
                          <Badge 
                            variant={video.privacyStatus === 'public' ? 'default' : 'secondary'}
                          >
                            {video.privacyStatus}
                          </Badge>
                        </div>
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
                        <p>Published: {formatDate(video.publishedAt)}</p>
                        {video.viewCount && (
                          <p>Views: {parseInt(video.viewCount).toLocaleString()}</p>
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
                  <p className="text-gray-600">No videos found on your channel</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}